package com.wjl.domain.domain.vo;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class AvatarUploadVO {
    private Boolean success;
    private String errMsg;

    public static AvatarUploadVO getErrVO(String errMsg) {
        AvatarUploadVO avatarUploadVO = new AvatarUploadVO();
        avatarUploadVO.setSuccess(false);
        avatarUploadVO.setErrMsg(errMsg);
        return avatarUploadVO;
    }
}
