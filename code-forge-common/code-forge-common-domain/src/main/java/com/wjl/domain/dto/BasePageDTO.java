package com.wjl.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class BasePageDTO {
    @Schema(description = "页码，从 1 开始", example = "1")
    @Min(value = 1, message = "页码不能小于 1")
    private Integer pageNum = 1;

    @Schema (description = "每页条数", example = "10")
    @Min (value = 1, message = "每页条数不能小于 1")
    @Max(value = 100, message = "每页条数不能大于 100")
    private Integer pageSize = 10;
}