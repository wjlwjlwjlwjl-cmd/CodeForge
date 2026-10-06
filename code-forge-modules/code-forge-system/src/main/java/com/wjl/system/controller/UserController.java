package com.wjl.system.controller;

import com.wjl.domain.constants.SecurityConstants;
import com.wjl.core.domain.R;
import com.wjl.system.domain.user.dto.b.UserDTO;
import com.wjl.system.domain.user.dto.b.UserQueryDTO;
import com.wjl.system.domain.user.vo.b.UserListVO;
import com.wjl.system.service.user.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user/b")
@Tag(name="管理员用户操作")
public class UserController {
    @Autowired
    private UserService userService;

    @RequestMapping("/list")
    @Operation(description = "管理员查询用户（用户 id + 昵称）")
    public R<UserListVO> list(UserQueryDTO userQueryDTO) {
        return R.success(userService.list(userQueryDTO));
    }

    @RequestMapping("/update")
    @Operation(description = "管理员更新用户状态（拉黑/解封）")
    public R<String> updateStatus(UserDTO userDTO, @RequestHeader(SecurityConstants.AUTHENTICATION) String token) {
        return R.success(userService.updateStatus(userDTO, token));
    }
}
