package com.wjl.friend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import com.wjl.friend.entity.user.User;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
