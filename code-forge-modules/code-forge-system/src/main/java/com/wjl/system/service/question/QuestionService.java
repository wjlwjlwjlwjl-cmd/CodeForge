package com.wjl.system.service.question;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.domain.dto.LoginUserDTO;
import com.wjl.exception.ServiceException;
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

@Service
public class QuestionService {
    @Autowired
    private QuestionMapper questionMapper;
    @Autowired
    private TokenService tokenService;

    public ListQuestionVO list(ListQuestionDTO listQuestionDTO) {
        ListQuestionVO listQuestionVO = new ListQuestionVO();
        int pageNum = listQuestionDTO.getPageNum(); //页码
        int pageSize = listQuestionDTO.getPageSize(); //每页条数

        PageHelper.startPage(pageNum, pageSize);
        List<Question> questions = questionMapper.selectList(null);
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
        LoginUserDTO loginUserDTO = tokenService.getLoginUser(token);
        Long userId = Long.valueOf(loginUserDTO.getUserId());

        Question question = new Question();
        BeanCopyUtil.copyProperties(dto, question);
        question.setCreateBy(userId);
        question.setCreateTime(LocalDateTime.now());
        question.setUpdateBy(userId);
        question.setUpdateTime(LocalDateTime.now());

        questionMapper.insert(question);
        return String.format("添加成功，题目编号：%d", question.getId());
    }

    public QuestionDetailVO detail(Long id){
        Question question = questionMapper.selectById(id);
        if(question == null){
            throw new ServiceException(ResultCode.FAILED_NOT_EXISTS.getCode(), ResultCode.FAILED_NOT_EXISTS.getMsg());
        }
        QuestionDetailVO questionVO = new QuestionDetailVO();
        BeanCopyUtil.copyProperties(question, questionVO);
        return questionVO;
    }

    public String edit(QuestionEditDTO dto, String token){
        LoginUserDTO loginUserDTO = tokenService.getLoginUser(token);
        String userId = loginUserDTO.getUserId();

        Question question = new  Question();
        question.setUpdateBy(Long.valueOf(userId));
        question.setUpdateTime(LocalDateTime.now());

        BeanCopyUtil.copyProperties(dto, question);
        int ret = questionMapper.updateById(question);
        if(ret != 1){
            throw new ServiceException(ResultCode.FAILED_NOT_EXISTS.getCode(), ResultCode.FAILED_NOT_EXISTS.getMsg());
        }
        return String.format("题目 %d 更新成功",  question.getId());
    }

    public String delete(Long id){
        int cnt = questionMapper.deleteById(id);
        if(cnt != 1){
            throw new ServiceException(ResultCode.FAILED_NOT_EXISTS.getCode(), ResultCode.FAILED_NOT_EXISTS.getMsg());
        }
        return String.format("题目 %d 删除成功", id);
    }
}
