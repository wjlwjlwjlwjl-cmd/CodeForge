package com.wjl.system.service.system;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.domain.dto.LoginUserDTO;
import com.wjl.domain.dto.TokenDTO;
import com.wjl.security.service.TokenService;
import com.wjl.system.domain.dto.AddAdminDTO;
import com.wjl.system.domain.dto.SysLoginDTO;
import com.wjl.system.domain.vo.AddAdminVO;
import com.wjl.system.domain.vo.ListSysUserVO;
import com.wjl.system.domain.vo.SysLoginVO;
import com.wjl.system.domain.vo.SysUserVO;
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
    public SysLoginVO login(SysLoginDTO loginDTO) {
        SysLoginVO sysLoginVO = new SysLoginVO();
        String userAccount = loginDTO.getUserAccount();
        String password = loginDTO.getPassword();
        SysUser sysUser = sysUserMapper.selectOne(
            new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUserAccount, userAccount)
                .eq(SysUser::getPassword, password)
        );
        if(sysUser == null){
            sysLoginVO.setErrCode(3103);
            return sysLoginVO;
        }

        LoginUserDTO loginUserDTO = new LoginUserDTO();
        loginUserDTO.setUserId(String.valueOf(sysUser.getUserId()));
        loginUserDTO.setEmail(null);
        loginUserDTO.setUsername(sysUser.getNickName());
        loginUserDTO.setUserAccount(sysUser.getUserAccount());

        TokenDTO tokenDTO = tokenService.createToken(loginUserDTO);
        String token = tokenDTO.getAccessToken();
        log.info("{}登录成功, token: {}", userAccount, token);
        sysLoginVO.setErrCode(1000);
        sysLoginVO.setToken(token);

        return sysLoginVO;
    }

    //登出
    public void logout(String token){
        tokenService.delLoginUser(token);
    }

    //添加管理员用户
    public AddAdminVO addAdmin(AddAdminDTO addAdminDTO){
        AddAdminVO addAdminVO = new AddAdminVO();
        String password = addAdminDTO.getPassword();
        String nickname = addAdminDTO.getNickname();
        SysUser sysUser = sysUserMapper.selectOne(
            new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getNickName, nickname)
        );
        if(sysUser != null){
            addAdminVO.setErrCode(3101);
            return addAdminVO;
        }

        String userAccount = UUID.randomUUID().toString().substring(0, 11);
        sysUser = new SysUser();
        sysUser.setNickName(nickname);
        sysUser.setPassword(password);
        sysUser.setUserAccount(userAccount);
        sysUser.setCreateTime(LocalDateTime.now());
        sysUser.setCreateBy(1L);
        sysUser.setUpdateBy(1L);
        sysUser.setUpdateTime(LocalDateTime.now());
        try{
            sysUserMapper.insert(sysUser);
        }
        catch(Exception e){
            addAdminVO.setErrCode(3000);
            return addAdminVO;
        }

        addAdminVO.setUserAccount(userAccount);
        addAdminVO.setErrCode(1000);
        return addAdminVO;
    }

    public SysUserVO info(String token){
        SysUserVO sysUserVO = new SysUserVO();
        LoginUserDTO loginUserDTO = tokenService.getLoginUser(token);
        if(loginUserDTO == null){
            sysUserVO.setErrCode(3001);
            return sysUserVO;
        }
        String userAccount = loginUserDTO.getUserAccount();

        SysUser sysUser = sysUserMapper.selectOne(
            new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUserAccount, userAccount)
        );
        if(sysUser == null){
            sysUserVO.setErrCode(3102);
            return sysUserVO;
        }
        BeanCopyUtil.copyProperties(sysUser, sysUserVO);
        sysUserVO.setErrCode(1000);

        return sysUserVO;
    }

    public ListSysUserVO list(String token){
        ListSysUserVO listSysUserVO = new ListSysUserVO();

        LoginUserDTO loginUserDTO = tokenService.getLoginUser(token);
        if(loginUserDTO == null){
            listSysUserVO.setErrCode(3001);
            return listSysUserVO;
        }

        List<SysUser> sysUserList = sysUserMapper.selectList(
            new LambdaQueryWrapper<SysUser>()
        );
        List<SysUserVO> users = new ArrayList<>();
        BeanCopyUtil.copyListProperties(sysUserList, SysUserVO::new);
        listSysUserVO.setList(users);

        return listSysUserVO;
    }

    public int delete(String token, String userAccount){
        LoginUserDTO loginUserDTO = tokenService.getLoginUser(token);
        if(loginUserDTO == null){
            return 3001;
        }

        int cnt = sysUserMapper.delete(
            new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUserAccount, userAccount)
        );
        if(cnt == 0){
            return 3102;
        }
        else{
            return 1000;
        }
    }
}
