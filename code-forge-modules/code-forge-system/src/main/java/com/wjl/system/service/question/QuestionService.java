package com.wjl.system.service.question;

import com.github.pagehelper.PageHelper;
import com.wjl.domain.constants.CacheConstants;
import com.wjl.domain.constants.CommonConstants;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.core.utils.ColorLog;
import com.wjl.domain.domain.dto.LoginUserDTO;
import com.wjl.domain.exception.ServiceException;
import com.wjl.redis.service.RedisService;
import com.wjl.redis.util.CacheUtil;
import com.wjl.security.service.TokenService;
import com.wjl.system.document.QuestionDocument;
import com.wjl.system.domain.question.dto.AddQuestionDTO;
import com.wjl.system.domain.question.dto.ListQuestionDTO;
import com.wjl.system.domain.question.dto.QuestionEditDTO;
import com.wjl.system.domain.question.vo.ListQuestionVO;
import com.wjl.system.domain.question.vo.QuestionDetailVO;
import com.wjl.system.domain.question.vo.QuestionVO;
import com.wjl.system.entity.question.Question;
import com.wjl.system.mapper.QuestionMapper;
import com.wjl.system.repository.QuestionRepository;
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
    @Autowired
    private QuestionRepository questionRepository;

    public ListQuestionVO list(ListQuestionDTO listQuestionDTO) {
        ListQuestionVO listQuestionVO = new ListQuestionVO();
        int pageNum = listQuestionDTO.getPageNum(); //页码
        int pageSize = CommonConstants.PAGE_SIZE; //每页条数

        List<Question> questions = null;
        //先尝试从 redis 获取
        String cacheKey = CacheUtil.getQuestionListPageKey(pageNum);
        if(redisService.hasKey(cacheKey)){
            questions = redisService.getCacheList(cacheKey, Question.class);
        }
        if(questions == null){
            //数据库获取并更新缓存
            PageHelper.startPage(pageNum, pageSize);
            questions = questionMapper.selectList(null);
            // setCacheList 内部是 rightPushAll（追加）：并发时两个请求都会判定
            // hasKey=false，各写一次会让缓存里出现重复行（列表重复渲染）。
            // 写入前先删掉旧 key，保证是「覆盖」而不是「追加」。
            redisService.deleteObject(cacheKey);
            redisService.setCacheList(cacheKey, questions);
            redisService.expire(cacheKey, CacheConstants.QUESTION_LIST_PAGE_EXPIRATION, TimeUnit.MINUTES);
        }

        List<QuestionVO> questionVOs = BeanCopyUtil.copyListProperties(questions, QuestionVO::new);

        // total/pages 必须按数据库真实总数计算：
        long total = questionMapper.selectCount(null);
        int pages = (int) ((total + pageSize - 1) / pageSize);

        listQuestionVO.setList(questionVOs);
        listQuestionVO.setTotal(total);
        listQuestionVO.setPageNum(pageNum);
        listQuestionVO.setPageSize(pageSize);
        listQuestionVO.setPages(pages);

        return listQuestionVO;
    }

    //当涉及到题目的增删改操作时，es 中的查询也需要同步更改
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

        //当添加题目时，直接让所有题目列表缓存失效，竞赛题目列表不需要清除缓存
        redisService.scan(CacheConstants.QUESTION_LIST_PAGE_PREFIX + "*", 100, key -> {
            redisService.deleteObject(key);
        });

        //将题目添加到es中
        QuestionDocument questionDocument = new QuestionDocument();
        Long questionId = question.getId();
        questionDocument.setId(questionId);
        BeanCopyUtil.copyProperties(dto, questionDocument);
        questionRepository.save(questionDocument);

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

    public QuestionDetailVO next(Long id){
        QuestionDetailVO questionVO = new QuestionDetailVO();
        id += 1;
        String cacheKey = CacheConstants.QUESTION_PREFIX + id;
        if(redisService.hasKey(cacheKey)){
            Question question = redisService.getCacheObject(cacheKey, Question.class);
            BeanCopyUtil.copyProperties(question, questionVO);
            return questionVO;
        }

        Question question = questionMapper.selectById(id);
        if(question == null){
            //当前已是最后一道
            throw new ServiceException(ResultCode.FAILED_LAST_QUESTION.getCode(), ResultCode.FAILED_LAST_QUESTION.getMsg());
        }
        redisService.setCacheObject(cacheKey, question, CacheConstants.QUESTION_EXPIRATION, TimeUnit.MINUTES);
        BeanCopyUtil.copyProperties(question, questionVO);
        return questionVO;
    }

    public QuestionDetailVO prev(Long id){
        QuestionDetailVO questionVO = new QuestionDetailVO();
        if(id == 1){
            //当前已是第一道
            throw new ServiceException(ResultCode.FAILED_FIRST_QUESTION.getCode(), ResultCode.FAILED_FIRST_QUESTION.getMsg());
        }
        id -= 1;
        String cacheKey = CacheConstants.QUESTION_PREFIX + id;
        if(redisService.hasKey(cacheKey)){
            Question question = redisService.getCacheObject(cacheKey, Question.class);
            BeanCopyUtil.copyProperties(question, questionVO);
            return questionVO;
        }

        Question question = questionMapper.selectById(id);
        if(question == null){
            //当前已是第一道
            throw new ServiceException(ResultCode.FAILED_FIRST_QUESTION.getCode(), ResultCode.FAILED_FIRST_QUESTION.getMsg());
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

        //修改题目信息时，题目列表、题目详情失效
        redisService.scan(CacheConstants.QUESTION_LIST_PAGE_PREFIX + "*", 100, key -> {
            redisService.deleteObject(key);
        });
        String questionKey = CacheUtil.getQuestionKey(question.getId());
        redisService.deleteObject(questionKey);

        //覆盖原先 es 中的题目信息
        QuestionDocument questionDocument = new QuestionDocument();
        BeanCopyUtil.copyProperties(dto, questionDocument);
        questionDocument.setId(question.getId());
        questionRepository.save(questionDocument);

        return String.format("题目 %d 更新成功",  question.getId());
    }

    public String delete(Long id){
        int cnt = questionMapper.deleteById(id);
        if(cnt != 1){
            throw new ServiceException(ResultCode.FAILED_NOT_EXISTS.getCode(), ResultCode.FAILED_NOT_EXISTS.getMsg());
        }
        redisService.deleteObject(CacheConstants.QUESTION_PREFIX + id);

        //删除题目后，清空Redis题目列表缓存
        redisService.scan(CacheConstants.QUESTION_LIST_PAGE_PREFIX + "*", 100, key -> {
            redisService.deleteObject(key);
        });
        String questionKey = CacheUtil.getQuestionKey(id);
        redisService.deleteObject(questionKey);

        questionRepository.deleteById(id);

        return String.format("题目 %d 删除成功", id);
    }
}
