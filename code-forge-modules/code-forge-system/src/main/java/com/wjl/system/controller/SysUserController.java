package com.wjl.system.controller;

import com.wjl.domain.constants.SecurityConstants;
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
public class SysUserController {
    @Autowired 
    private SysUserService sysUserService;

    //done
    @PostMapping ("/b/login")
    @Operation(description = "管理员登录")
    public R<SysLoginVO> login(@RequestBody SysLoginDTO loginDTO) {
        return R.success(sysUserService.login(loginDTO));
    }

    //done
    @DeleteMapping("/b/logout")
    @Operation(summary = "系统用户退出登录")
    public R<Void> logout(@Validated @RequestHeader(SecurityConstants.AUTHENTICATION) String token){
        sysUserService.logout(token);
        return R.success();
    }

    //done
    @PostMapping ("/b/add")
    @Operation(summary = "添加一个管理员用户")
    public R<AddAdminVO> add(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, @RequestBody AddAdminDTO addAdminDTO){
        return R.success(sysUserService.addAdmin(token, addAdminDTO));
    }

    //done
    @GetMapping ("/b/info")
    @Operation(summary = "获取当前用户信息")
    public R<SysUserVO> info(@RequestHeader(SecurityConstants.AUTHENTICATION) String token){
        return R.success(sysUserService.info(token));
    }

    //done
    @GetMapping ("/b/list")
    @Operation(summary = "获取所有管理员用户信息")
    @ApiResponse (responseCode = "1000", description = "获取成功")
    @ApiResponse (responseCode = "3001", description = "未授权")
    public R<ListSysUserVO> list(){
        return R.success(sysUserService.list());
    }

    //done
    @DeleteMapping("/b/delete/{userAccount}")
    @Operation(summary = "删除一个管理员用户")
    @Parameter (name = "userAccount", description = "管理员用户 id")
    @ApiResponse (responseCode = "1000", description = "删除成功")
    @ApiResponse (responseCode = "3001", description = "未授权")
    @ApiResponse (responseCode = "3102", description = "用户不存在")
    public R<Integer> delete(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, @Validated @PathVariable ("userAccount") String userAccount){
        return R.success(sysUserService.delete(userAccount));
    }
}