package com.wjl.gateway.handler;

import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.ColorLog;
import com.wjl.core.utils.ServletUtil;
import com.wjl.exception.ServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.awt.*;

@Slf4j
@Component
public class GatewayExceptionHandler implements ErrorWebExceptionHandler {
    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();
        if(response.isCommitted()) {
            return Mono.error(ex);
        }
        ColorLog.warn(ex.getMessage());

        String errMsg = ResultCode.ERROR.getMsg();
        Integer code = ResultCode.ERROR.getCode();

        if(ex instanceof ServiceException){
            //服务抛出来的服务异常
            errMsg = ((ServiceException)ex).getErrMsg();
            code = ((ServiceException)ex).getErrCode();
            ColorLog.warn(errMsg);
        }

        return ServletUtil.webFluxResponseWriter(response, HttpStatus.BAD_REQUEST, errMsg, code);
    }
}
