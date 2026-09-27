package com.wjl.friend.controller.user;

import com.wjl.constants.SecurityConstants;
import com.wjl.core.domain.R;
import com.wjl.friend.domain.user.dto.UserLoginDTO;
import com.wjl.friend.service.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * 模块登录后，可以允许进行竞赛的报名操作
 */
@RestController
@RequestMapping("/user")
public class UserController {
    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public R<String> login(@Validated @RequestBody UserLoginDTO dto){
        return R.success(userService.login(dto));
    }

    @DeleteMapping("/logout")
    public R<Void> logout(@RequestHeader(SecurityConstants.AUTHENTICATION) String token){
        userService.logout(token);
        return R.success();
    }
}