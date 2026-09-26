package com.wjl.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wjl.system.domain.user.dto.b.UserQueryDTO;
import com.wjl.system.entity.user.CUser;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CUserMapper extends BaseMapper<CUser> {
    public List<CUser> selectUserList(UserQueryDTO userQueryDTO);
}
