package com.wjl.friend.domain.exam.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ExamEnterDTO {
    @NotNull
    private Long examId;
}
