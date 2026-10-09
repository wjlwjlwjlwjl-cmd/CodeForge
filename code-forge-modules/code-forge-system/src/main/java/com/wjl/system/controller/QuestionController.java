package com.wjl.system.controller;

import com.wjl.domain.constants.SecurityConstants;
import com.wjl.core.domain.R;
import com.wjl.system.domain.question.dto.AddQuestionDTO;
import com.wjl.system.domain.question.dto.ListQuestionDTO;
import com.wjl.system.domain.question.dto.QuestionEditDTO;
import com.wjl.system.domain.question.vo.ListQuestionVO;
import com.wjl.system.domain.question.vo.QuestionDetailVO;
import com.wjl.system.service.question.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
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
    @Operation(description = "列出所有题目")
    public R<ListQuestionVO> list(@Validated ListQuestionDTO dto) {
        return R.success(questionService.list(dto));
    }

    @PostMapping("/b/add")
    @Operation(description = "管理员添加用户")
    public R<String> add(@Validated @RequestBody AddQuestionDTO dto, @RequestHeader(SecurityConstants.AUTHENTICATION) String token) {
        return R.success(questionService.add(dto, token));
    }

    @GetMapping("/detail")
    @Operation(description = "获取某道题目的详细信息")
    public R<QuestionDetailVO> detail(@RequestParam Long id) {
        return R.success(questionService.detail(id));
    }

    @PostMapping("/b/edit")
    @Operation(description = "管理员修改题目信息")
    public R<String> edit(@Validated @RequestBody QuestionEditDTO dto, @RequestHeader(SecurityConstants.AUTHENTICATION) String token) {
        return R.success(questionService.edit(dto, token));
    }

    @DeleteMapping("/b/delete/{id}")
    @Operation(description = "管理员删除题目信息")
    public R<String> delete(@PathVariable Long id) {
        return R.success(questionService.delete(id));
    }

    @GetMapping("/next")
    @Operation(description = "获取当前题目的下一道题目")
    public R<QuestionDetailVO> next(@RequestParam Long id) {
        return R.success(questionService.next(id));
    }

    @GetMapping("/prev")
    @Operation(description = "获取当前题目的上一道题目")
    public R<QuestionDetailVO> prev(@RequestParam Long id) {
        return R.success(questionService.prev(id));
    }
}
