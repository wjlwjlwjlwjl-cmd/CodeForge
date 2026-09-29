package com.wjl.friend.domain.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ExamEnterDTO {
    @NotNull
    private Long examId;
}
