package com.wjl.friend.domain.question.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class QuestionSearchDTO {
    @NotBlank
    private String keyword = null;
    @Max(value = 2)
    @Min(value = 0)
    private Integer difficulty = null;
    @Min(value = 1)
    private Integer pageNum = 1;
}
