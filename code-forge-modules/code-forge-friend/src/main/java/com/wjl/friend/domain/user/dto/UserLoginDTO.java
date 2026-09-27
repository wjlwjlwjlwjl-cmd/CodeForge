package com.wjl.friend.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserLoginDTO {
    @NotBlank(message="email 不能为空")
    private String email;
    @NotBlank(message="password 不能为空")
    private String password;
}
