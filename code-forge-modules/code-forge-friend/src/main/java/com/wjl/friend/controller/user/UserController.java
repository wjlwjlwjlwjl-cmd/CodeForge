package com.wjl.friend.controller.user;

import com.wjl.constants.SecurityConstants;
import com.wjl.core.domain.R;
import com.wjl.core.utils.ColorLog;
import com.wjl.friend.domain.user.dto.UserAddInfoDTO;
import com.wjl.friend.domain.user.dto.UserLoginDTO;
import com.wjl.friend.domain.user.dto.UserRegisterDTO;
import com.wjl.friend.domain.user.vo.UserDetailVO;
import com.wjl.friend.service.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * 模块登录后，可以允许进行竞赛的报名操作
 */
@RestController
@RequestMapping("/user")
@Tag(name = "用户信息维护接口（登陆态、身份信息等）")
public class UserController {
    @Autowired
    private UserService userService;

    @RequestMapping("/sendCode")
    @Operation(description = "发送验证码")
    public R<Boolean> sendCode(@RequestParam String email){
        return R.success(userService.sendCode(email));
    }

    @PostMapping("/register")
    @Operation(description = "用户注册")
    public R<Boolean> register(@Validated @RequestBody UserRegisterDTO dto){
        return R.success(userService.register(dto));
    }

    @PostMapping("/login")
    @Operation(description = "登陆")
    public R<String> login(@Validated @RequestBody UserLoginDTO dto){
        return R.success(userService.login(dto));
    }

    @DeleteMapping("/logout")
    @Operation(description = "登出")
    public R<Void> logout(@RequestHeader(SecurityConstants.AUTHENTICATION) String token){
        userService.logout(token);
        return R.success();
    }

    @PostMapping("/addInfo")
    @Operation(description = "增添用户信息（学校、专业、自我介绍）")
    public R<String> addInfo(@Validated @RequestBody UserAddInfoDTO dto, @RequestHeader(SecurityConstants.AUTHENTICATION) String token){
        return R.success(userService.addUserInfo(token, dto));
    }

    @GetMapping("/detail")
    @Operation(description = "获取用户详细信息")
    public R<UserDetailVO> detail(@RequestHeader(SecurityConstants.AUTHENTICATION) String token){
        UserDetailVO userDetailVO = userService.detail(token);
        ColorLog.info(userDetailVO.getIntroduce());
        return R.success(userDetailVO);
    }
}