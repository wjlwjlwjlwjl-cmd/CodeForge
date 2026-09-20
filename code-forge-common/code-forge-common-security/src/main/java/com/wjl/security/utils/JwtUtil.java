package com.wjl.security.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

import java.util.Map;

import com.wjl.constants.SecurityConstants;
import com.wjl.constants.TokenConstants;

/**
 * Jwt工具类
 */
public class JwtUtil {

    /**
     * 令牌密钥
     */
    public static String secret = TokenConstants.SECRET;

    /**
     * 从原始数据声明生成令牌
     * @param claims 数据声明
     * @return 令牌
     */
    public static String createToken(Map<String, Object> claims) {
        return Jwts.builder().setClaims(claims).signWith(SignatureAlgorithm.HS512, secret).compact();
    }

    /**
     * 根据令牌获取数据声明
     * @param token 令牌
     * @return 数据声明
     */
    public static Claims parseToken(String token) {
        return Jwts.parser().setSigningKey(secret).parseClaimsJws(token).getBody();
    }

    /**
     * 根据令牌获取用户标识
     * @param token 令牌
     * @return 用户标识
     */
    public static String getUserId(String token) {
        Claims claims = parseToken(token);
        return getValue(claims, SecurityConstants.USER_ID);
    }

    /**
     * 根据数据声明获取用户标识
     * @param claims 数据声明
     * @return 用户标识
     */
    public static String getUserId(Claims claims) {
        return getValue(claims, SecurityConstants.USER_ID);
    }

    /**
     * 根据令牌获取用户名称
     * @param token 令牌
     * @return 用户标识
     */
    public static String getUserName(String token) {
        Claims claims = parseToken(token);
        return getValue(claims, SecurityConstants.USERNAME);
    }

    /**
     * 根据数据声明获取用户名称
     * @param claims 数据声明
     * @return 用户标识
     */
    public static String getUserName(Claims claims) {
        return getValue(claims, SecurityConstants.USERNAME);
    }

    /**
     * 根据令牌获取用户邮箱
     * @param token 令牌
     * @return 用户标识
     */
    public static String getEmail(String token) {
        Claims claims = parseToken(token);
        return getValue(claims, SecurityConstants.EMAIL);
    }

    /**
     * 根据数据声明获取用户邮箱
     * @param claims 数据声明
     * @return 用户标识
     */
    public static String getEmail(Claims claims) {
        return getValue(claims, SecurityConstants.EMAIL);
    }

    public static String getValue(Claims claims, String key) {
        Object value = claims.get(key);
        if (value == null) {
            return "";
        }
        return value.toString();
    }
}
