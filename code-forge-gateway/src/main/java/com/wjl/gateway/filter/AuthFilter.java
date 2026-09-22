package com.wjl.gateway.filter;

import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.ColorLog;
import com.wjl.core.utils.ServletUtil;
import com.wjl.domain.dto.LoginUserDTO;
import com.wjl.gateway.config.WhiteListConfig;
import com.wjl.security.service.TokenService;
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
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().toString();
        List<String> whiteList = whiteListConfig.getWhites();
        ColorLog.debug(path);
        if(whiteList.contains(path)){
            return chain.filter(exchange); //在白名单的直接放行
        }

        String token =  request.getHeaders().getFirst("Authorization");
        if(token == null){
            return unauthorized(exchange);
        }
        LoginUserDTO loginUserDTO = tokenService.getLoginUser(token);
        if(loginUserDTO == null){
            return unauthorized(exchange);
        }

        //校验登录信息
        if(loginUserDTO.getUserAccount().isBlank() || loginUserDTO.getUsername().isBlank() || loginUserDTO.getUserId().isBlank()){
            return unauthorized(exchange);
        }

        return  chain.filter(exchange);
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        return ServletUtil.webFluxResponseWriter(exchange.getResponse(), "application/json", HttpStatus.UNAUTHORIZED, ResultCode.FAILED_UNAUTHORIZED.getMsg(), ResultCode.FAILED_UNAUTHORIZED.getCode());
    }
}
