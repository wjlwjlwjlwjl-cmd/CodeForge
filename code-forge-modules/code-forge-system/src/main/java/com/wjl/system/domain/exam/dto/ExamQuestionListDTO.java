package com.wjl.system.domain.exam.dto;

import com.wjl.domain.domain.dto.BasePageDTO;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ExamQuestionListDTO extends BasePageDTO {
    private Long examId;
}
