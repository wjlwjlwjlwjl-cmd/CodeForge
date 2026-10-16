package com.wjl.system.domain.user.dto.b;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class UserDTO {
    private Long userId;

    @Max(value = 1, message = "0-拉黑，1-正常")
    @Min(value = 0, message = "0-拉黑，1-正常")
    private Integer status;
}