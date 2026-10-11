package com.wjl.friend.controller.user;

import com.wjl.domain.constants.SecurityConstants;
import com.wjl.core.domain.R;
import com.wjl.domain.domain.vo.AvatarUploadVO;
import com.wjl.friend.domain.submit.SubmitInfoVO;
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
import org.springframework.web.multipart.MultipartFile;

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
    @Operation(description = "发送验证码") //done
    public R<Boolean> sendCode(@RequestParam String email){
        return R.success(userService.sendCode(email));
    }

    @PostMapping("/register")
    @Operation(description = "用户注册") //done
    public R<Boolean> register(@Validated @RequestBody UserRegisterDTO dto){
        return R.success(userService.register(dto));
    }

    @PostMapping("/login")
    @Operation(description = "登陆") //done
    public R<String> login(@Validated @RequestBody UserLoginDTO dto){
        return R.success(userService.login(dto));
    }

    @DeleteMapping("/logout")
    @Operation(description = "登出") //done
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
        return R.success(userDetailVO);
    }

    @GetMapping("/avatar")
    @Operation(description = "获取用户头像预签名url，前端自行在规定时间内到oss完成文件下载") //done
    public R<String> avatar(@RequestHeader(SecurityConstants.AUTHENTICATION) String token){
        return R.success(userService.getAvatarUrl(token));
    }

    // 前端完成三层校验：
    // 1. 文件大小限制
    // 2. 文件类型限制  "image/jpeg", "image/jpg", "image/png", "image/webp"
    // 3. 文件尺寸限制 200×200 ~ 2000×2000
    @PostMapping("/avatar/upload")
    @Operation(description = "上传用户头像")
    public R<AvatarUploadVO> avatarUpload(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, MultipartFile avatar){
        return R.success(userService.avatarUpload(token, avatar));
    }

    @GetMapping("/submitInfo")
    @Operation(description = "获取提交信息（通过数、提交数、通过率）") //done
    public R<SubmitInfoVO> submitSum(@RequestHeader(SecurityConstants.AUTHENTICATION) String token){
        return R.success(userService.getSubmitInfo(token));
    }
}