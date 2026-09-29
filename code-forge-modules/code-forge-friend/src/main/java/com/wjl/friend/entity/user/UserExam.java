package com.wjl.friend.entity.user;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("tb_user_exam")
@Schema(description = "竞赛关系实体类")
public class UserExam {
    @TableId(value="user_exam_id", type=IdType.AUTO)
    private Long userExamId;
    private Long userId;
    private Long examId;
    private Integer score;
    private Integer examRank;
    private Long createBy;
    private LocalDateTime createTime;
    private Long updateBy;
    private LocalDateTime updateTime;
}
