package com.wjl.system.domain.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data 
public class SysUserDTO {
    private Long id;
    private Long userId;
    private String userAccount;
    private String nickName;
    private Long createBy;
    private Long updateBy;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
