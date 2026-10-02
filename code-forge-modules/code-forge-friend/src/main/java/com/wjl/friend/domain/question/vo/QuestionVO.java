package com.wjl.friend.domain.question.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class QuestionVO {
    private Long id;
    private String title;
    private Integer difficulty;
    private Integer timeLimit;
    private Integer spaceLimit;
}
