package com.wjl.system.entity;

import java.time.LocalDateTime;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Data;

@Data 
@TableName ("tb_sys_user")
public class SysUser {
    @TableId (value="user_id", type=IdType.ASSIGN_ID)
    private Long userId;
    private String userAccount;
    private String password;
    private String nickName;
    private Long createBy;
    private LocalDateTime createTime;
    private Long updateBy;
    private LocalDateTime updateTime;
}