package com.wjl.system.domain.question.vo;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema (description = "题目列表项VO")
public class QuestionVO {

    @Schema (description = "题目id")
    private Long id;

    @Schema (description = "题目标题")
    private String title;

    @Schema (description = "题目难度：1-简单 2-中等 3-困难")
    private Integer difficulty;

    @Schema (description = "时间限制")
    private Integer timeLimit;

    @Schema (description = "空间限制")
    private Integer spaceLimit;

    @Schema (description = "创建时间")
    private LocalDateTime createTime;
}
