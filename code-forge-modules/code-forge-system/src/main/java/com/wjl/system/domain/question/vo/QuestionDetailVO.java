package com.wjl.system.domain.question.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class QuestionDetailVO {
    private Long id;
    private String title;
    private Integer difficulty;
    private Integer timeLimit;
    private Integer spaceLimit;
    private String content;
    private String questionCase;
    private String defaultCode;
    private String mainFuc;
}
