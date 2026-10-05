package com.wjl.job.domain.language;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LanguageProfile {
    private String image;
    private String hostDir;
    private String containerDir;
    private String containerName;
    private String sourceFileName;
    private String compileTemplate;
    private String runtimeTemplate;
    private long compileTimeoutMs;
    private long runTimeoutMs;
    private long runOverheadMs;
}
