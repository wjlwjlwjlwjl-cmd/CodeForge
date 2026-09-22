package com.wjl.system.controller;

import com.wjl.system.domain.question.dto.ListQuestionDTO;
import com.wjl.system.domain.question.vo.ListQuestionVO;
import com.wjl.system.service.question.QuestionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/question")
@Tag(name = "题目管理接口")
public class QuestionController {
    @Autowired
    private QuestionService questionService;

    @GetMapping("/list")
    public ListQuestionVO list(ListQuestionDTO dto) {
        return questionService.list(dto);
    }
}
