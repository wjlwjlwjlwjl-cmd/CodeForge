package com.wjl.system.controller;

import com.wjl.core.domain.R;
import com.wjl.system.domain.question.dto.AddQuestionDTO;
import com.wjl.system.domain.question.dto.ListQuestionDTO;
import com.wjl.system.domain.question.vo.ListQuestionVO;
import com.wjl.system.service.question.QuestionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/question")
@Tag(name = "题目管理接口")
public class QuestionController {
    @Autowired
    private QuestionService questionService;

    @GetMapping("/list")
    public R<ListQuestionVO> list(@Validated ListQuestionDTO dto) {
        return R.success(questionService.list(dto));
    }

    @PostMapping("/add")
    public R<String> add(@Validated @RequestBody AddQuestionDTO dto, @RequestHeader("Authorization") String token) {
        return R.success(questionService.add(dto, token));
    }
}
