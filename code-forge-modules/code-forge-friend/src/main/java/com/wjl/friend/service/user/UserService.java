package com.wjl.friend.service.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.wjl.constants.SecurityConstants;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.BCryptPwdUtil;
import com.wjl.domain.dto.LoginUserDTO;
import com.wjl.domain.dto.TokenDTO;
import com.wjl.exception.ServiceException;
import com.wjl.security.service.TokenService;
import com.wjl.friend.domain.user.dto.UserLoginDTO;
import com.wjl.friend.entity.user.User;
import com.wjl.friend.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    @Autowired
    private UserMapper userMapper;

    @Autowired
    private TokenService tokenService;

    public String login(UserLoginDTO dto){
        String email = dto.getEmail();
        String rawPassword = dto.getPassword();

        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email)
        );
        if(user == null){
            throw new ServiceException(ResultCode.FAILED_USER_NOT_EXISTS.getCode(),ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }
        String hashedPassword = user.getPassword();
        if(!BCryptPwdUtil.matches(rawPassword, hashedPassword)){
            throw new ServiceException(ResultCode.FAILED_LOGIN.getCode(),ResultCode.FAILED_LOGIN.getMsg());
        }

        // 用户身份合法，签发 token
        LoginUserDTO loginUserDTO = new LoginUserDTO();
        loginUserDTO.setEmail(email);
        loginUserDTO.setUserId(String.valueOf(user.getUserId()));
        loginUserDTO.setUsername(user.getNickName());
        loginUserDTO.setUserAccount(email);
        loginUserDTO.setUserType(SecurityConstants.CONSUMER);
        TokenDTO tokenDTO = tokenService.createCToken(loginUserDTO);
        return tokenDTO.getAccessToken();
    }

    public void logout(String token){
        tokenService.delLoginUser(token);
    }

}
