package com.wjl.system.service.exam;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.domain.dto.LoginUserDTO;
import com.wjl.exception.ServiceException;
import com.wjl.security.service.TokenService;
import com.wjl.system.domain.exam.dto.ExamAddDTO;
import com.wjl.system.domain.exam.dto.ExamQueryDTO;
import com.wjl.system.domain.exam.dto.ExamQuestionAdd;
import com.wjl.system.domain.exam.vo.ExamListVO;
import com.wjl.system.domain.exam.vo.ExamVO;
import com.wjl.system.entity.exam.Exam;
import com.wjl.system.entity.exam.ExamQuestion;
import com.wjl.system.entity.question.Question;
import com.wjl.system.mapper.ExamMapper;
import com.wjl.system.mapper.ExamQuestionMapper;
import com.wjl.system.mapper.QuestionMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

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

    public ExamListVO examList(ExamQueryDTO examQueryDTO) {
        ExamListVO examListVO = new ExamListVO();

        Integer pageNum =  examQueryDTO.getPageNum();
        Integer pageSize = examQueryDTO.getPageSize();
        PageHelper.startPage(pageNum, pageSize);
        List<Exam> exams = examMapper.selectList(null);

        List<ExamVO> examVOs = BeanCopyUtil.copyListProperties(exams, ExamVO::new);
        PageInfo<ExamVO> pageInfo = new PageInfo<>(examVOs);

        examListVO.setList(examVOs);
        examListVO.setPageNum(pageInfo.getPageNum());
        examListVO.setPageSize(pageInfo.getPageSize());
        examListVO.setTotal(pageInfo.getTotal());
        examListVO.setPages(pageInfo.getPages());
        return examListVO;
    }

    public String examAdd(String token, ExamAddDTO examAddDTO) {
        String title = examAddDTO.getTitle();
        LocalDateTime startTime = examAddDTO.getStartTime();
        LocalDateTime endTime = examAddDTO.getEndTime();

        LoginUserDTO loginUserDTO = tokenService.getLoginUser(token);
        Long userId = loginUserDTO.getUserId();

        Exam exam = new Exam();
        exam.setTitle(title);
        exam.setStartTime(startTime);
        exam.setEndTime(endTime);
        exam.setCreateBy(userId);
        exam.setCreateTime(LocalDateTime.now());
        exam.setUpdateBy(userId);
        exam.setUpdateTime(LocalDateTime.now());

        examMapper.insert(exam);

        return String.format("%s，竞赛新建成功", title);
    }

    public String questionAdd(String token, ExamQuestionAdd examQuestionAdd) {
        LinkedHashSet<Long> questions = examQuestionAdd.getQuestions();
        Long examId = examQuestionAdd.getExamId();
        checkExam(examId); //竞赛存在性、时间检查

        LoginUserDTO loginUserDTO = tokenService.getLoginUser(token);
        Long userId = loginUserDTO.getUserId();

        //只要提供的若干题目id中有不匹配的，直接抛异常
        List<Question> exists = questionMapper.selectBatchIds(questions);
        if(exists.size() != questions.size()){
            throw new ServiceException("请检查题目 ID 合法性");
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

        return String.format("成功添加%d条题目", questions.size());
    }

    private void checkExam(Long examId) {
        Exam exam = examMapper.selectById(examId);
        if(exam ==  null){
            throw new ServiceException(ResultCode.EXAM_NOT_EXISTS.getCode(),ResultCode.EXAM_NOT_EXISTS.getMsg());
        }
        LocalDateTime startTime = exam.getStartTime();
        LocalDateTime endTime = exam.getEndTime();
        LocalDateTime currentTime = LocalDateTime.now();

        if(startTime.isBefore(currentTime)){
            throw new ServiceException(ResultCode.EXAM_STARTED.getCode(),ResultCode.EXAM_STARTED.getMsg());
        }
        if(endTime.isBefore(currentTime)){
            throw new ServiceException(ResultCode.EXAM_IS_FINISH.getCode(),ResultCode.EXAM_IS_FINISH.getMsg());
        }
    }
}
