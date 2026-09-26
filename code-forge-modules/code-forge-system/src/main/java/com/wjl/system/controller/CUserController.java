package com.wjl.system.controller;

import com.wjl.constants.SecurityConstants;
import com.wjl.core.domain.R;
import com.wjl.system.domain.user.dto.c.UserAddInfoDTO;
import com.wjl.system.domain.user.dto.c.UserLoginDTO;
import com.wjl.system.domain.user.dto.c.UserRegisterDTO;
import com.wjl.system.domain.user.vo.c.UserDetailVO;
import com.wjl.system.service.user.CUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user/c")
public class CUserController {
    @Autowired
    private CUserService cUserService;

    @RequestMapping("/sendCode")
    public R<Boolean> sendCode(@RequestParam String email){
        return R.success(cUserService.sendCode(email));
    }

    @PostMapping("/register")
    public R<Boolean> register(@Validated @RequestBody UserRegisterDTO dto){
        return R.success(cUserService.register(dto));
    }

    @PostMapping("/login")
    public R<String> login(@Validated @RequestBody UserLoginDTO dto){
        return R.success(cUserService.login(dto));
    }

    @PostMapping("/addInfo")
    public R<String> addInfo(@Validated @RequestBody UserAddInfoDTO dto, @RequestHeader(SecurityConstants.AUTHENTICATION) String token){
        return R.success(cUserService.addUserInfo(token, dto));
    }

    @GetMapping("/detail")
    public R<UserDetailVO> detail(@RequestHeader(SecurityConstants.AUTHENTICATION) String token){
        return R.success(cUserService.detail(token));
    }
}
