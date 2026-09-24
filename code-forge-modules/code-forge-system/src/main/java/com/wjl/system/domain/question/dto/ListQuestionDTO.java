package com.wjl.system.domain.question.dto;

import com.wjl.domain.dto.BasePageDTO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Schema (description = "题目列表查询DTO（分页）")
public class ListQuestionDTO extends BasePageDTO {
}
