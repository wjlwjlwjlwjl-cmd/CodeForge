package com.wjl.domain.dto;

import lombok.Data;

/**
 * 用户信息上下文
 */
@Data
public class LoginUserDTO {
    /**
     * 用户id
     */
    private String userId;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 用户账号
     */
    private String userAccount;

    /**
     * 用户名称
     */
    private String username;

    /**
     * 登录时间
     */
    private Long loginTime;

    /**
     * 过期时间
     */
    private Long expireTime;
}
