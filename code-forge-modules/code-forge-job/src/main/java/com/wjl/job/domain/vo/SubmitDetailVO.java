package com.wjl.job.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SubmitDetailVO {
    private Integer pass;
    private LocalDateTime createTime;
    private Integer programType;
    private Integer runTime;
    private String title;
    private String userCode;
}