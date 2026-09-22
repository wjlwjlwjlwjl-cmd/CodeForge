package com.wjl.system.domain.question.vo;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema (description = "题目列表VO（分页结果）")
public class ListQuestionVO {
    @Schema (description = "总记录数")
    private Long total;

    @Schema (description = "总页数")
    private Integer pages;

    @Schema (description = "当前页码")
    private Integer pageNum;

    @Schema (description = "每页条数")
    private Integer pageSize;

    @Schema (description = "当前页数据")
    private List<QuestionVO> list;
}
