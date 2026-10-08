package com.wjl.job.domain.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitInfoDTO {
    private Long userId; //这个字段后续删除，目前保留是测试需要

    @NotNull(message = "questionId 不能为空")
    private Long questionId;

    private Long examId;

    @NotNull(message = "用户代码不能为空")
    private String userCode;
}
