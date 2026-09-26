package com.wjl.system.domain.user.dto.c;

import lombok.Data;
import org.hibernate.validator.constraints.Length;

@Data
public class UserAddInfoDTO {
    @Length(max=20, message="学校名称不得超过 20 个字符")
    private String schoolName;
    @Length(max=20, message="专业名称不得超过 20 个字符")
    private String majorName;
    @Length(max=100, message="自我介绍应在 100 字符内")
    private String introduce;
}
