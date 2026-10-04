package com.wjl.judge.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum JudgeStatus {
    ACCEPTED (1, "通过"),
    WRONG_ANSWER (2, "解答错误"),
    COMPILE_ERROR (3, "编译错误"),
    COMPILE_TIMEOUT (4, "编译超时"),
    TIME_LIMIT_EXCEEDED (5, "运行超时"),
    RUNTIME_ERROR (6, "运行时错误"),
    SYSTEM_ERROR (7, "系统错误");

    private Integer status;
    private String msg;
}
