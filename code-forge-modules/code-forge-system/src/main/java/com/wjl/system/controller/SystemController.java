package com.wjl.system.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wjl.core.domain.R;
import com.wjl.system.domain.dto.SysLoginDTO;
import com.wjl.system.service.system.SysUserService;

@RestController 
@RequestMapping ("/system")
public class SystemController {
    @Autowired 
    private SysUserService sysUserService;
    
    //返回一个 jwt token 用于后续操作认证即可
    @RequestMapping("/login")
    public R<String> login(SysLoginDTO loginDTO) {
        return R.success(sysUserService.login(loginDTO));
    }

    //携带 jwt token 直接删除用户态即可
    @RequestMapping("/logout")
    public R<Void> logout(@RequestHeader("Authorization") String token){
        sysUserService.logout(token);
        return R.success();
    }

    //添加一个管理员用户（只需指定 password 和 nickname）
    @RequestMapping("/add")
    public R<Void> addAdmin(){
        return null;
    }
}
