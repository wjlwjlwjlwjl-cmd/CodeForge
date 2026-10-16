package com.wjl.system.service.exam;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.wjl.domain.constants.CacheConstants;
import com.wjl.domain.constants.CommonConstants;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.core.utils.ColorLog;
import com.wjl.domain.constants.SecurityConstants;
import com.wjl.domain.domain.dto.LoginUserDTO;
import com.wjl.domain.exception.ServiceException;
import com.wjl.redis.service.RedisService;
import com.wjl.redis.util.CacheUtil;
import com.wjl.security.service.TokenService;
import com.wjl.security.utils.JwtUtil;
import com.wjl.system.domain.exam.dto.*;
import com.wjl.system.domain.exam.vo.ExamListVO;
import com.wjl.system.domain.exam.vo.ExamQuestionListVO;
import com.wjl.system.domain.exam.vo.ExamVO;
import com.wjl.system.domain.question.vo.QuestionDetailVO;
import com.wjl.system.domain.question.vo.QuestionVO;
import com.wjl.system.entity.exam.Exam;
import com.wjl.system.entity.exam.ExamQuestion;
import com.wjl.system.entity.question.Question;
import com.wjl.system.mapper.ExamMapper;
import com.wjl.system.mapper.ExamQuestionMapper;
import com.wjl.system.mapper.QuestionMapper;
import com.wjl.system.service.question.QuestionService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class ExamService extends ServiceImpl<ExamQuestionMapper, ExamQuestion> {
    @Autowired
    private ExamMapper examMapper;
    @Autowired
    private ExamQuestionMapper examQuestionMapper;
    @Autowired
    private QuestionMapper questionMapper;
    @Autowired
    private TokenService tokenService;
    @Autowired 
    private RedisService redisService;

    @Autowired
    private QuestionService questionService;

    private void clearExamTimeStatusCache() {
        redisService.deleteObject(CacheConstants.EXAM_UNSTART);
        redisService.deleteObject(CacheConstants.EXAM_UNFINISH);
        redisService.deleteObject(CacheConstants.EXAM_FINISHED);
    }

    public ExamListVO examList(String token, ExamQueryDTO examQueryDTO) {
        String userType = tokenService.getUserType(token);
        if (userType == null) {
            throw new ServiceException(ResultCode.FAILED_UNAUTHORIZED.getCode(), ResultCode.FAILED_UNAUTHORIZED.getMsg());
        }
        boolean onlyPublished = SecurityConstants.CONSUMER.equals(userType);

        int pageNum = Optional.ofNullable(examQueryDTO.getPageNum()).orElse(1);
        int pageSize = CommonConstants.PAGE_SIZE;

        String cacheKey = CacheUtil.getExamListPageKey(pageNum, onlyPublished);
        List<Exam> exams = null;
        if (redisService.hasKey(cacheKey)) {
            exams = redisService.getCacheList(cacheKey, Exam.class);
        }
        if (exams == null) {
            LambdaQueryWrapper<Exam> wrapper = new LambdaQueryWrapper<>();
            if (onlyPublished) {
                wrapper.eq(Exam::getStatus, 1);
            }
            PageHelper.startPage(pageNum, pageSize);
            exams = examMapper.selectList(wrapper);
            if (exams == null) {
                return null;
            }
            // setCacheList 是追加语义，先删 key 再写，避免并发下重复
            redisService.deleteObject(cacheKey);
            redisService.setCacheList(cacheKey, exams);
            redisService.expire(cacheKey, CacheConstants.EXAM_LIST_PAGE_EXPIRATION, TimeUnit.MINUTES);
        }

        // total 也按身份算（原来 C 端用全部竞赛数，页脚与翻页都会出错）
        Long total = examMapper.selectCount(onlyPublished
                ? new LambdaQueryWrapper<Exam>().eq(Exam::getStatus, 1)
                : null);
        // 原来是 total / pageSize + (total % pageSize == 0 ? 0 : 1) 的写法，
        // 括号优先级不对，pages 恒为 1
        int pages = (int) ((total + pageSize - 1) / pageSize);

        List<ExamVO> examVOs = BeanCopyUtil.copyListProperties(exams, ExamVO::new);

        ExamListVO examListVO = new ExamListVO();
        examListVO.setList(examVOs);
        examListVO.setPageNum(pageNum);
        examListVO.setPageSize(pageSize);
        examListVO.setTotal(total);
        examListVO.setPages(pages);
        return examListVO;
    }

    //加载一个竞赛的所有问题
    public ExamQuestionListVO examListQuestion(ExamQuestionListDTO dto){
        ExamQuestionListVO examQuestionListVO = new ExamQuestionListVO();
        Long examId = dto.getExamId();
        Integer pageNum = dto.getPageNum();
        int pageSize = CommonConstants.PAGE_SIZE;
        List<Long> questionIds = new ArrayList<>();

        //缓存一个竞赛的所有问题的 questionId，这样如果题目发生更改，那么就不需要失效竞赛题目列表的缓存
        String cacheKey = CacheUtil.getExamQuestionListPageKey(pageNum, examId);
        if(redisService.hasKey(cacheKey)){
            questionIds = redisService.getCacheList(cacheKey, Long.class);
        }
        else{
            List<ExamQuestion> exams;
            PageHelper.startPage(pageNum, pageSize);
            exams = examQuestionMapper.selectList(new LambdaQueryWrapper<ExamQuestion>()
                    .eq(ExamQuestion::getExamId, examId)
            );
            for(ExamQuestion examQuestion: exams){
                questionIds.add(examQuestion.getQuestionId());
            }
            // setCacheList 内部是 rightPushAll（追加）。若两个请求同时未命中缓存，
            // 后一个会把同一批 questionId 再追加一遍，导致题目重复。
            // 先删 key 保证是覆盖语义，并在删之后立刻写入。
            redisService.deleteObject(cacheKey);
            redisService.setCacheList(cacheKey, questionIds);
            redisService.expire(cacheKey, CacheConstants.EXAM_QUESTION_LIST_PAGE_EXPIRATION, TimeUnit.MINUTES);
        }

        List<QuestionVO> questions = new ArrayList<>();
        for(Long questionId: questionIds){
            QuestionDetailVO item = questionService.detail(questionId);
            QuestionVO quest = new QuestionVO();
            if(item == null) continue;
            BeanCopyUtil.copyProperties(item, quest);
            questions.add(quest);
        }

        // total/pages 必须按数据库真实条数算：
        // 原来是把拼好的内存 List 塞进 PageInfo，于是 total = 本页条数（第 2 页起直接是 0）、
        // pageSize 也是本页条数、pages 恒为 1，前端拿这些值分页会出错。
        long total = examQuestionMapper.selectCount(new LambdaQueryWrapper<ExamQuestion>()
                .eq(ExamQuestion::getExamId, examId));
        int pages = (int) ((total + pageSize - 1) / pageSize);

        examQuestionListVO.setList(questions);
        examQuestionListVO.setPageNum(pageNum);
        examQuestionListVO.setPages(pages);
        examQuestionListVO.setPageSize(pageSize);
        examQuestionListVO.setTotal(total);

        return examQuestionListVO;
    }

    //添加一个竞赛
    public String examAdd(String token, ExamAddDTO examAddDTO) {
        String title = examAddDTO.getTitle();
        LocalDateTime startTime = examAddDTO.getStartTime();
        LocalDateTime endTime = examAddDTO.getEndTime();

        LocalDateTime now = LocalDateTime.now();
        if(startTime.isBefore(now)) {
            throw new ServiceException(ResultCode.EXAM_START_TIME_BEFORE_CURRENT_TIME.getCode(), ResultCode.EXAM_START_TIME_BEFORE_CURRENT_TIME.getMsg());
        }
        if(startTime.isAfter(endTime)) {
            throw new ServiceException(ResultCode.EXAM_START_TIME_AFTER_END_TIME.getCode(), ResultCode.EXAM_START_TIME_AFTER_END_TIME.getMsg());
        }

        LoginUserDTO loginUserDTO = tokenService.getBLoginUser(token);
        Long userId = Long.valueOf(loginUserDTO.getUserId());

        Exam exam = new Exam();
        exam.setTitle(title);
        exam.setStartTime(startTime);
        exam.setEndTime(endTime);
        exam.setCreateBy(userId);
        exam.setCreateTime(LocalDateTime.now());
        exam.setUpdateBy(userId);
        exam.setUpdateTime(LocalDateTime.now());

        examMapper.insert(exam);

        //让竞赛列表缓存失效
        redisService.scan(CacheConstants.EXAM_LIST_PAGE_PREFIX + "*", 100, key ->{
            redisService.deleteObject(key);
        });
        // 新竞赛还没发布、但按时间它属于「未开始」，三个按时间划分的列表也要重建
        clearExamTimeStatusCache();
        ColorLog.debug("竞赛列表缓存失效");

        return String.format("%s，竞赛新建成功", title);
    }

    public String questionAdd(String token, ExamQuestionAdd examQuestionAdd) {
        //当给一个竞赛添加题目时，需要让这个竞赛的题目列表缓存失效

        LinkedHashSet<Long> questions = examQuestionAdd.getQuestions();
        Long examId = examQuestionAdd.getExamId();
        checkExam(examId, false); //竞赛存在性、时间检查

        LoginUserDTO loginUserDTO = tokenService.getBLoginUser(token);
        Long userId = Long.valueOf(loginUserDTO.getUserId());

        //只要提供的若干题目id中有不匹配的，直接抛异常
        List<Question> exists = questionMapper.selectBatchIds(questions);
        if(exists.size() != questions.size()){
            throw new ServiceException(ResultCode.EXAM_QUESTION_NOT_EXISTS.getCode(), "请检查题目 ID 合法性");
        }

        //如果添加已经添加过的题目，那么直接跑异常
        for(Question question : exists){
            Long questionId = question.getId();
            List<ExamQuestion> list = examQuestionMapper.selectList(new LambdaQueryWrapper<ExamQuestion>()
                    .eq(ExamQuestion::getExamId, examId)
                    .eq(ExamQuestion::getQuestionId, questionId)
            );
            if(!list.isEmpty()){
                throw new ServiceException(ResultCode.EXAM_QUESTION_EXISTS.getCode(), ResultCode.EXAM_QUESTION_EXISTS.getMsg());
            }
        }

        Set<ExamQuestion> examQuestions = new HashSet<>();
        for(Long questionId : questions){
            ExamQuestion examQuestion = new ExamQuestion();
            examQuestion.setExamId(examId);
            examQuestion.setQuestionId(questionId);
            examQuestion.setCreateBy(userId);
            examQuestion.setCreateTime(LocalDateTime.now());
            examQuestion.setUpdateBy(userId);
            examQuestion.setUpdateTime(LocalDateTime.now());
            examQuestions.add(examQuestion);
        }
        saveBatch(examQuestions);

        String pattern = String.format("exam:%d:list:page:*", examId);
        redisService.scan(pattern, 100, key -> {
            redisService.deleteObject(key);
        });
        ColorLog.debug("竞赛{}题目列表失效", pattern);

        return String.format("成功添加%d条题目", questions.size());
    }

    public String questionDelete(String token, Long examId, Long questionId){
        checkExam(examId, false);
        int cnt = examQuestionMapper.delete(new LambdaQueryWrapper<ExamQuestion>()
                .eq(ExamQuestion::getExamId, examId)
                .eq(ExamQuestion::getQuestionId, questionId));
        if(cnt == 0){
            throw new ServiceException(ResultCode.EXAM_NOT_HAS_QUESTION.getCode(), ResultCode.EXAM_NOT_HAS_QUESTION.getMsg());
        }

        LoginUserDTO loginUserDTO = tokenService.getBLoginUser(token);
        Long userId = Long.valueOf(loginUserDTO.getUserId());

        examMapper.update(new LambdaUpdateWrapper<Exam>()
                .eq(Exam::getExamId, examId)
                .set(Exam::getUpdateTime, LocalDateTime.now())
                .set(Exam::getUpdateBy, userId)
        );

        String pattern = String.format("exam:%d:list:page:*", examId);
        redisService.scan(pattern, 100, key -> {
            redisService.deleteObject(key);
        });
        ColorLog.debug("竞赛题目列表失效");
        return String.format("成功删除%d条题目", cnt);
    }

    public ExamVO examDetail(Long examId){
        ExamVO examVO = new ExamVO();
        Exam exam;
        String cacheKey = CacheUtil.getExamKey(examId);
        if(redisService.hasKey(cacheKey)){
            exam = redisService.getCacheObject(cacheKey, Exam.class);
        }
        else{
            exam = examMapper.selectById(examId);
            redisService.setCacheObject(cacheKey, exam, CacheConstants.EXAM_EXPIRATION, TimeUnit.MINUTES);
        }
        if(exam == null) return null;
        BeanUtils.copyProperties(exam, examVO);
        return examVO;
    }

    /**
     * 修改竞赛信息
     * <p>
     * 可编辑性只看「时间」，**不看发布状态**：
     * <ul>
     *   <li>未开始：可以编辑（已发布也可以）</li>
     *   <li>进行中：不可以（3210 竞赛已经开始，不能进行编辑操作）</li>
     *   <li>已结束：不可以（3207 竞赛已经结束不能进行操作）</li>
     * </ul>
     * 原来这里调的是 checkExam(examId, false)，它要求竞赛「未发布」且「未开始」，
     * 于是已发布的未开始竞赛改不了、而已开始（进行中）的竞赛报的是 3201
     * 「竞赛开始时间不能早于当前时间」，语义对不上。
     */
    public String examEdit(String token, ExamEditDTO examEditDTO){
        Long examId = examEditDTO.getExamId();
        checkExamCanEdit(examId);

        // 新时间也要合法，规则与 examAdd 保持一致：
        // 不能为空（否则会把 NOT NULL 列写坏）、开始不能晚于结束、开始不能早于当前时间
        if (examEditDTO.getStartTime() == null || examEditDTO.getEndTime() == null) {
            throw new ServiceException(ResultCode.FAILED_PARAMS_VALIDATE.getCode(), ResultCode.FAILED_PARAMS_VALIDATE.getMsg());
        }
        if (examEditDTO.getStartTime().isAfter(examEditDTO.getEndTime())) {
            throw new ServiceException(ResultCode.EXAM_START_TIME_AFTER_END_TIME.getCode(), ResultCode.EXAM_START_TIME_AFTER_END_TIME.getMsg());
        }
        if (examEditDTO.getStartTime().isBefore(LocalDateTime.now())) {
            throw new ServiceException(ResultCode.EXAM_START_TIME_BEFORE_CURRENT_TIME.getCode(), ResultCode.EXAM_START_TIME_BEFORE_CURRENT_TIME.getMsg());
        }

        LoginUserDTO loginUserDTO = tokenService.getBLoginUser(token);

        examMapper.update(new LambdaUpdateWrapper<Exam>()
                .eq(Exam::getExamId, examId)
                .set(Exam::getStartTime, examEditDTO.getStartTime())
                .set(Exam::getEndTime, examEditDTO.getEndTime())
                .set(Exam::getTitle, examEditDTO.getTitle())
                .set(Exam::getUpdateBy, loginUserDTO.getUserId())
                .set(Exam::getUpdateTime, LocalDateTime.now())
        );

        //有三个缓存需要失效：竞赛列表缓存、竞赛信息缓存、按时间划分的三个列表
        redisService.scan(CacheConstants.EXAM_LIST_PAGE_PREFIX + "*", 100, key ->{
            redisService.deleteObject(key);
        });
        redisService.deleteObject(CacheUtil.getExamKey(examId));
        // 时间被改过 → 它可能在「未开始/进行中/已结束」之间换桶
        clearExamTimeStatusCache();

        return String.format("更新%d竞赛成功", examId);
    }

    public String examDelete(Long examId){
        checkExam(examId, false);
        //先删除竞赛信息
        examMapper.deleteById(examId);
        examQuestionMapper.delete(new LambdaQueryWrapper<ExamQuestion>().eq(ExamQuestion::getExamId, examId));

        redisService.scan(CacheConstants.EXAM_LIST_PAGE_PREFIX + "*", 100, key ->{
            redisService.deleteObject(key);
        });

        String pattern = String.format("exam:%d:list:page:*", examId);
        redisService.scan(pattern, 100, key -> {
            redisService.deleteObject(key);
        });

        redisService.deleteObject(CacheUtil.getExamKey(examId));
        clearExamTimeStatusCache();

        return String.format("成功删除%d的竞赛信息", examId);
    }

    public String examPublish(String token, Long examId){
        checkExam(examId, false);
        LoginUserDTO loginUserDTO = tokenService.getBLoginUser(token);
        Long userId = Long.valueOf(loginUserDTO.getUserId());
        examMapper.update(new LambdaUpdateWrapper<Exam>()
                .eq(Exam::getExamId, examId)
                .set(Exam::getStatus, 1)
                .set(Exam::getUpdateTime, LocalDateTime.now())
                .set(Exam::getUpdateBy, userId)
        );

        redisService.scan(CacheConstants.EXAM_LIST_PAGE_PREFIX + "*", 100, key ->{
            redisService.deleteObject(key);
        });
        redisService.deleteObject(CacheUtil.getExamKey(examId));

        clearExamTimeStatusCache();
        return String.format("成功发布%d", examId);
    }

    public String examPublishCancel(String token, Long examId){
        checkExam(examId, true);
        LoginUserDTO loginUserDTO = tokenService.getBLoginUser(token);
        Long userId = Long.valueOf(loginUserDTO.getUserId());
        examMapper.update(new LambdaUpdateWrapper<Exam>()
                .eq(Exam::getExamId, examId)
                .set(Exam::getStatus, 0)
                .set(Exam::getUpdateTime, LocalDateTime.now())
                .set(Exam::getUpdateBy, userId)
        );

        redisService.scan(CacheConstants.EXAM_LIST_PAGE_PREFIX + "*", 100, key ->{
            redisService.deleteObject(key);
        });
        redisService.deleteObject(CacheUtil.getExamKey(examId));

        clearExamTimeStatusCache();
        return String.format("成功取消发布%d", examId);
    }

    /**
     * 编辑专用的可编辑性校验：只按时间判断，与发布状态无关
     * <p>
     * 已结束 → 3207；已开始（进行中）→ 3210；竞赛不存在 → 3203。
     */
    private void checkExamCanEdit(Long examId) {
        Exam exam = examMapper.selectById(examId);
        if (exam == null) {
            throw new ServiceException(ResultCode.EXAM_NOT_EXISTS.getCode(), ResultCode.EXAM_NOT_EXISTS.getMsg());
        }
        LocalDateTime now = LocalDateTime.now();
        if (exam.getEndTime() != null && exam.getEndTime().isBefore(now)) {
            throw new ServiceException(ResultCode.EXAM_IS_FINISH.getCode(), ResultCode.EXAM_IS_FINISH.getMsg());
        }
        if (exam.getStartTime() != null && exam.getStartTime().isBefore(now)) {
            throw new ServiceException(ResultCode.EXAM_HAS_START.getCode(), ResultCode.EXAM_HAS_START.getMsg());
        }
    }

    private void checkExam(Long examId, boolean force) {
        Exam exam = examMapper.selectById(examId);
        //竞赛不存在
        if(exam ==  null){
            throw new ServiceException(ResultCode.EXAM_NOT_EXISTS.getCode(),ResultCode.EXAM_NOT_EXISTS.getMsg());
        }

        if(force){
            return;
        }

        //竞赛状态检查
        if(exam.getStatus() == 1){
            throw new ServiceException(ResultCode.EXAM_IS_PUBLISH.getCode(),ResultCode.EXAM_IS_PUBLISH.getMsg());
        }

        //竞赛时间异常
        LocalDateTime startTime = exam.getStartTime();
        LocalDateTime endTime = exam.getEndTime();
        LocalDateTime currentTime = LocalDateTime.now();
        if(startTime.isBefore(currentTime)){
            throw new ServiceException(ResultCode.EXAM_START_TIME_BEFORE_CURRENT_TIME.getCode(),ResultCode.EXAM_START_TIME_BEFORE_CURRENT_TIME.getMsg());
        }
        if(endTime.isBefore(currentTime)){
            throw new ServiceException(ResultCode.EXAM_IS_FINISH.getCode(),ResultCode.EXAM_IS_FINISH.getMsg());
        }
    }
}
