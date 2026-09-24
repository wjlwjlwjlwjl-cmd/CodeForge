package com.wjl.system.domain.exam.dto;

import lombok.Data;

import java.util.LinkedHashSet;

@Data
public class ExamQuestionAdd {
    private Long examId;
    private LinkedHashSet<Long> questions;
}
