package com.wjl.system.service.user;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.github.pagehelper.PageHelper;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.exception.ServiceException;
import com.wjl.system.domain.user.dto.b.UserDTO;
import com.wjl.system.domain.user.dto.b.UserQueryDTO;
import com.wjl.system.domain.user.vo.b.UserListVO;
import com.wjl.system.domain.user.vo.b.UserVO;
import com.wjl.system.entity.user.CUser;
import com.wjl.system.mapper.CUserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BUserService {
    @Autowired
    private CUserMapper cUserMapper;

    public UserListVO list(UserQueryDTO userQueryDTO) {
        UserListVO userListVO = new UserListVO();

        int pageNum = userQueryDTO.getPageNum();
        int pageSize = userQueryDTO.getPageSize();
        PageHelper.startPage(pageNum, pageSize);

        List<CUser> cUsers = cUserMapper.selectUserList(userQueryDTO);
        List<UserVO> list = BeanCopyUtil.copyListProperties(cUsers, UserVO::new);
        userListVO.setList(list);

        return userListVO;
    }

    public String updateStatus(UserDTO userDTO) {
        Long userId = userDTO.getUserId();
        Integer status = userDTO.getStatus();
        int cnt = cUserMapper.update(new LambdaUpdateWrapper<CUser>()
                .eq(CUser::getUserId, userId)
                .set(CUser::getStatus, status)
        );
        if(cnt < 0){
            throw new ServiceException(ResultCode.FAILED_USER_NOT_EXISTS.getCode(), ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }
        return String.format("成功更新%d状态", userId);
    }
}
