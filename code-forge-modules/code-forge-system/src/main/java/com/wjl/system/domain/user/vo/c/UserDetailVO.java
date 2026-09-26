package com.wjl.system.domain.user.vo.c;

import lombok.Data;

@Data
public class UserDetailVO {
    private String nickName;
    private Integer sex;
    private String email;
    private String schoolName;
    private String majorName;
    private String introduce;
}
