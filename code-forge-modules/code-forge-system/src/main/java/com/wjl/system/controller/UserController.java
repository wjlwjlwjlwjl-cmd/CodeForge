package com.wjl.system.controller;

import com.wjl.core.domain.R;
import com.wjl.system.domain.user.dto.UserDTO;
import com.wjl.system.domain.user.dto.UserQueryDTO;
import com.wjl.system.domain.user.vo.UserListVO;
import com.wjl.system.service.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
public class UserController {
    @Autowired
    private UserService userService;

    @RequestMapping("/list")
    public R<UserListVO> list(UserQueryDTO userQueryDTO) {
        return R.success(userService.list(userQueryDTO));
    }

    @RequestMapping("/update")
    public R<String> updateStatus(UserDTO userDTO) {
        return R.success(userService.updateStatus(userDTO));
    }
}
