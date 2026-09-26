package com.wjl.system.controller;

import com.wjl.core.domain.R;
import com.wjl.system.domain.user.dto.b.UserDTO;
import com.wjl.system.domain.user.dto.b.UserQueryDTO;
import com.wjl.system.domain.user.vo.UserListVO;
import com.wjl.system.service.user.BUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user/b")
public class BUserController {
    @Autowired
    private BUserService userService;

    @RequestMapping("/list")
    public R<UserListVO> list(UserQueryDTO userQueryDTO) {
        return R.success(userService.list(userQueryDTO));
    }

    @RequestMapping("/update")
    public R<String> updateStatus(UserDTO userDTO) {
        return R.success(userService.updateStatus(userDTO));
    }
}
