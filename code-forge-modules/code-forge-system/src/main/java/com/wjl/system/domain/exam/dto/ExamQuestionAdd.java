package com.wjl.system.domain.exam.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.LinkedHashSet;

@Data
public class ExamQuestionAdd {
    private Long examId;
    @NotNull
    private LinkedHashSet<Long> questions;
}
