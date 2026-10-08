package com.wjl.job.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("tb_user_submit")
public class UserSubmit {
    @TableId(value="submit_id", type= IdType.AUTO)
    private Long submitId;
    private Long userId; //唯一键
    private Long questionId;
    private Long examId; //所属竞赛的id
    private Integer programType; //0-java，1-cpp
    private String userCode; //用户代码
    private Integer pass; //是否通过 0:compile error 1:未能正常运行 2:超时错误 3:答案错误 4:ac
    private String exeMessage; //执行结果
    //0: stderr, 1: stderr, 2: null, 3: stdout 4: null
    private Integer runTime; //运行时间ms
    private Long createBy;
    private LocalDateTime createTime;
    private Long updateBy;
    private LocalDateTime updateTime;
}
