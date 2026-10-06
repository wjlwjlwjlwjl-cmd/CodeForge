package com.wjl.domain.domain.dto;

import lombok.Data;

@Data
public class CaseResultDTO {
    private int caseIndex; //测试用例序号
    private String stdout;
    private String stderr;
    private String expectedOutput;
}
