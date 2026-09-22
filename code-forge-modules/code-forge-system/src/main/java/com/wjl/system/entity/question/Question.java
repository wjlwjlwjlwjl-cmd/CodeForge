package com.wjl.system.entity.question;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName(value="tb_question")
public class Question {
    @TableId(value="id", type= IdType.AUTO)
    private Long id;
    private Long questionId;
    private String title;
    private Integer difficulty;
    private Integer timeLimit;
    private Integer spaceLimit;
    private String content;
    private String questionCase;
    private String defaultCode;
    private String mainFuc;
    private Long createBy;
    private LocalDateTime createTime;
    private Long updateBy;
    private LocalDateTime updateTime;
}