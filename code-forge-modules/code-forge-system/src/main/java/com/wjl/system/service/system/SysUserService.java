package com.wjl.system.service.system;

import java.time.LocalDateTime;
import java.util.List;

import com.wjl.constants.SecurityConstants;
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
import com.wjl.system.entity.system.BUser;
import com.wjl.system.mapper.BUserMapper;

import lombok.extern.slf4j.Slf4j;

@Service 
@Slf4j 
public class SysUserService {
    @Autowired 
    private BUserMapper bUserMapper;
    @Autowired
    private TokenService tokenService;

    // 登录
    public SysLoginVO login(SysLoginDTO loginDTO) {
        SysLoginVO sysLoginVO = new SysLoginVO();
        String userAccount = loginDTO.getUserAccount();
        String password = loginDTO.getPassword();

        BUser bUser = bUserMapper.selectOne(
            new LambdaQueryWrapper<BUser>()
                .eq(BUser::getUserAccount, userAccount)
                .eq(BUser::getPassword, password)
        );
        if(bUser == null){
            //查无此用户
            throw new ServiceException(3102, ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }

        //签发 Admin jwt token
        LoginUserDTO loginUserDTO = new LoginUserDTO();
        loginUserDTO.setUserId(String.valueOf(bUser.getUserId()));
        loginUserDTO.setEmail(null);
        loginUserDTO.setUsername(bUser.getNickName());
        loginUserDTO.setUserAccount(bUser.getUserAccount());
        loginUserDTO.setUserType(SecurityConstants.ADMIN);

        TokenDTO tokenDTO = tokenService.createBToken(loginUserDTO);
        String token = tokenDTO.getAccessToken();
        sysLoginVO.setToken(token);

        return sysLoginVO;
    }

    //登出
    public void logout(String token){
        tokenService.delBLoginUser(token);
    }

    //添加管理员用户
    public AddAdminVO addAdmin(String token, AddAdminDTO addAdminDTO){
        AddAdminVO addAdminVO = new AddAdminVO();

        LoginUserDTO loginUserDTO = tokenService.getCLoginUser(token);
        Long userIdCreator = Long.valueOf(loginUserDTO.getUserId());

        String password = addAdminDTO.getPassword();
        String nickname = addAdminDTO.getNickname();
        BUser bUser = bUserMapper.selectOne(
            new LambdaQueryWrapper<BUser>()
                .eq(BUser::getNickName, nickname)
        );
        if(bUser != null){
            throw new ServiceException(3101, ResultCode.FAILED_USER_EXISTS.getMsg());
        }

        // 前缀标识用户类型，后缀取雪花 ID 后 8 位保证唯一
        String userAccount = "U" + IdWorker.getIdStr().substring(11);
        long userId = IdWorker.getId(); // 时间戳 + 机器 ID + 序列号
        bUser = new BUser();
        bUser.setUserId(userId);
        bUser.setNickName(nickname);
        bUser.setPassword(password);
        bUser.setUserAccount(userAccount);
        bUser.setCreateTime(LocalDateTime.now());
        bUser.setCreateBy(userIdCreator);
        bUser.setUpdateBy(userIdCreator);
        bUser.setUpdateTime(LocalDateTime.now());
        try{
            bUserMapper.insert(bUser);
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
        LoginUserDTO loginUserDTO = tokenService.getBLoginUser(token);
        String userAccount = loginUserDTO.getUserAccount();

        BUser bUser = bUserMapper.selectOne(
            new LambdaQueryWrapper<BUser>()
                .eq(BUser::getUserAccount, userAccount)
        );
        if(bUser == null){
            throw new ServiceException(3102, ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }
        BeanCopyUtil.copyProperties(bUser, sysUserVO);

        return sysUserVO;
    }

    public ListSysUserVO list(){
        ListSysUserVO listSysUserVO = new ListSysUserVO();

        List<BUser> bUserList = bUserMapper.selectList(
            new LambdaQueryWrapper<BUser>()
        );
        List<SysUserVO> users = BeanCopyUtil.copyListProperties(bUserList, SysUserVO::new);
        listSysUserVO.setList(users);

        return listSysUserVO;
    }

    public int delete(String userAccount){
        if(userAccount.equals("admin")){
            throw new ServiceException(3106, ResultCode.FAILED_ADMIN.getMsg()); 
        }
        int cnt = bUserMapper.delete(
            new LambdaQueryWrapper<BUser>()
                .eq(BUser::getUserAccount, userAccount)
                .ne(BUser::getId, 1L)
        );
        if(cnt == 0){
            throw new ServiceException(3102, ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }
        else{
            return 1;
        }
    }
}
