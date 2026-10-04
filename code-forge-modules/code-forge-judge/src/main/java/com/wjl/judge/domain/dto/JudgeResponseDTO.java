package com.wjl.judge.domain.dto;

import com.wjl.judge.enums.JudgeStatus;
import lombok.Data;

import java.util.List;

@Data
public class JudgeResponseDTO {
    private JudgeStatus status;
    private String compileResult;
    private List<CaseResultDTO> caseResults;
}
