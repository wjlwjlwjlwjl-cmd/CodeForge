package com.wjl.system.service.question;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.wjl.constants.CacheConstants;
import com.wjl.constants.CommonConstants;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.core.utils.ColorLog;
import com.wjl.domain.dto.LoginUserDTO;
import com.wjl.exception.ServiceException;
import com.wjl.redis.service.RedisService;
import com.wjl.redis.util.CacheUtil;
import com.wjl.security.service.TokenService;
import com.wjl.system.domain.question.dto.AddQuestionDTO;
import com.wjl.system.domain.question.dto.ListQuestionDTO;
import com.wjl.system.domain.question.dto.QuestionEditDTO;
import com.wjl.system.domain.question.vo.ListQuestionVO;
import com.wjl.system.domain.question.vo.QuestionDetailVO;
import com.wjl.system.domain.question.vo.QuestionVO;
import com.wjl.system.entity.question.Question;
import com.wjl.system.mapper.QuestionMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class QuestionService {
    @Autowired
    private QuestionMapper questionMapper;
    @Autowired
    private TokenService tokenService;
    @Autowired
    private RedisService redisService;

    public ListQuestionVO list(ListQuestionDTO listQuestionDTO) {
        ListQuestionVO listQuestionVO = new ListQuestionVO();
        int pageNum = listQuestionDTO.getPageNum(); //页码
        int pageSize = CommonConstants.PAGE_SIZE; //每页条数

        List<Question> questions;
        //先尝试从 redis 获取
        String cacheKey = CacheUtil.getQuestionListPageKey(pageNum);
        if(redisService.hasKey(cacheKey)){
            questions = redisService.getCacheList(cacheKey, Question.class);
        }
        else{
            //数据库获取并更新缓存
            PageHelper.startPage(pageNum, pageSize);
            questions = questionMapper.selectList(null);
            redisService.setCacheList(cacheKey, questions);
            redisService.expire(cacheKey, CacheConstants.QUESTION_LIST_PAGE_EXPIRATION, TimeUnit.MINUTES);
        }

        PageInfo<Question> pageInfo = new PageInfo<>(questions);
        List<QuestionVO> questionVOs = BeanCopyUtil.copyListProperties(pageInfo.getList(), QuestionVO::new);

        listQuestionVO.setList(questionVOs);
        listQuestionVO.setTotal(pageInfo.getTotal()); //total
        listQuestionVO.setPageNum(pageNum);
        listQuestionVO.setPageSize(pageSize);
        listQuestionVO.setPages(pageInfo.getPages()); //pages

        return listQuestionVO;
    }

    public String add(AddQuestionDTO dto, String token) {
        LoginUserDTO loginUserDTO = tokenService.getBLoginUser(token);
        Long userId = Long.valueOf(loginUserDTO.getUserId());

        Question question = new Question();
        BeanCopyUtil.copyProperties(dto, question);
        question.setCreateBy(userId);
        question.setCreateTime(LocalDateTime.now());
        question.setUpdateBy(userId);
        question.setUpdateTime(LocalDateTime.now());

        questionMapper.insert(question);

        //两个缓存需要失效：题目缓存，竞赛题目缓存
        redisService.scan(CacheConstants.QUESTION_LIST_PAGE_PREFIX + "*", 100, key -> {
            redisService.deleteObject(key);
        });
        redisService.scan(CacheConstants.EXAM_QUESTION_LIST_PAGE_PREFIX + "*", 100, key -> {
            redisService.deleteObject(key);
        });

        return String.format("添加成功，题目编号：%d", question.getId());
    }

    public QuestionDetailVO detail(Long id){
        QuestionDetailVO questionVO = new QuestionDetailVO();
        String cacheKey = CacheConstants.QUESTION_PREFIX + id;
        if(redisService.hasKey(cacheKey)){
            Question question = redisService.getCacheObject(cacheKey, Question.class);
            BeanCopyUtil.copyProperties(question, questionVO);
            return questionVO;
        }

        Question question = questionMapper.selectById(id);
        if(question == null){
            throw new ServiceException(ResultCode.FAILED_NOT_EXISTS.getCode(), ResultCode.FAILED_NOT_EXISTS.getMsg());
        }
        redisService.setCacheObject(cacheKey, question, CacheConstants.QUESTION_EXPIRATION, TimeUnit.MINUTES);
        BeanCopyUtil.copyProperties(question, questionVO);
        return questionVO;
    }

    public String edit(QuestionEditDTO dto, String token){
        LoginUserDTO loginUserDTO = tokenService.getBLoginUser(token);
        Long userId = Long.valueOf(loginUserDTO.getUserId());

        Question question = new Question();
        question.setUpdateBy(userId);
        question.setUpdateTime(LocalDateTime.now());

        BeanCopyUtil.copyProperties(dto, question);
        int ret = questionMapper.updateById(question); //更新数据库
        if(ret != 1){
            throw new ServiceException(ResultCode.FAILED_NOT_EXISTS.getCode(), ResultCode.FAILED_NOT_EXISTS.getMsg());
        }

        redisService.scan(CacheConstants.QUESTION_LIST_PAGE_PREFIX + "*", 100, key -> {
            redisService.deleteObject(key);
        });
        //edit 题目时，不需要失效竞赛题目列表缓存，因为保存的是 questionId

        return String.format("题目 %d 更新成功",  question.getId());
    }

    public String delete(Long id){
        int cnt = questionMapper.deleteById(id);
        if(cnt != 1){
            throw new ServiceException(ResultCode.FAILED_NOT_EXISTS.getCode(), ResultCode.FAILED_NOT_EXISTS.getMsg());
        }
        redisService.deleteObject(CacheConstants.QUESTION_PREFIX + id);

        redisService.scan(CacheConstants.QUESTION_LIST_PAGE_PREFIX + "*", 100, key -> {
            redisService.deleteObject(key);
        });

        //exam:%d:list:page:%d
        String pattern = "exam:*:list:page:*"; //当一个题目删除时，让所有竞赛题目列表的缓存失效
        redisService.scan(pattern, 100, key -> {
            redisService.deleteObject(key);
        });
        ColorLog.info("题目列表缓存已失效");

        return String.format("题目 %d 删除成功", id);
    }
}
