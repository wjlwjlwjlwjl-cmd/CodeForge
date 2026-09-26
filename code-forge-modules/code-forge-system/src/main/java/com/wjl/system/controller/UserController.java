package com.wjl.system.controller;

import com.wjl.constants.SecurityConstants;
import com.wjl.core.domain.R;
import com.wjl.system.domain.user.dto.b.UserDTO;
import com.wjl.system.domain.user.dto.b.UserQueryDTO;
import com.wjl.system.domain.user.dto.c.UserAddInfoDTO;
import com.wjl.system.domain.user.dto.c.UserLoginDTO;
import com.wjl.system.domain.user.dto.c.UserRegisterDTO;
import com.wjl.system.domain.user.vo.b.UserListVO;
import com.wjl.system.domain.user.vo.c.UserDetailVO;
import com.wjl.system.service.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {
    @Autowired
    private UserService userService;

    @RequestMapping("/b/list")
    public R<UserListVO> list(UserQueryDTO userQueryDTO) {
        return R.success(userService.list(userQueryDTO));
    }

    @RequestMapping("/b/update")
    public R<String> updateStatus(UserDTO userDTO) {
        return R.success(userService.updateStatus(userDTO));
    }

    @RequestMapping("/sendCode")
    public R<Boolean> sendCode(@RequestParam String email){
        return R.success(userService.sendCode(email));
    }

    @PostMapping("/register")
    public R<Boolean> register(@Validated @RequestBody UserRegisterDTO dto){
        return R.success(userService.register(dto));
    }

    @PostMapping("/login")
    public R<String> login(@Validated @RequestBody UserLoginDTO dto){
        return R.success(userService.login(dto));
    }

    @PostMapping("/addInfo")
    public R<String> addInfo(@Validated @RequestBody UserAddInfoDTO dto, @RequestHeader(SecurityConstants.AUTHENTICATION) String token){
        return R.success(userService.addUserInfo(token, dto));
    }

    @GetMapping("/detail")
    public R<UserDetailVO> detail(@RequestHeader(SecurityConstants.AUTHENTICATION) String token){
        return R.success(userService.detail(token));
    }
}
