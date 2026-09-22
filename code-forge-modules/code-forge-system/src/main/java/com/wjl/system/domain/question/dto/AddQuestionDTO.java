package com.wjl.system.domain.question.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddQuestionDTO {
    @NotBlank(message = "题目标题不能为空")
    private String title;
    @NotNull
    @Max(value=3)
    @Min(value=1)
    private Integer difficulty;
    @NotNull
    private Integer timeLimit;
    @NotNull
    private Integer spaceLimit;
    @NotBlank
    private String content;
    @NotBlank
    private String questionCase;
    @NotBlank
    private String defaultCode;
    @NotBlank
    private String mainFuc;
}
