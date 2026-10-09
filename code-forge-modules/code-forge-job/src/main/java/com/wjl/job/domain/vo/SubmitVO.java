package com.wjl.job.domain.vo;

import com.wjl.domain.enums.JudgeStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SubmitVO {
    private Long submitId; //获取详细提交信息
    private Integer pass;
    private Integer programType;
    private Integer runTime;
    private String title;
    private LocalDateTime createTime;
}