package com.wjl.system.service.question;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.system.domain.question.dto.ListQuestionDTO;
import com.wjl.system.domain.question.vo.ListQuestionVO;
import com.wjl.system.domain.question.vo.QuestionVO;
import com.wjl.system.entity.question.Question;
import com.wjl.system.mapper.QuestionMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class QuestionService {
    @Autowired
    private QuestionMapper questionMapper;

    public ListQuestionVO list(ListQuestionDTO listQuestionDTO) {
        ListQuestionVO listQuestionVO = new ListQuestionVO();
        int pageNum = listQuestionDTO.getPageNum(); //页码
        int pageSize = listQuestionDTO.getPageSize(); //每页条数
        Page<Question> page = new Page<>(pageNum, pageSize);
        Page<Question> records = questionMapper.selectPage(page, new LambdaQueryWrapper<>());
        List<QuestionVO> questionVOs = BeanCopyUtil.copyListProperties(records.getRecords(), QuestionVO::new);

        listQuestionVO.setList(questionVOs);
        listQuestionVO.setTotal(records.getTotal());
        listQuestionVO.setPageNum(pageNum);
        listQuestionVO.setPageSize(pageSize);
        listQuestionVO.setPages(getPages((int)records.getTotal(), pageSize));

        return listQuestionVO;
    }

    private int getPages(int total, int pageSize){
        return total % pageSize == 0 ? total / pageSize : total / pageSize + 1;
    }
}
