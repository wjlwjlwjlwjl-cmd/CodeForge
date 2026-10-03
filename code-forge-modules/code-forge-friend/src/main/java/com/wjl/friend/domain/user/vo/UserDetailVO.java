package com.wjl.friend.domain.user.vo;

import lombok.Data;

@Data
public class UserDetailVO {
    private String nickName;
    private Integer sex;
    private String email;
    private String avatarName;
    private String schoolName;
    private String majorName;
    private String introduce;
}
