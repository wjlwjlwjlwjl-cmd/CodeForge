package com.wjl.judge.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ContainerExecResultDTO {
    private Boolean success;
    private String stdout;
    private String stderr;
    private Long exitCode;
}
