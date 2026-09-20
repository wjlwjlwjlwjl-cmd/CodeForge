package com.wjl.security.service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;

import com.wjl.constants.CacheConstants;
import com.wjl.constants.SecurityConstants;
import com.wjl.constants.TokenConstants;
import com.wjl.domain.dto.LoginUserDTO;
import com.wjl.domain.dto.TokenDTO;
import com.wjl.redis.service.RedisService;
import com.wjl.security.utils.JwtUtil;
import com.wjl.security.utils.SecurityUtil;

import jakarta.servlet.http.HttpServletRequest;

public class TokenService {
    /**
     * 毫秒
     */
    private final static long MILLIS_SECOND = 1000;

    /**
     * 分钟
     */
    private final static long MILLIS_MINUTE = 60 * MILLIS_SECOND;

    /**
     * 过期时间
     */
    private final static Long EXPIRE_TIME = CacheConstants.EXPIRATION;

    /**
     * token的KEY前缀
     */
    private final static String ACCESS_TOKEN = TokenConstants.LOGIN_TOKEN_KEY;

    /**
     * 120分钟
     */
    private final static Long MILLIS_MINUTE_TEN = CacheConstants.REFRESH_TIME * MILLIS_MINUTE;

    /**
     * 引用redis服务
     */
    @Autowired
    private RedisService redisService;

    /**
     * 创建token
     * @param loginUserDTO 登录信息
     * @return token信息
     */
    public TokenDTO createToken(LoginUserDTO loginUserDTO) {
        // 1 在 Redis 中进行缓存，key: ACCESS_TOKEN+user_id，并自动设置有效期
        refreshToken(loginUserDTO);
        // 2 生成原始数据声明
        Map<String, Object> claimsMap = new HashMap<>();
        claimsMap.put(SecurityConstants.USER_ID, loginUserDTO.getUserId());
        claimsMap.put(SecurityConstants.EMAIL, loginUserDTO.getEmail());
        claimsMap.put(SecurityConstants.USERNAME, loginUserDTO.getUsername());
        // 3 生成TokenDTO
        TokenDTO tokenDTO = new TokenDTO();
        tokenDTO.setAccessToken(JwtUtil.createToken(claimsMap));
        tokenDTO.setExpires(EXPIRE_TIME);
        return tokenDTO;
    }

    /**
     * 根据令牌获取用户信息
     * @param token 令牌
     * @return 用户信息
     */
    public LoginUserDTO getLoginUser(String token) {
        // 1 初始化用户信息
        LoginUserDTO user = null;
        // 2 解析令牌获取用户信息
        try {
            if (StringUtils.isNotEmpty(token)) {
                String userId = JwtUtil.getUserId(token);
                user = redisService.getCacheObject(getTokenKey(userId), LoginUserDTO.class);
                return user;
            }
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
        // 3 返回user
        return user;
    }

    /**
     * 根据请求来获取用户信息
     * @param request 请求
     * @return 用户信息
     */
    public LoginUserDTO getLoginUser(HttpServletRequest request) {
        String token = SecurityUtil.getToken(request);
        return getLoginUser(token);
    }

    /**
     * 根据令牌删除用户登录态
     * @param token 令牌
     */
    public void delLoginUser(String token) {
        if (StringUtils.isNotEmpty(token)) {
            String userId = JwtUtil.getUserId(token);
            redisService.deleteObject(getTokenKey(userId));
        }
    }

    /**
     * 验证令牌有效期   不到120分钟  自动刷新下
     * @param loginUserDTO 用户信息
     */
    public void verifyToken(LoginUserDTO loginUserDTO) {
        long expireTime = loginUserDTO.getExpireTime();
        long currentTime = System.currentTimeMillis();
        if (expireTime - currentTime <= MILLIS_MINUTE_TEN) {
            refreshToken(loginUserDTO);
        }
    }

    /**
     * 设置用户身份信息，允许登录
     * @param loginUserDTO 用户信息
     */
    public void setLoginUser(LoginUserDTO loginUserDTO) {
        if (loginUserDTO != null && StringUtils.isNotEmpty(loginUserDTO.getUserId())) {
            refreshToken(loginUserDTO);
        }
    }

    /**
     * 缓存用户信息设置令牌有效期
     * @param loginUserDTO 用户信息
     */
    public void refreshToken(LoginUserDTO loginUserDTO) {
        loginUserDTO.setLoginTime(System.currentTimeMillis());
        loginUserDTO.setExpireTime(loginUserDTO.getLoginTime() + EXPIRE_TIME * MILLIS_MINUTE);
        // 根据随机产生用户标识生成key
        String userId = getTokenKey(loginUserDTO.getUserId());
        // 生成loginUserDTO缓存
        redisService.setCacheObject(userId, loginUserDTO, EXPIRE_TIME, TimeUnit.MINUTES);
    }

    /**
     * 获取token key的信息
     * @param userId token
     * @return tokenKey
     */
    public String getTokenKey(String userId) {
        return ACCESS_TOKEN + userId;
    }
}
