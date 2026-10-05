package com.wjl.job.domain.dto;

import lombok.Data;

import java.util.List;

@Data
public class JudgeRequestDTO {
    private Long userId;
    private Long submitId;
    private String sourceCode;
    private List<TestCaseDTO> testCases;
}