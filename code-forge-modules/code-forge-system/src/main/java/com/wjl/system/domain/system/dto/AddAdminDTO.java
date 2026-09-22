package com.wjl.system.domain.system.dto;

import org.hibernate.validator.constraints.Length;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data 
public class AddAdminDTO {
    @Length (min = 6, max = 12, message = "密码长度必须在6-12之间")
    private String password;
    @NotEmpty (message = "昵称不能为空")
    private String nickname;
}
