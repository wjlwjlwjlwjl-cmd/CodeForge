package com.wjl.system.service.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.github.pagehelper.PageHelper;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.exception.ServiceException;
import com.wjl.system.domain.user.dto.UserDTO;
import com.wjl.system.domain.user.dto.UserQueryDTO;
import com.wjl.system.domain.user.vo.UserListVO;
import com.wjl.system.domain.user.vo.UserVO;
import com.wjl.system.entity.user.User;
import com.wjl.system.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    @Autowired
    private UserMapper userMapper;

    public UserListVO list(UserQueryDTO userQueryDTO) {
        UserListVO userListVO = new UserListVO();

        int pageNum = userQueryDTO.getPageNum();
        int pageSize = userQueryDTO.getPageSize();
        PageHelper.startPage(pageNum, pageSize);

        List<User> users = userMapper.selectUserList(userQueryDTO);
        List<UserVO> list = BeanCopyUtil.copyListProperties(users, UserVO::new);
        userListVO.setList(list);

        return userListVO;
    }

    public String updateStatus(UserDTO userDTO) {
        Long userId = userDTO.getUserId();
        Integer status = userDTO.getStatus();
        int cnt = userMapper.update(new LambdaUpdateWrapper<User>()
                .eq(User::getUserId, userId)
                .set(User::getStatus, status)
        );
        if(cnt < 0){
            throw new ServiceException(ResultCode.FAILED_USER_NOT_EXISTS.getCode(), ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }
        return String.format("成功更新%d状态", userId);
    }
}
