package com.wjl.judge.domain.dto;

import lombok.Data;

import java.util.List;

@Data
public class JudgeRequestDTO {
    private String sourceCode;
    private List<TestCaseDTO> testCases;
    private Integer timeLimitsMs;
}