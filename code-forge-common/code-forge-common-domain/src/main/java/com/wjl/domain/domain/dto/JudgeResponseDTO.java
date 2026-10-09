package com.wjl.domain.domain.dto;

import com.wjl.domain.enums.JudgeStatus;
import lombok.Data;

import java.util.List;

@Data
public class JudgeResponseDTO {
    private Long submitId;
    private Long userId;
    private Long examId;
    private Long questionId;
    private Integer lang;
    private JudgeStatus status;
    private String compileResult;
    private List<CaseResultDTO> caseResults;
    private Integer runTime;
    private String userCode;
    private String errMsg; //http 的全局异常处理不适用于 rabbitmq 线程中抛出的异常，需要单独处理
}
