package com.wjl.system.service.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.github.pagehelper.PageHelper;
import com.wjl.constants.CacheConstants;
import com.wjl.constants.SecurityConstants;
import com.wjl.core.utils.BCryptPwdUtil;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.core.utils.EmailValidateUtil;
import com.wjl.domain.dto.LoginUserDTO;
import com.wjl.domain.dto.TokenDTO;
import com.wjl.redis.service.RedisService;
import com.wjl.security.service.TokenService;
import com.wjl.service.EmailService;
import com.wjl.core.enums.ResultCode;
import com.wjl.exception.ServiceException;
import com.wjl.system.domain.user.dto.b.UserDTO;
import com.wjl.system.domain.user.dto.b.UserQueryDTO;
import com.wjl.system.domain.user.dto.c.UserAddInfoDTO;
import com.wjl.system.domain.user.dto.c.UserLoginDTO;
import com.wjl.system.domain.user.dto.c.UserRegisterDTO;
import com.wjl.system.domain.user.vo.b.UserListVO;
import com.wjl.system.domain.user.vo.b.UserVO;
import com.wjl.system.domain.user.vo.c.UserDetailVO;
import com.wjl.system.entity.user.CUser;
import com.wjl.system.mapper.CUserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {
    @Autowired
    private EmailService emailService;

    @Autowired
    private CUserMapper cUserMapper;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private RedisService redisService;

    public UserListVO list(UserQueryDTO userQueryDTO) {
        UserListVO userListVO = new UserListVO();

        int pageNum = userQueryDTO.getPageNum();
        int pageSize = userQueryDTO.getPageSize();
        PageHelper.startPage(pageNum, pageSize);

        List<CUser> cUsers = cUserMapper.selectUserList(userQueryDTO);
        List<UserVO> list = BeanCopyUtil.copyListProperties(cUsers, UserVO::new);
        userListVO.setList(list);

        return userListVO;
    }

    public String updateStatus(UserDTO userDTO) {
        Long userId = userDTO.getUserId();
        Integer status = userDTO.getStatus();
        int cnt = cUserMapper.update(new LambdaUpdateWrapper<CUser>()
                .eq(CUser::getUserId, userId)
                .set(CUser::getStatus, status)
        );
        if(cnt < 0){
            throw new ServiceException(ResultCode.FAILED_USER_NOT_EXISTS.getCode(), ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }
        return String.format("成功更新%d状态", userId);
    }

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

        // 用户身份合法，签发 token
        LoginUserDTO loginUserDTO = new LoginUserDTO();
        loginUserDTO.setEmail(email);
        loginUserDTO.setUserId(String.valueOf(cUser.getUserId()));
        loginUserDTO.setUsername(cUser.getNickName());
        loginUserDTO.setUserAccount(email);
        loginUserDTO.setUserType(SecurityConstants.CONSUMER);
        TokenDTO tokenDTO = tokenService.createCToken(loginUserDTO);
        return tokenDTO.getAccessToken();
    }

    public String addUserInfo(String token, UserAddInfoDTO dto){
        String schoolName = dto.getSchoolName();
        String majorName = dto.getMajorName();
        String introduce = dto.getIntroduce();
        String userId = tokenService.getCLoginUser(token).getUserId();
        int cnt = cUserMapper.update(new LambdaUpdateWrapper<CUser>()
                .eq(CUser::getUserId, userId)
                .set(CUser::getSchoolName, schoolName)
                .set(CUser::getMajorName, majorName)
                .set(CUser::getIntroduce, introduce)
                .set(CUser::getUpdateBy, userId)
                .set(CUser::getUpdateTime, LocalDateTime.now())
        );
        if(cnt != 1){
            throw new ServiceException(ResultCode.FAILED_USER_NOT_EXISTS.getCode(), ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }
        return "用户信息更新成功";
    }

    public UserDetailVO detail(String token){
        UserDetailVO userDetailVO = new UserDetailVO();
        String userId = tokenService.getCLoginUser(token).getUserId();
        CUser cUser = cUserMapper.selectOne(new LambdaQueryWrapper<CUser>()
                .eq(CUser::getUserId, userId)
        );
        BeanCopyUtil.copyProperties(cUser, userDetailVO);
        return userDetailVO;
    }
}
