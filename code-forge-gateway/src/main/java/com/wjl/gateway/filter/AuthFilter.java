package com.wjl.gateway.filter;

import com.wjl.constants.SecurityConstants;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.ColorLog;
import com.wjl.core.utils.ServletUtil;
import com.wjl.domain.dto.LoginUserDTO;
import com.wjl.gateway.config.WhiteListConfig;
import com.wjl.security.service.TokenService;
import com.wjl.security.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

import java.util.List;

@Order(-1)
@Component
public class AuthFilter implements GlobalFilter{
    @Autowired
    private TokenService tokenService;
    @Autowired
    private WhiteListConfig whiteListConfig;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        //在此对B、C端用户 jwt token 进行不同处理，如果请求路径中含有 "/b/" 字段，那么就是管理员操作，单独判断身份，否则就是普通操作

        //在白名单的直接放行
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().toString();
        List<String> whiteList = whiteListConfig.getWhites();
        if(whiteList.contains(path)){
            return chain.filter(exchange);
        }

        //获取 jwt
        String token =  request.getHeaders().getFirst("Authorization");
        if(token == null){
            return unauthorized(exchange);
        }

        //接下来，根据请求路径特点判断jwt鉴权方式
        if(path.contains("/b/")){
            //普通用户，不予授权
            if(!JwtUtil.getUserType(token).equals(SecurityConstants.ADMIN)){
                return unauthorized(exchange);
            }

            //声称是B端用户，那么进一步校验
            LoginUserDTO loginUserDTO = tokenService.getBLoginUser(token);
            if(loginUserDTO == null){
                return unauthorized(exchange);
            }

            if(!loginUserDTO.getUserAccount().equals(JwtUtil.getEmailOrAccount(token))
                    || !loginUserDTO.getUsername().equals(JwtUtil.getUserName(token))
                    || !loginUserDTO.getUserId().equals(JwtUtil.getUserId(token))
                    || !loginUserDTO.getUserType().equals(JwtUtil.getUserType(token))){
                return unauthorized(exchange);
            }

            tokenService.refreshBToken(loginUserDTO); //在一定时间内，如果用户再次操作，重置登录态过期时间
        }
        else{
            String userType = JwtUtil.getUserType(token);
            if(userType.equals(SecurityConstants.ADMIN)){
                LoginUserDTO loginUserDTO = tokenService.getBLoginUser(token);
                if(loginUserDTO == null){
                    return unauthorized(exchange);
                }
                if(!loginUserDTO.getUserAccount().equals(JwtUtil.getEmailOrAccount(token))
                        || !loginUserDTO.getUsername().equals(JwtUtil.getUserName(token))
                        || !loginUserDTO.getUserId().equals(JwtUtil.getUserId(token))
                        || !loginUserDTO.getUserType().equals(JwtUtil.getUserType(token))){
                    return unauthorized(exchange);
                }
            }
            else{
                LoginUserDTO loginUserDTO = tokenService.getCLoginUser(token);
                if(loginUserDTO == null){
                    return unauthorized(exchange);
                }
                if(!loginUserDTO.getUserAccount().equals(JwtUtil.getEmailOrAccount(token))
                        || !loginUserDTO.getUsername().equals(JwtUtil.getUserName(token))
                        || !loginUserDTO.getUserId().equals(JwtUtil.getUserId(token))
                        || !loginUserDTO.getUserType().equals(JwtUtil.getUserType(token))){
                    return unauthorized(exchange);
                }
            }
        }

        return  chain.filter(exchange);
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        return ServletUtil.webFluxResponseWriter(exchange.getResponse(), "application/json", HttpStatus.UNAUTHORIZED, ResultCode.FAILED_UNAUTHORIZED.getMsg(), ResultCode.FAILED_UNAUTHORIZED.getCode());
    }
}
