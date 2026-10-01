package com.wjl.friend.domain.exam.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ExamVO {
    private Long examId;
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer status;
}
