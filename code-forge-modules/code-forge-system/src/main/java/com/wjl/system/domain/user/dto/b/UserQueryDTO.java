package com.wjl.system.domain.user.dto.b;

import com.wjl.domain.dto.BasePageDTO;
import lombok.Data;

@Data
public class UserQueryDTO extends BasePageDTO {
    private Long userId;
    private String nickName; //粗略匹配
}
