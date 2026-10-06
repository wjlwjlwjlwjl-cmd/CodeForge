package com.wjl.system.domain.exam.dto;

import com.wjl.domain.domain.dto.BasePageDTO;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ExamQueryDTO extends BasePageDTO {
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
