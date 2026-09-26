package com.wjl.system.domain.user.dto.c;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

@Data
public class UserRegisterDTO {
    @Length(min = 4, max = 20, message="昵称长度应在4～18个字符之间")
    private String nickName;

    @Min(value=1)
    @Max(value=2)
    private Integer sex;

    @NotBlank(message="邮箱不得为空")
    @Length(max=50, message="邮箱长度上线为50个字符")
    private String email;

    @NotBlank(message="验证码不能为空")
    private String code;

    @Length(min = 6, max = 15, message = "密码长度应在6~15位")
    private String password;

    @Length(max=20)
    private String schoolName;
    @Length(max=20)
    private String majorName;
}
