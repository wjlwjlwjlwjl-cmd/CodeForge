package com.wjl.system.service.system;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.core.utils.ColorLog;
import com.wjl.domain.dto.LoginUserDTO;
import com.wjl.domain.dto.TokenDTO;
import com.wjl.exception.ServiceException;
import com.wjl.security.service.TokenService;
import com.wjl.system.domain.system.dto.AddAdminDTO;
import com.wjl.system.domain.system.dto.SysLoginDTO;
import com.wjl.system.domain.system.vo.AddAdminVO;
import com.wjl.system.domain.system.vo.ListSysUserVO;
import com.wjl.system.domain.system.vo.SysLoginVO;
import com.wjl.system.domain.system.vo.SysUserVO;
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
            //查无此用户
            throw new ServiceException(3102, ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }

        LoginUserDTO loginUserDTO = new LoginUserDTO();
        loginUserDTO.setUserId(String.valueOf(sysUser.getUserId()));
        loginUserDTO.setEmail(null);
        loginUserDTO.setUsername(sysUser.getNickName());
        loginUserDTO.setUserAccount(sysUser.getUserAccount());

        TokenDTO tokenDTO = tokenService.createToken(loginUserDTO);
        String token = tokenDTO.getAccessToken();
        sysLoginVO.setToken(token);

        return sysLoginVO;
    }

    //登出
    public void logout(String token){
        tokenService.delLoginUser(token);
    }

    //添加管理员用户
    public AddAdminVO addAdmin(String token, AddAdminDTO addAdminDTO){
        AddAdminVO addAdminVO = new AddAdminVO();

        LoginUserDTO loginUserDTO = tokenService.getLoginUser(token);
        Long userIdCreator = Long.valueOf(loginUserDTO.getUserId());

        String password = addAdminDTO.getPassword();
        String nickname = addAdminDTO.getNickname();
        SysUser sysUser = sysUserMapper.selectOne(
            new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getNickName, nickname)
        );
        if(sysUser != null){
            throw new ServiceException(3101, ResultCode.FAILED_USER_EXISTS.getMsg());
        }

        // 前缀标识用户类型，后缀取雪花 ID 后 8 位保证唯一
        String userAccount = "U" + IdWorker.getIdStr().substring(11);
        long userId = IdWorker.getId(); // 时间戳 + 机器 ID + 序列号
        sysUser = new SysUser();
        sysUser.setUserId(userId);
        sysUser.setNickName(nickname);
        sysUser.setPassword(password);
        sysUser.setUserAccount(userAccount);
        sysUser.setCreateTime(LocalDateTime.now());
        sysUser.setCreateBy(userIdCreator);
        sysUser.setUpdateBy(userIdCreator);
        sysUser.setUpdateTime(LocalDateTime.now());
        try{
            sysUserMapper.insert(sysUser);
        }
        catch(Exception e){
            ColorLog.error("添加管理员用户失败: {}", e.getMessage());
            throw new ServiceException(2000, ResultCode.ERROR.getMsg());
        }

        addAdminVO.setUserAccount(userAccount);
        return addAdminVO;
    }

    public SysUserVO info(String token){
        SysUserVO sysUserVO = new SysUserVO();
        LoginUserDTO loginUserDTO = tokenService.getLoginUser(token);
        String userAccount = loginUserDTO.getUserAccount();

        SysUser sysUser = sysUserMapper.selectOne(
            new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUserAccount, userAccount)
        );
        if(sysUser == null){
            throw new ServiceException(3102, ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }
        BeanCopyUtil.copyProperties(sysUser, sysUserVO);

        return sysUserVO;
    }

    public ListSysUserVO list(String token){
        ListSysUserVO listSysUserVO = new ListSysUserVO();

        List<SysUser> sysUserList = sysUserMapper.selectList(
            new LambdaQueryWrapper<SysUser>()
        );
        List<SysUserVO> users = BeanCopyUtil.copyListProperties(sysUserList, SysUserVO::new);
        listSysUserVO.setList(users);

        return listSysUserVO;
    }

    public int delete(String token, String userAccount){
        if(userAccount.equals("admin")){
            throw new ServiceException(3106, ResultCode.FAILED_ADMIN.getMsg()); 
        }
        int cnt = sysUserMapper.delete(
            new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUserAccount, userAccount)
                .ne(SysUser::getId, 1L)
        );
        if(cnt == 0){
            throw new ServiceException(3102, ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }
        else{
            return 1;
        }
    }
}
