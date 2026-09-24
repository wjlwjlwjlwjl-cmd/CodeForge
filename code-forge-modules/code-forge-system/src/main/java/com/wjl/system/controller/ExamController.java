package com.wjl.system.controller;

import com.wjl.constants.SecurityConstants;
import com.wjl.core.domain.R;
import com.wjl.system.domain.exam.dto.ExamAddDTO;
import com.wjl.system.domain.exam.dto.ExamQueryDTO;
import com.wjl.system.domain.exam.dto.ExamQuestionAdd;
import com.wjl.system.domain.exam.vo.ExamListVO;
import com.wjl.system.service.exam.ExamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/exam")
@Tag(name="竞赛管理接口")
public class ExamController {
    @Autowired
    private ExamService examService;

    @GetMapping("/list")
    @Operation(description = "获取所有竞赛")
    public R<ExamListVO> list(ExamQueryDTO examQueryDTO){
        return R.success(examService.examList(examQueryDTO));
    }

    @PostMapping("/add")
    @Operation(description = "添加竞赛")
    public R<String> add(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, ExamAddDTO examAddDTO){
        return R.success(examService.examAdd(token, examAddDTO));
    }

    @PostMapping("/question/add")
    @Operation(description = "为竞赛添加题目")
    public R<String> questionAdd(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, ExamQuestionAdd examQuestionAdd){
        return R.success(examService.questionAdd(token, examQuestionAdd));
    }
}
