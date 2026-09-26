package com.wjl.system.service.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.wjl.constants.CacheConstants;
import com.wjl.core.utils.BCryptPwdUtil;
import com.wjl.core.utils.EmailValidateUtil;
import com.wjl.domain.dto.LoginUserDTO;
import com.wjl.domain.dto.TokenDTO;
import com.wjl.redis.service.RedisService;
import com.wjl.security.service.TokenService;
import com.wjl.service.EmailService;
import com.wjl.core.enums.ResultCode;
import com.wjl.exception.ServiceException;
import com.wjl.system.domain.user.dto.c.UserLoginDTO;
import com.wjl.system.domain.user.dto.c.UserRegisterDTO;
import com.wjl.system.entity.user.CUser;
import com.wjl.system.mapper.CUserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class CUserService {
    @Autowired
    private EmailService emailService;

    @Autowired
    private CUserMapper cUserMapper;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private RedisService redisService;

    public Boolean sendCode(String email){
        if(!emailService.sendVerifyCode(email)){
            throw new ServiceException(ResultCode.FAILED_SEND_CODE.getCode(),ResultCode.FAILED_SEND_CODE.getMsg());
        }
        return true;
    }

    public Boolean register(UserRegisterDTO dto){
        String nickName = dto.getNickName();
        Integer sex = dto.getSex();
        String email = dto.getEmail();
        String code = dto.getCode();
        String schoolName = dto.getSchoolName();
        String majorName = dto.getMajorName();
        String rawPassword = dto.getPassword();

        if(!EmailValidateUtil.isValidEmail(email)){
            throw new ServiceException(ResultCode.FAILED_USER_EMAIL.getCode(),ResultCode.FAILED_USER_EMAIL.getMsg());
        }
        if(!redisService.hasKey(CacheConstants.VERIFY_PREFIX + email)){ //key 为前缀 + 邮箱
            throw new ServiceException(ResultCode.FAILED_INVALID_CODE.getCode(),ResultCode.FAILED_INVALID_CODE.getMsg());
        }
        String trueCode = redisService.getCacheObject(CacheConstants.VERIFY_PREFIX + email, String.class);
        if(!trueCode.equals(code)){
            throw new ServiceException(ResultCode.FAILED_ERROR_CODE.getCode(),ResultCode.FAILED_ERROR_CODE.getMsg());
        }
        String hashedPassword = BCryptPwdUtil.encode(rawPassword);

        CUser cUser = new CUser();
        cUser.setNickName(nickName);
        cUser.setSchoolName(schoolName);
        cUser.setMajorName(majorName);
        cUser.setEmail(email);
        cUser.setPassword(hashedPassword);
        cUser.setSex(sex);
        cUser.setCreateTime(LocalDateTime.now());
        try{
            cUserMapper.insert(cUser);
        }
        catch(DuplicateKeyException e){
            throw new ServiceException(ResultCode.FAILED_USER_EXISTS.getCode(),ResultCode.FAILED_USER_EXISTS.getMsg());
        }
        return true;
    }

    public String login(UserLoginDTO dto){
        String email = dto.getEmail();
        String rawPassword = dto.getPassword();

        CUser cUser = cUserMapper.selectOne(new LambdaQueryWrapper<CUser>()
                .eq(CUser::getEmail, email)
        );
        if(cUser == null){
            throw new ServiceException(ResultCode.FAILED_USER_NOT_EXISTS.getCode(),ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }
        String hashedPassword = cUser.getPassword();
        if(!BCryptPwdUtil.matches(rawPassword, hashedPassword)){
            throw new ServiceException(ResultCode.FAILED_LOGIN.getCode(),ResultCode.FAILED_LOGIN.getMsg());
        }

        // 用户身份合法，记录登录态
        LoginUserDTO loginUserDTO = new LoginUserDTO();
        loginUserDTO.setEmail(email);
        loginUserDTO.setUserId(String.valueOf(cUser.getUserId()));
        loginUserDTO.setUsername(cUser.getNickName());
        TokenDTO tokenDTO = tokenService.createToken(loginUserDTO);
        return tokenDTO.getAccessToken();
    }
}
