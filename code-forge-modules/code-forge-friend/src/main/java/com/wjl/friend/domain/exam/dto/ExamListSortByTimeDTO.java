package com.wjl.friend.domain.exam.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class ExamListSortByTimeDTO {
    @Min(value=0, message="页数应大于零")
    private Integer pageNum = 0;

    @Max(value=2)
    @Min(value=0)
    private Integer option = 0;
}
