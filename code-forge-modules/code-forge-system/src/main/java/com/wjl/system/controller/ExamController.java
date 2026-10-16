package com.wjl.system.controller;

import com.wjl.domain.constants.SecurityConstants;
import com.wjl.core.domain.R;
import com.wjl.system.domain.exam.dto.*;
import com.wjl.system.domain.exam.vo.ExamListVO;
import com.wjl.system.domain.exam.vo.ExamQuestionListVO;
import com.wjl.system.domain.exam.vo.ExamVO;
import com.wjl.system.service.exam.ExamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exam")
@Tag(name="竞赛管理接口")
public class ExamController {
    @Autowired
    private ExamService examService;

    //done
    @GetMapping("/list")
    @Operation(description = "获取所有竞赛")
    public R<ExamListVO> list(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, ExamQueryDTO examQueryDTO){
        return R.success(examService.examList(token, examQueryDTO));
    }

    //done
    @GetMapping("/listQuestion")
    @Operation(description = "获取竞赛的所有题目")
    public R<ExamQuestionListVO> listQuestion(ExamQuestionListDTO dto){
        return R.success(examService.examListQuestion(dto)); //这里createTime因为字段复用，为null，不影响前端展示
    }

    //done
    @PostMapping("/b/add")
    @Operation(description = "添加竞赛")
    public R<String> add(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, @RequestBody ExamAddDTO examAddDTO){
        return R.success(examService.examAdd(token, examAddDTO));
    }

    //done
    @PostMapping("/b/question/add")
    @Operation(description = "为竞赛添加题目")
    public R<String> questionAdd(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, @RequestBody @Validated ExamQuestionAdd examQuestionAdd){
        return R.success(examService.questionAdd(token, examQuestionAdd));
    }

    @DeleteMapping("/b/delete")
    @Operation(description = "删除竞赛题目")
    public R<String> questionDelete(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, Long examId, Long questionId){
        return R.success(examService.questionDelete(token, examId, questionId));
    }

    @GetMapping("/detail")
    @Operation(description = "获取竞赛详细信息")
    public R<ExamVO> detail(Long examId){
        return R.success(examService.examDetail(examId));
    }

    @PostMapping("/b/edit")
    @Operation(description = "修改竞赛信息")
    public R<String> edit(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, @RequestBody ExamEditDTO examEditDTO){
        return R.success(examService.examEdit(token, examEditDTO));
    }

    //done
    @DeleteMapping("/b/delete/{examId}")
    @Operation(description = "删除竞赛")
    public R<String> delete(@PathVariable Long examId){
        return R.success(examService.examDelete(examId));
    }

    //done
    @PutMapping("/b/publish")
    @Operation(description = "发布竞赛")
    public R<String> publish(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, Long examId){
        return R.success(examService.examPublish(token, examId));
    }

    //done
    @PutMapping("/b/publish_cancel")
    @Operation(description = "取消发布竞赛")
    public R<String> publishCancel(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, Long examId){
        return R.success(examService.examPublishCancel(token, examId));
    }
}
