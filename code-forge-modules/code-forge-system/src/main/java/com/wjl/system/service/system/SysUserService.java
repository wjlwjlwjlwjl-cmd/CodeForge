package com.wjl.system.service.system;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.wjl.domain.dto.LoginUserDTO;
import com.wjl.domain.dto.TokenDTO;
import com.wjl.security.service.TokenService;
import com.wjl.system.domain.dto.SysLoginDTO;
import com.wjl.system.entity.system.SysUser;
import com.wjl.system.mapper.SysUserMapper;

import lombok.extern.slf4j.Slf4j;

@Service 
@Slf4j 
public class SysUserService {
    @Autowired 
    private SysUserMapper sysUserMapper;
    @Autowired
    private TokenService tokenService;

    // 登录
    public String login(SysLoginDTO loginDTO) {
        String username = loginDTO.getUsername();
        String password = loginDTO.getPassword();
        SysUser sysUser = sysUserMapper.selectOne(
            new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getNickName, username)
                .eq(SysUser::getPassword, password)
        );
        if(sysUser == null){
            return null;
        }

        LoginUserDTO loginUserDTO = new LoginUserDTO();
        loginUserDTO.setUserId(String.valueOf(sysUser.getUserId()));
        loginUserDTO.setEmail(null);
        loginUserDTO.setUsername(sysUser.getNickName());

        TokenDTO tokenDTO = tokenService.createToken(loginUserDTO);
        String token = tokenDTO.getAccessToken();
        log.info("{}登录成功, token: {}", username, token);

        return token;
    }

    //登出
    public void logout(String token){
        tokenService.delLoginUser(token);
    }
}
