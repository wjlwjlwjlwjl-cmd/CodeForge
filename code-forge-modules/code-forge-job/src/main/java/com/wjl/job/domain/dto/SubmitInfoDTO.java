package com.wjl.job.domain.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitInfoDTO {
    @NotNull
    private Long userId;

    @NotNull
    private Long questionId;

    private Long examId;

    @NotNull
    private String userCode;
}
