package com.wjl.system.domain.vo;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data 
@Schema (description = "系统用户VO")
public class SysUserVO {
    private Integer errCode;
    private Long id;
    private Long userId;
    private String userAccount;
    private String nickName;
    private Long createBy;
    private Long updateBy;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
