package com.wjl.system.domain.vo;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data 
@Schema (description = "用户列表VO")
public class ListSysUserVO {
    private List<SysUserVO> list;
}
