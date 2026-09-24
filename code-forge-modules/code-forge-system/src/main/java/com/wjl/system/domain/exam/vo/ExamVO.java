package com.wjl.system.domain.exam.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ExamVO {
    private Long examId;
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private Long createBy;
    private Long updateBy;
}
