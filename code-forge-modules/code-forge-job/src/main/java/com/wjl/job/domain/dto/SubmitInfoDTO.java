package com.wjl.job.domain.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitInfoDTO {
    private Long userId; //这个字段后续删除，目前保留是测试需要

    @NotNull(message = "questionId 不能为空")
    private Long questionId;

    private Long examId;

    @Min(value = 0)
    @Max(value = 0)
    private Integer lang = 0;

    @NotNull(message = "用户代码不能为空")
    private String userCode;
}
