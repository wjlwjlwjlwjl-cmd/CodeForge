package com.wjl.system.entity.user;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("tb_user")
public class CUser {
    @TableId(value="user_id", type= IdType.AUTO)
    private Long userId;
    private String nickName;
    private Integer sex;
    private String email;
    private String password; //带盐值的哈希
    private String schoolName;
    private String majorName;
    private String introduce;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private Long updateBy;
}
