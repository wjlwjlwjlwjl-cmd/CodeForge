package com.wjl.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wjl.system.domain.user.dto.UserQueryDTO;
import com.wjl.system.entity.user.User;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface UserMapper extends BaseMapper<User> {
    public List<User> selectUserList(UserQueryDTO userQueryDTO);
}
