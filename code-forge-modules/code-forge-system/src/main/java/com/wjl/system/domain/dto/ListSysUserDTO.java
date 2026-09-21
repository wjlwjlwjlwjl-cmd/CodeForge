package com.wjl.system.domain.dto;

import java.util.List;

import com.wjl.system.domain.vo.SysUserVO;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data 
@Schema (description = "用户列表DTO")
public class ListSysUserDTO {
    private List<SysUserVO> list;
}
