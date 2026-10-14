package com.wjl.job.controller;

import com.wjl.core.domain.R;
import com.wjl.domain.constants.SecurityConstants;
import com.wjl.job.domain.dto.SubmitInfoDTO;
import com.wjl.job.domain.vo.SubmitDetailVO;
import com.wjl.job.domain.vo.SubmitHistoryVO;
import com.wjl.job.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

//缓存
@RestController
@RequestMapping("/job")
public class JobController {
    @Autowired
    private JobService jobService;

    @PostMapping("/java/submit")
    @Operation(description = "提交代码判题") //done
    public R<Void> javaSubmit(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, @Validated @RequestBody SubmitInfoDTO submitInfoDTO) {
        jobService.handleSubmit(token, submitInfoDTO);
        return R.success();
    }

    @GetMapping("/ques/history")
    @Operation(description = "获取一道题的历史提交记录") //done
    public R<SubmitHistoryVO> quesSubmitHistory(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, @NotNull Long questionId, int pageNum) {
        return R.success(jobService.quesSubmitHistory(token, questionId, pageNum));
    }

    @GetMapping("/user/history")
    @Operation(description = "获取用户的全部提交记录") //done
    public R<SubmitHistoryVO> userSubmitHistory(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, @NotNull Integer pageNum) {
        return R.success(jobService.userSubmitHistory(token, pageNum));
    }

    @GetMapping("/submit/detail")
    @Operation(description = "获取提交记录的详细信息") //done
    public R<SubmitDetailVO> submitDetail(@NotNull Long submitId) {
        return R.success(jobService.getSubmitDetail(submitId));
    }

    @GetMapping("/exam/rank")
    @Operation(description = "获取当前用户的竞赛排名")
    public R<Integer> examRank(@RequestHeader(SecurityConstants.AUTHENTICATION) String token){
        return R.success();
    }
}