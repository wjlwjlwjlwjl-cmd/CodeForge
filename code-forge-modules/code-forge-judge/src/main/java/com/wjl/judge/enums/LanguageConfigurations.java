package com.wjl.judge.enums;

import com.wjl.constants.CommonConstants;
import com.wjl.judge.domain.language.LanguageProfile;
import lombok.Getter;

@Getter
public enum LanguageConfigurations {
    JAVA_PROFILE(
            CommonConstants.JAVA_IMAGE,
            CommonConstants.JAVA_HOST_DIR,
            CommonConstants.JAVA_CONTAINER_DIR,
            CommonConstants.JAVA_CONTAINER_NAME,
            CommonConstants.JAVA_SOURCE_CODE,
            CommonConstants.JAVA_COMPILE_TEMPLATE,
            CommonConstants.JAVA_RUNTIME_TEMPLATE,
            CommonConstants.JAVA_COMPILE_TIMEOUT_MS,
            CommonConstants.JAVA_RUN_TIMEOUT_MS,
            CommonConstants.JAVA_RUN_OVERHEAD_MS);

    private final LanguageProfile languageProfile;

    LanguageConfigurations(String image, String hostDir, String containerDir, String containerName, String sourceCode, String compileTemplate, String runtimeTemplate, long compileTimeoutMs, long runTimeoutMs, long runOverheadMs) {
        this.languageProfile = new LanguageProfile(image, hostDir, containerDir, containerName, sourceCode, compileTemplate, runtimeTemplate, compileTimeoutMs, runTimeoutMs, runOverheadMs);
    }
}