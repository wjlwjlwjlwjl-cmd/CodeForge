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
     * B端 token 的KEY前缀
     */
    private final static String B_ACCESS_TOKEN = TokenConstants.B_LOGIN_TOKEN_KEY;

    /**
     * C端 token 的KEY前缀
     */
    private final static String C_ACCESS_TOKEN = TokenConstants.C_LOGIN_TOKEN_KEY;

    /**
     * 120分钟
     */
    private final static Long MILLIS_MINUTE_TEN = CacheConstants.REFRESH_TIME * MILLIS_MINUTE;

    /**
     * 引用redis服务
     */
    @Autowired
    private RedisService redisService;

    //B端用户、C端用户区分思路：分开登录接口，签发不同的 JWT Token，不同权限的接口进行不同的核验，在网关中，对需要管理员权限的接口进行拦截筛选，查看用户身份

    /**
     * 创建B端用户token
     * @param loginUserDTO 登录信息
     * @return token信息
     */
    public TokenDTO createBToken(LoginUserDTO loginUserDTO) {
        // 1 在 Redis 中进行缓存，key: ACCESS_TOKEN+user_id，并自动设置有效期
        refreshBToken(loginUserDTO);
        // 2 生成原始数据声明
        Map<String, Object> claimsMap = new HashMap<>();
        claimsMap.put(SecurityConstants.USER_ID, loginUserDTO.getUserId());
        claimsMap.put(SecurityConstants.USERTYPE, loginUserDTO.getUserType());
        claimsMap.put(SecurityConstants.EMAIL, loginUserDTO.getEmail());
        claimsMap.put(SecurityConstants.USERNAME, loginUserDTO.getUsername());
        claimsMap.put(SecurityConstants.USER_ACCOUNT, loginUserDTO.getUserAccount());
        // 3 生成TokenDTO
        TokenDTO tokenDTO = new TokenDTO();
        tokenDTO.setAccessToken(JwtUtil.createToken(claimsMap));
        tokenDTO.setExpires(EXPIRE_TIME);
        return tokenDTO;
    }

    /**
     * 创建C端用户token
     * @param loginUserDTO C端登录信息
     * @return jwt token
     */
    public TokenDTO createCToken(LoginUserDTO loginUserDTO) {
        refreshCToken(loginUserDTO);
        Map<String, Object> claimsMap = new HashMap<>();
        claimsMap.put(SecurityConstants.USER_ID, loginUserDTO.getUserId());
        claimsMap.put(SecurityConstants.EMAIL, loginUserDTO.getEmail());
        claimsMap.put(SecurityConstants.USERNAME, loginUserDTO.getUsername());
        claimsMap.put(SecurityConstants.USERTYPE, loginUserDTO.getUserType());
        claimsMap.put(SecurityConstants.USER_ACCOUNT, loginUserDTO.getEmail()); //为了保证一致性，对于C端用户采取将邮箱作为账号
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
    public LoginUserDTO getBLoginUser(String token) {
        // 1 初始化用户信息
        LoginUserDTO user = null;
        // 2 解析令牌获取用户信息
        try {
            if (StringUtils.isNotEmpty(token)) {
                String userId = JwtUtil.getUserId(token);
                user = redisService.getCacheObject(getBTokenKey(userId), LoginUserDTO.class);
                return user;
            }
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
        // 3 返回user
        return user;
    }

    public LoginUserDTO getCLoginUser(String token) {
        // 1 初始化用户信息
        LoginUserDTO user = null;
        // 2 解析令牌获取用户信息
        try {
            if (StringUtils.isNotEmpty(token)) {
                String userId = JwtUtil.getUserId(token);
                user = redisService.getCacheObject(getCTokenKey(userId), LoginUserDTO.class);
                return user;
            }
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
        // 3 返回user
        return user;
    }

    /**
     * 根据令牌删除用户登录态
     * @param token 令牌
     */
    public void delLoginUser(String token) {
        if (StringUtils.isNotEmpty(token)) {
            String userId = JwtUtil.getUserId(token);
            redisService.deleteObject(getBTokenKey(userId));
        }
    }

    /**
     * 设置用户身份信息，允许登录
     * @param loginUserDTO 用户信息
     */
    public void setBLoginUser(LoginUserDTO loginUserDTO) {
        if (loginUserDTO != null && StringUtils.isNotEmpty(loginUserDTO.getUserId())) {
            refreshBToken(loginUserDTO);
        }
    }

    public void setCLoginUser(LoginUserDTO loginUserDTO) {
        if (loginUserDTO != null && StringUtils.isNotEmpty(loginUserDTO.getUserId())) {
            refreshCToken(loginUserDTO);
        }
    }

    /**
     * 缓存用户信息设置令牌有效期
     * @param loginUserDTO 用户信息
     */
    public void refreshBToken(LoginUserDTO loginUserDTO) {
        loginUserDTO.setLoginTime(System.currentTimeMillis());
        loginUserDTO.setExpireTime(loginUserDTO.getLoginTime() + EXPIRE_TIME * MILLIS_MINUTE);
        // 根据随机产生用户标识生成key
        String userId = getBTokenKey(loginUserDTO.getUserId());
        // 生成loginUserDTO缓存
        redisService.setCacheObject(userId, loginUserDTO, EXPIRE_TIME, TimeUnit.MINUTES);
    }

    public void refreshCToken(LoginUserDTO loginUserDTO) {
        loginUserDTO.setLoginTime(System.currentTimeMillis());
        loginUserDTO.setExpireTime(loginUserDTO.getLoginTime() + EXPIRE_TIME * MILLIS_MINUTE);
        // 根据随机产生用户标识生成key
        String userId = getCTokenKey(loginUserDTO.getUserId());
        // 生成loginUserDTO缓存
        redisService.setCacheObject(userId, loginUserDTO, EXPIRE_TIME, TimeUnit.MINUTES);
    }

    /**
     * 获取token key的信息
     * @param userId token
     * @return tokenKey
     */
    public String getBTokenKey(String userId) {
        return B_ACCESS_TOKEN + userId;
    }

    public String getCTokenKey(String userId) {
        return C_ACCESS_TOKEN + userId;
    }
}
