package com.wjl.system.service.user;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.wjl.domain.constants.CommonConstants;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.core.enums.ResultCode;
import com.wjl.domain.exception.ServiceException;
import com.wjl.system.domain.user.dto.b.UserDTO;
import com.wjl.system.domain.user.dto.b.UserQueryDTO;
import com.wjl.system.domain.user.vo.b.UserListVO;
import com.wjl.system.domain.user.vo.b.UserVO;
import com.wjl.system.entity.user.CUser;
import com.wjl.system.mapper.CUserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {
    @Autowired
    private CUserMapper cUserMapper;

    public UserListVO list(UserQueryDTO userQueryDTO) {
        UserListVO userListVO = new UserListVO();

        int pageNum = userQueryDTO.getPageNum();
        int pageSize = CommonConstants.PAGE_SIZE;
        PageHelper.startPage(pageNum, pageSize);
        List<CUser> cUsers = cUserMapper.selectUserList(userQueryDTO);
        PageInfo<CUser> pageInfo = new PageInfo<>(cUsers);
        List<UserVO> list = BeanCopyUtil.copyListProperties(cUsers, UserVO::new);

        userListVO.setList(list);
        userListVO.setPageNum(pageInfo.getPageNum());
        userListVO.setPages(pageInfo.getPages());
        userListVO.setPageSize(pageInfo.getPageSize());
        userListVO.setTotal(pageInfo.getTotal());

        return userListVO;
    }

    public String updateStatus(UserDTO userDTO, String token) {
        Long userId = userDTO.getUserId();
        Integer status = userDTO.getStatus();
        int cnt = cUserMapper.update(new LambdaUpdateWrapper<CUser>()
                .eq(CUser::getUserId, userId)
                .set(CUser::getStatus, status)
                .set(CUser::getUpdateTime, LocalDateTime.now())
                .set(CUser::getUpdateBy, userId)
        );
        if(cnt < 0){
            throw new ServiceException(ResultCode.FAILED_USER_NOT_EXISTS.getCode(), ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }
        return String.format("成功更新%d状态", userId);
    }
}
