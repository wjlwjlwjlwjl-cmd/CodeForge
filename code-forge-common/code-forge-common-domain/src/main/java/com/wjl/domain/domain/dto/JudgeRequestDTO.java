package com.wjl.domain.domain.dto;

import lombok.Data;

import java.util.List;

@Data
public class JudgeRequestDTO {
    private Long submitId;
    private Long userId;
    private Long examId;
    private Long questionId;
    private String sourceCode;
    private Integer lang;
    private List<TestCaseDTO> testCases;
}
