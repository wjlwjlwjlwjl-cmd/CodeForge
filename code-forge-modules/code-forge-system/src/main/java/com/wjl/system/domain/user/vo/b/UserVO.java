package com.wjl.system.domain.user.vo.b;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserVO{
    private Long userId;
    private String nickName;
    private String headImage;
    private Integer sex;
    private String email;
    private String schoolName;
    private String majorName;
    private String introduce;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private Long updateBy;
}
