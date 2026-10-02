package com.wjl.friend.controller.question;

import com.wjl.core.domain.R;
import com.wjl.friend.domain.question.dto.QuestionSearchDTO;
import com.wjl.friend.domain.question.vo.ListQuestionVO;
import com.wjl.friend.service.question.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/question/search")
@Tag(name="题目关键字查询接口（对接 ElasticSearch）")
public class QuestionController {
    @Autowired
    private QuestionService questionService;

    @RequestMapping("/filter")
    @Operation(description = "根据关键字查询标题、正文，")
    public R<ListQuestionVO> getQuestionListByES(@Validated QuestionSearchDTO dto) {
        return R.success(questionService.getQuestionListByES(dto));
    }
}
