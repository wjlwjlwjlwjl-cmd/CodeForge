package com.wjl.job.domain.dto;

import com.wjl.job.enums.JudgeStatus;
import lombok.Data;

import java.util.List;

@Data
public class JudgeResponseDTO {
    private Long submitId;
    private JudgeStatus status;
    private String compileResult;
    private List<CaseResultDTO> caseResults;
}
