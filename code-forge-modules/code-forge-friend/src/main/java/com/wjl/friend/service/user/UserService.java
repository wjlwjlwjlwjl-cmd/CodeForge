package com.wjl.friend.service.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.wjl.constants.CacheConstants;
import com.wjl.constants.CommonConstants;
import com.wjl.constants.SecurityConstants;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.BCryptPwdUtil;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.core.utils.ColorLog;
import com.wjl.core.utils.EmailValidateUtil;
import com.wjl.domain.dto.LoginUserDTO;
import com.wjl.domain.dto.TokenDTO;
import com.wjl.domain.vo.AvatarUploadVO;
import com.wjl.exception.ServiceException;
import com.wjl.file.util.FileUtil;
import com.wjl.friend.constants.AvatarErrMsg;
import com.wjl.friend.domain.user.dto.UserAddInfoDTO;
import com.wjl.friend.domain.user.dto.UserRegisterDTO;
import com.wjl.friend.domain.user.vo.UserDetailVO;
import com.wjl.redis.service.RedisService;
import com.wjl.redis.util.CacheUtil;
import com.wjl.security.service.TokenService;
import com.wjl.friend.domain.user.dto.UserLoginDTO;
import com.wjl.friend.entity.user.User;
import com.wjl.friend.mapper.user.UserMapper;
import com.wjl.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
public class UserService {
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private TokenService tokenService;
    @Autowired
    private RedisService redisService;
    @Autowired
    private EmailService emailService;
    @Autowired
    private FileUtil fileUtil;

    public Boolean sendCode(String email){
        if(!emailService.sendVerifyCode(email)){
            throw new ServiceException(ResultCode.FAILED_SEND_CODE.getCode(),ResultCode.FAILED_SEND_CODE.getMsg());
        }
        return true;
    }

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

        User user = new User();
        user.setNickName(nickName);
        user.setSchoolName(schoolName);
        user.setMajorName(majorName);
        user.setEmail(email);
        user.setPassword(hashedPassword);
        user.setSex(sex);
        user.setCreateTime(LocalDateTime.now());
        try{
            userMapper.insert(user);
        }
        catch(DuplicateKeyException e){
            throw new ServiceException(ResultCode.FAILED_USER_EXISTS.getCode(),ResultCode.FAILED_USER_EXISTS.getMsg());
        }
        return true;
    }

    public String addUserInfo(String token, UserAddInfoDTO dto){
        String schoolName = dto.getSchoolName();
        String majorName = dto.getMajorName();
        String introduce = dto.getIntroduce();
        LoginUserDTO loginUserDTO = tokenService.getCLoginUser(token);
        if(loginUserDTO == null){
            return "管理员用户不得修改用户个人信息";
        }
        String userId = loginUserDTO.getUserId();
        int cnt = userMapper.update(new LambdaUpdateWrapper<User>()
                .eq(User::getUserId, userId)
                .set(User::getSchoolName, schoolName)
                .set(User::getMajorName, majorName)
                .set(User::getIntroduce, introduce)
                .set(User::getUpdateBy, userId)
                .set(User::getUpdateTime, LocalDateTime.now())
        );
        if(cnt != 1){
            throw new ServiceException(ResultCode.FAILED_USER_NOT_EXISTS.getCode(), ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }
        redisService.deleteObject(CacheUtil.getUserInfoCKey(userId));
        return "用户信息更新成功";
    }

    public UserDetailVO detail(String token){
        UserDetailVO userDetailVO = new UserDetailVO();
        String userId = tokenService.getCLoginUser(token).getUserId();
        User user = null;

        String cacheKey = CacheUtil.getUserInfoCKey(userId);
        if(redisService.hasKey(cacheKey)){
            user = redisService.getCacheObject(cacheKey, User.class);
        }
        if(user == null){
            user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                    .eq(User::getUserId, userId)
            );
            redisService.setCacheObject(cacheKey, user, CacheConstants.USER_INFO_C_EXPIRATION, TimeUnit.MINUTES);
        }
        if(user == null) throw new ServiceException(ResultCode.FAILED_USER_NOT_EXISTS.getCode(), ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        BeanCopyUtil.copyProperties(user, userDetailVO);
        return userDetailVO;
    }

    public String getAvatarUrl(String token){
        LoginUserDTO loginUserDTO = tokenService.getCLoginUser(token);
        if(loginUserDTO == null) return null;
        String userId = loginUserDTO.getUserId();

        //先尝试从redis获取avatarName，没有到mysql获取并更新缓存
        User user = null;
        String cacheKey = CacheUtil.getUserInfoCKey(userId);
        if(redisService.hasKey(cacheKey)){
            user = redisService.getCacheObject(cacheKey, User.class);
        }
        if(user == null){
            user = userMapper.selectById(userId);
            redisService.setCacheObject(cacheKey, user, CacheConstants.USER_INFO_C_EXPIRATION, TimeUnit.MINUTES);
        }
        if(user == null)
            throw new ServiceException(ResultCode.FAILED_USER_NOT_EXISTS.getCode(), ResultCode.FAILED_USER_NOT_EXISTS.getMsg());

        String avatarName = user.getAvatarName();
        if(avatarName == null || avatarName.isEmpty()){
            return null;
        }
        return fileUtil.getPresignedUrl(avatarName);
    }

    public AvatarUploadVO avatarUpload(String token, MultipartFile avatar){
        AvatarUploadVO avatarUploadVO = new AvatarUploadVO();

        LoginUserDTO loginUserDTO = tokenService.getCLoginUser(token);
        if(loginUserDTO == null){
            throw new ServiceException(ResultCode.FAILED_USER_NOT_EXISTS.getCode(), ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }
        String userId = loginUserDTO.getUserId();

        if(avatar == null || avatar.isEmpty()){
            return AvatarUploadVO.getErrVO(AvatarErrMsg.AVATAR_EMPTY);
        }
        if(avatar.getSize() > CommonConstants.MAX_SIZE) {
            return AvatarUploadVO.getErrVO(AvatarErrMsg.AVATAR_TOO_BIG);
        }
        String contentType = avatar.getContentType();
        boolean isOk = false;
        for(String m: CommonConstants.ALLOW_MIME){
            if (m.equals(contentType)) {
                isOk = true;
                break;
            }
        }
        if(!isOk){
            return AvatarUploadVO.getErrVO(AvatarErrMsg.AVATAR_TYPE_ERR);
        }

        try{
            java.awt.image.BufferedImage image = javax.imageio.ImageIO.read(avatar.getInputStream());
            if (image == null) {
                throw new RuntimeException("不是有效图片");
            }
            int w = image.getWidth();
            int h = image.getHeight();
            // 限制尺寸 200~2000
            if (w < 200 || h < 200 || w > 2000 || h > 2000) {
                throw new RuntimeException("图片尺寸需在200×200 ~ 2000×2000");
            }
        }
        catch(IOException e){
            ColorLog.error("getInputStream fail: {}", e.getMessage());
        }

        String cacheKey = CacheUtil.getUserInfoCKey(userId);
        String avatarName = avatar.getName();
        if(redisService.hasKey(cacheKey)){
            User user = redisService.getCacheObject(cacheKey, User.class);
            avatarName = user.getAvatarName();
        }
        else{
            User user = userMapper.selectById(userId);
            avatarName = user.getAvatarName();
        }

        //头像文件校验完成，上传 oss
        if(avatarName == null || avatarName.isEmpty() || !fileUtil.exists(avatarName)){
            //用户未上传过头像，upload
            avatarName = fileUtil.uploadFile(avatar);
            ColorLog.info("userId: {}, avatarName: {}", userId, avatarName);
            int cnt = userMapper.update(new LambdaUpdateWrapper<User>()
                    .eq(User::getUserId, userId)
                    .set(User::getAvatarName, avatarName)
            );
            if(cnt != 1) throw new ServiceException(ResultCode.FAILED_USER_NOT_EXISTS.getCode(), ResultCode.FAILED_USER_NOT_EXISTS.getMsg());
        }
        else{
            //用户上传过头像，update
            fileUtil.updateFile(avatarName, avatar);
        }

        avatarUploadVO.setSuccess(true);

        return avatarUploadVO;
    }
}
