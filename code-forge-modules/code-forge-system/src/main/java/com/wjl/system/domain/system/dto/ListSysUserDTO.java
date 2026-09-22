package com.wjl.system.domain.system.dto;

import java.util.List;

import com.wjl.system.domain.system.vo.SysUserVO;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data 
@Schema (description = "用户列表DTO")
public class ListSysUserDTO {
    private List<SysUserVO> list;
}
