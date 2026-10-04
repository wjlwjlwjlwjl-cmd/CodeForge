package com.wjl.judge.domain.dto;

import com.wjl.judge.enums.JudgeStatus;
import lombok.Data;

@Data
public class CaseResultDTO {
    private int caseIndex; //测试用例序号
    private JudgeStatus status;
    private String stdout;
    private String stderr;
    private Long timeMs;
    private Long exitCode;
}
