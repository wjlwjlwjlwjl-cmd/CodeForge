package com.wjl.system.domain.question.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QuestionEditDTO {
    @NotNull(message="题目id不能为空")
    private Long id;
    private String title;
    @Max(value=3)
    @Min(value=1)
    private Integer difficulty;
    private Integer timeLimit;
    private Integer spaceLimit;
    private String content;
    private String questionCase;
    private String defaultCode;
    private String mainFuc;
}
