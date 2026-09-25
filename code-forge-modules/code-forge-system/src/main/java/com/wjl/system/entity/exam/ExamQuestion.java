package com.wjl.system.entity.exam;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("tb_exam_question")
public class ExamQuestion {
    @TableId(value="exam_question_id", type = IdType.AUTO)
    private Long examQuestionId;
    private Long questionId;
    private Long examId;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private Long createBy;
    private Long updateBy;
}
