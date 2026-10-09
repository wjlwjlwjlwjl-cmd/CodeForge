package com.wjl.job.controller;

import com.wjl.core.domain.R;
import com.wjl.domain.constants.SecurityConstants;
import com.wjl.domain.domain.dto.JudgeRequestDTO;
import com.wjl.domain.domain.dto.JudgeResponseDTO;
import com.wjl.job.domain.dto.SubmitHistoryDTO;
import com.wjl.job.domain.dto.SubmitInfoDTO;
import com.wjl.job.domain.vo.SubmitHistoryVO;
import com.wjl.job.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/job")
public class JobController {
    @Autowired
    private JobService jobService;

    @PostMapping("/java/submit")
    @Operation(description = "提交代码判题")
    public R<Void> javaSubmit(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, @Validated @RequestBody SubmitInfoDTO submitInfoDTO) {
        jobService.handleSubmit(token, submitInfoDTO);
        return R.success();
    }

    @GetMapping("/ques/history")
    public R<SubmitHistoryVO> quesSubmitHistory(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, @NotNull Long questionId, int pageNum) {
        return R.success(jobService.quesSubmitHistory(token, questionId, pageNum));
    }

    @GetMapping("/user/history")
    public R<SubmitHistoryVO> userSubmitHistory(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, @NotNull Integer pageNum) {
        return R.success(jobService.userSubmitHistory(token, pageNum));
    }


}