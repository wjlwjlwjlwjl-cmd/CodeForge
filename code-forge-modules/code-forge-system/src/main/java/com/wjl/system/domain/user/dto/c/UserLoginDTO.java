package com.wjl.system.domain.user.dto.c;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserLoginDTO {
    @NotBlank(message="email 不能为空")
    private String email;
    @NotBlank(message="password 不能为空")
    private String password;
}
