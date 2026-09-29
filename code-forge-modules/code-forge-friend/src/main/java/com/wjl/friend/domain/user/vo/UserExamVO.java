package com.wjl.friend.domain.user.vo;

import lombok.Data;

@Data
public class UserExamVO {
    private Long userId;
    private Long examId;
    private Integer score;
    private Integer examRank;
}
