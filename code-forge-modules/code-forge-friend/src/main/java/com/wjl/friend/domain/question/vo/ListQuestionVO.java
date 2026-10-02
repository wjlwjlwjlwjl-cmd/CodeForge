package com.wjl.system.domain.question.vo;

import com.wjl.domain.vo.BasePageVO;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema (description = "题目列表VO（分页结果）")
public class ListQuestionVO extends BasePageVO<QuestionVO> {
}
