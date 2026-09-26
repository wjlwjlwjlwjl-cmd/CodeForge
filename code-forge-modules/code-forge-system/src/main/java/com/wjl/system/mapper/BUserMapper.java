package com.wjl.system.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wjl.system.entity.system.BUser;

import io.swagger.v3.oas.annotations.media.Schema;

@Mapper 
@Schema (description = "系统用户Mapper")
public interface BUserMapper extends BaseMapper<BUser> {

}
