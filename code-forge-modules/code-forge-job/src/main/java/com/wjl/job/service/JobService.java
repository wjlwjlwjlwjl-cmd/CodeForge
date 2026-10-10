package com.wjl.job.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.core.utils.ColorLog;
import com.wjl.domain.constants.CacheConstants;
import com.wjl.domain.constants.CommonConstants;
import com.wjl.domain.domain.dto.*;
import com.wjl.domain.exception.ServiceException;
import com.wjl.job.domain.dto.SubmitInfoDTO;
import com.wjl.job.domain.vo.SubmitDetailVO;
import com.wjl.job.domain.vo.SubmitHistoryVO;
import com.wjl.job.domain.vo.SubmitVO;
import com.wjl.job.entity.Question;
import com.wjl.job.entity.UserSubmit;
import com.wjl.job.mapper.QuestionMapper;
import com.wjl.job.mapper.UserSubmitMapper;
import com.wjl.rabbitmq.utils.RabbitmqUtil;
import com.wjl.redis.service.RedisService;
import com.wjl.redis.util.CacheUtil;
import com.wjl.security.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class JobService {
    @Autowired
    private TokenService tokenService;
    @Autowired
    private RabbitmqUtil rabbitmqUtil;
    @Autowired
    private UserSubmitMapper userSubmitMapper;
    @Autowired
    private QuestionMapper questionMapper;
    @Autowired
    private RedisService redisService;

    public void handleSubmit(String token, SubmitInfoDTO submitInfoDTO) {
        LoginUserDTO loginUserDTO = tokenService.getCLoginUser(token);
        if(loginUserDTO == null) throw new ServiceException(ResultCode.FAILED_UNAUTHORIZED.getCode(), ResultCode.FAILED_UNAUTHORIZED.getMsg());

        String userId =  loginUserDTO.getUserId();
        Long questionId = submitInfoDTO.getQuestionId();
        Long examId = submitInfoDTO.getExamId();
        String userCode = submitInfoDTO.getUserCode();

        String checkFrequency = CacheUtil.getSubmitIntervalKey(Long.valueOf(userId));
        if(redisService.hasKey(checkFrequency)){
            return;
        }
        redisService.setCacheObject(checkFrequency, checkFrequency, CacheConstants.SUBMIT_INTERVAL_SEC, TimeUnit.SECONDS);

        //获取完整代码和用例
        if(questionId == null){
            throw new ServiceException(ResultCode.FAILED_NOT_EXISTS.getCode(), ResultCode.FAILED_NOT_EXISTS.getMsg());
        }
        Question question = questionMapper.selectById(questionId);
        if(question == null){
            throw new ServiceException(ResultCode.FAILED_NOT_EXISTS.getCode(), ResultCode.FAILED_NOT_EXISTS.getMsg());
        }
        String mainFunc = question.getMainFuc();
        if (mainFunc == null || userCode == null) {
            throw new ServiceException(ResultCode.FAILED_NOT_EXISTS.getCode(), ResultCode.FAILED_NOT_EXISTS.getMsg());
        }
        String sourceCode = mainFunc.replace("{{USER_CODE}}", userCode);
        String title = question.getTitle();
        ColorLog.info(title);

        String questionCase = question.getQuestionCase();
        // 1. 空值保护
        if (!StringUtils.hasText(questionCase)) {
            throw new ServiceException(ResultCode.FAILED_NOT_EXISTS.getCode(), ResultCode.FAILED_NOT_EXISTS.getMsg());
        }
        List<TestCaseDTO> testCases = new ArrayList<>();

        // 2. 按行拆分，每行一条用例
        String[] lines = questionCase.split("\n");
        for (String line : lines) {

            // 3. 跳过空行
            if (!StringUtils.hasText(line)) {
                continue;
            }

            // 4. 按 ||| 拆分，限制为 2 段
            //    用 \\|\\|\\| 是因为 | 在正则中是特殊字符
            //    限制 2 段是为了防止 expectedOutput 本身含 ||| 时被误拆
            String[] parts = line.split("\\|\\|\\|", 2);

            if (parts.length != 2) {
                ColorLog.error(
                        "用例格式错误，应为 input|||expectedOutput，实际为: {}", line);
                throw new ServiceException(ResultCode.FAILED_NOT_EXISTS.getCode(), ResultCode.FAILED_NOT_EXISTS.getMsg());
            }

            // 5. 把字面量 \n 还原成真正的换行
            //    Java 字符串里 "\\n" 表示两个字符 \ 和 n
            //    "\n" 表示一个换行符
            String input = parts[0].replace("\\n", "\n");
            String expectedOutput = parts[1].replace("\\n", "\n");

            // 6. 构造 TestCaseDTO
            testCases.add(TestCaseDTO.builder()
                    .input(input)
                    .expectedOutput(expectedOutput)
                    .build());
        }

        //在这里对判题请求信息进行填写
        //在前面接收到判题请求时，user_code、create_by、create_time已插入数据库，
        UserSubmit userSubmit = new UserSubmit();
        userSubmit.setUserId(Long.valueOf(userId));
        userSubmit.setProgramType(0); //已经通过LanguageProfile抽象出了语言配置，但是目前只支持Java
        userSubmit.setQuestionId(questionId);
        userSubmit.setUserCode(userCode);
        userSubmit.setCreateBy(Long.valueOf(userId));
        userSubmit.setCreateTime(LocalDateTime.now());
        userSubmit.setTitle(title);
        ColorLog.info(userSubmit.toString());
        userSubmitMapper.insert(userSubmit);

        ColorLog.info(userSubmitMapper.selectById(userSubmit.getSubmitId()).getTitle());

        Long submitId = userSubmit.getSubmitId();
        //完成前置信息入库，接下验证 qid 和 eid，从数据库获取，构建判题请求
        JudgeRequestDTO judgeRequestDTO = new JudgeRequestDTO();
        judgeRequestDTO.setSubmitId(submitId);
        judgeRequestDTO.setUserId(Long.valueOf(userId));
        judgeRequestDTO.setExamId(examId);
        judgeRequestDTO.setQuestionId(questionId);
        judgeRequestDTO.setSourceCode(sourceCode);
        judgeRequestDTO.setLang(submitInfoDTO.getLang());

        //从数据库中获取TestCaseDTO
        judgeRequestDTO.setTestCases(testCases);

        try{
            String cases = new ObjectMapper().writeValueAsString(judgeRequestDTO);
            ColorLog.info(cases);
        }
        catch(IOException e){
            ColorLog.error(e.getMessage());
        }

        //发送判题消息到判题请求队列
        rabbitmqUtil.sendToExchange(CommonConstants.JUDGE_EXCHANGE, CommonConstants.JAVA_ROUTING_KEY, judgeRequestDTO);
    }

    //缓存存在缺陷
    public SubmitHistoryVO quesSubmitHistory(String token, Long questionId, int pageNum) {
        SubmitHistoryVO submitHistoryVO = new SubmitHistoryVO();
        int pageSize = CommonConstants.PAGE_SIZE;
        List<UserSubmit> list = null;
        if(pageNum <= 0){
            pageNum = 1;
        }

        //获取用户某道题的全部提交记录
        LoginUserDTO loginUserDTO = tokenService.getCLoginUser(token);
        if(loginUserDTO == null){
            throw new ServiceException(ResultCode.FAILED_UNAUTHORIZED.getCode(), ResultCode.FAILED_UNAUTHORIZED.getMsg());
        }
        String userId = loginUserDTO.getUserId();

        String cacheKey = CacheUtil.getQuesSubmitKey(questionId, Long.valueOf(userId));
        Long total = 0L;
        if(redisService.hasKey(cacheKey)){
            //直接从redis中获取题目提交记录
            list = redisService.getCacheListByRange(cacheKey, (long) pageSize * (pageNum - 1), (long) pageSize * (pageNum - 1) + pageSize - 1, UserSubmit.class);
            total = redisService.getCacheListSize(cacheKey);
        }
        else{
            PageHelper.startPage(pageNum, pageSize);
            list = userSubmitMapper.selectList(new LambdaQueryWrapper<UserSubmit>()
                    .eq(UserSubmit::getQuestionId, questionId)
                    .eq(UserSubmit::getUserId, userId)
                    .orderByDesc(UserSubmit::getCreateTime)
            );
            //redis中没有，设置进缓存
            redisService.setCacheList(cacheKey, list);
            total = userSubmitMapper.selectCount(new LambdaQueryWrapper<UserSubmit>()
                    .eq(UserSubmit::getQuestionId, questionId)
                    .eq(UserSubmit::getUserId, userId)
            );
        }
        int pages = (int) ((total + pageSize - 1) / pageSize);

        if (list == null) list = Collections.emptyList();
        submitHistoryVO.setTotal(total);
        submitHistoryVO.setPages(pages);
        submitHistoryVO.setPageNum(pageNum);
        submitHistoryVO.setPageSize(pageSize);

        if(list.isEmpty()){
            submitHistoryVO.setHas(false);
            return submitHistoryVO;
        }
        List<SubmitVO> retList = BeanCopyUtil.copyListProperties(list, SubmitVO::new);

        submitHistoryVO.setHas(true);
        submitHistoryVO.setList(retList);

        return submitHistoryVO;
    }

    public SubmitHistoryVO userSubmitHistory(String token, int pageNum) {
        SubmitHistoryVO submitHistoryVO = new SubmitHistoryVO();
        int pageSize = CommonConstants.PAGE_SIZE;
        List<UserSubmit> list = null;
        if(pageNum <= 0){
            pageNum = 1;
        }

        //获取用户某道题的全部提交记录
        LoginUserDTO loginUserDTO = tokenService.getCLoginUser(token);
        if(loginUserDTO == null){
            throw new ServiceException(ResultCode.FAILED_UNAUTHORIZED.getCode(), ResultCode.FAILED_UNAUTHORIZED.getMsg());
        }
        String userId = loginUserDTO.getUserId();

        String cacheKey = CacheUtil.getUserSubmitKey(Long.valueOf(userId));
        Long total;
        if(redisService.hasKey(cacheKey)){
            //直接从redis中获取题目提交记录
            ColorLog.info("从redis获取{}", cacheKey);
            list = redisService.getCacheListByRange(cacheKey, (long) pageSize * (pageNum - 1), (long) pageSize * (pageNum - 1) + pageSize - 1, UserSubmit.class);
            total = redisService.getCacheListSize(cacheKey);
        }
        else{
            PageHelper.startPage(pageNum, pageSize);
            list = userSubmitMapper.selectList(new LambdaQueryWrapper<UserSubmit>()
                    .eq(UserSubmit::getUserId, userId)
                    .orderByDesc(UserSubmit::getCreateTime)
            );
            //redis中没有，设置进缓存
            redisService.setCacheList(cacheKey, list);
            total = userSubmitMapper.selectCount(new LambdaQueryWrapper<UserSubmit>()
                    .eq(UserSubmit::getUserId, userId)
            );
        }
        int pages = (int) ((total + pageSize - 1) / pageSize);

        if (list == null) list = Collections.emptyList();
        submitHistoryVO.setTotal(total);
        submitHistoryVO.setPages(pages);
        submitHistoryVO.setPageNum(pageNum);
        submitHistoryVO.setPageSize(pageSize);

        if(list.isEmpty()){
            submitHistoryVO.setHas(false);
            return submitHistoryVO;
        }
        List<SubmitVO> retList = BeanCopyUtil.copyListProperties(list, SubmitVO::new);

        submitHistoryVO.setHas(true);
        submitHistoryVO.setList(retList);

        return submitHistoryVO;
    }

    public SubmitDetailVO getSubmitDetail(Long submitId) {
        String cacheKey = CacheUtil.getSubmitDetail(submitId);
        if(redisService.hasKey(cacheKey)){
            ColorLog.info("submit detail" + cacheKey + " exists");
            return redisService.getCacheObject(cacheKey, SubmitDetailVO.class);
        }

        ColorLog.info("submit detail" + cacheKey + " not exists");
        SubmitDetailVO submitDetailVO = new SubmitDetailVO();
        UserSubmit userSubmit = userSubmitMapper.selectById(submitId);
        if(userSubmit == null){
            throw new ServiceException(ResultCode.FAILED_NOT_EXISTS.getCode(), ResultCode.FAILED_NOT_EXISTS.getMsg());
        }
        BeanCopyUtil.copyProperties(userSubmit, submitDetailVO);
        redisService.setCacheObject(cacheKey, submitDetailVO);
        return submitDetailVO;
    }
}
