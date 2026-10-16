package com.wjl.system.domain.exam.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ExamEditDTO extends ExamAddDTO {
    private Long examId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
