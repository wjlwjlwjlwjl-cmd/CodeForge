package com.wjl.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

@Data
public class BasePageVO<T> {
    @Schema(description = "总记录数")
    private Long total;

    @Schema (description = "总页数")
    private Integer pages;

    @Schema (description = "当前页码")
    private Integer pageNum;

    @Schema (description = "每页条数")
    private Integer pageSize;

    @Schema (description = "当前页数据")
    private List<T> list;
}