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
    private JudgeStatus status;
    private String compileResult;
    private List<CaseResultDTO> caseResults;
    private Integer runTime;
    private String userCode;
}
