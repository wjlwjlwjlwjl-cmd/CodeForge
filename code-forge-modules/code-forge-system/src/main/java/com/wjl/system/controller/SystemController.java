package com.wjl.system.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wjl.core.domain.R;
import com.wjl.system.domain.system.dto.AddAdminDTO;
import com.wjl.system.domain.system.dto.SysLoginDTO;
import com.wjl.system.domain.system.vo.AddAdminVO;
import com.wjl.system.domain.system.vo.ListSysUserVO;
import com.wjl.system.domain.system.vo.SysLoginVO;
import com.wjl.system.domain.system.vo.SysUserVO;
import com.wjl.system.service.system.SysUserService;

import org.springframework.web.bind.annotation.RequestBody;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController 
@RequestMapping ("/system")
@Tag (name = "系统用户管理接口")
public class SystemController {
    @Autowired 
    private SysUserService sysUserService;
    
    @PostMapping ("/login")
    @Operation (summary = "系统用户登录")
    @Parameter (name = "loginDTO", description = "登录参数，提供用户昵称 + 密码")
    @ApiResponse (responseCode = "1000", description = "登录成功")
    @ApiResponse (responseCode = "3103", description = "用户名密码错误")
    public R<SysLoginVO> login(@RequestBody SysLoginDTO loginDTO) {
        return R.success(sysUserService.login(loginDTO));
    }

    @DeleteMapping("/logout")
    @Operation(summary = "系统用户退出登录")
    @Parameter (name = "Authorization", description = "用户登录时返回的 jwt token")
    @ApiResponse (responseCode = "1000", description = "退出登录成功")
    public R<Void> logout(@Validated @RequestHeader("Authorization") String token){
        sysUserService.logout(token);
        return R.success();
    }

    @PostMapping ("/add")
    @Operation(summary = "添加一个管理员用户")
    @Parameter (name = "addAdminDTO", description = "添加管理员用户参数，提供用户昵称 + 密码，如果成功，返回管理员用户账号")
    @ApiResponse (responseCode = "1000", description = "添加成功")
    @ApiResponse (responseCode = "3001", description = "未授权")
    @ApiResponse (responseCode = "3101", description = "用户已存在")
    @ApiResponse (responseCode = "3000", description = "操作失败")
    public R<AddAdminVO> add(@RequestHeader("Authorization") String token, @RequestBody AddAdminDTO addAdminDTO){
        return R.success(sysUserService.addAdmin(token, addAdminDTO));
    }

    @GetMapping ("/info")
    @Operation(summary = "获取当前用户信息")
    @ApiResponse (responseCode = "1000", description = "获取成功")
    @ApiResponse (responseCode = "3001", description = "未授权")
    @ApiResponse (responseCode = "3102", description = "用户不存在")
    public R<SysUserVO> info(@RequestHeader("Authorization") String token){
        return R.success(sysUserService.info(token));
    }

    @GetMapping ("/list")
    @Operation(summary = "获取所有管理员用户信息")
    @ApiResponse (responseCode = "1000", description = "获取成功")
    @ApiResponse (responseCode = "3001", description = "未授权")
    public R<ListSysUserVO> list(@RequestHeader("Authorization") String token){
        return R.success(sysUserService.list(token));
    }

    @DeleteMapping("/delete/{userAccount}")
    @Operation(summary = "删除一个管理员用户")
    @Parameter (name = "userAccount", description = "管理员用户 id")
    @ApiResponse (responseCode = "1000", description = "删除成功")
    @ApiResponse (responseCode = "3001", description = "未授权")
    @ApiResponse (responseCode = "3102", description = "用户不存在")
    public R<Integer> delete(@RequestHeader("Authorization") String token, @Validated @PathVariable ("userAccount") String userAccount){
        return R.success(sysUserService.delete(token, userAccount));
    }
}