package com.wjl.security.handler;

import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.ColorLog;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.wjl.core.domain.R;
import com.wjl.exception.ServiceException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.MethodNotAllowedException;
import org.springframework.web.server.ServerWebExchange;

@RestControllerAdvice
public class GlobalExceptionHandler {
    // 运行时异常
    @ExceptionHandler (RuntimeException.class)
    public R<?> handleRuntimeException(RuntimeException ex, ServerWebExchange exchange) {
        ColorLog.debug("RuntimeException: {}", ex.getMessage());
        exchange.getResponse().setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
        return R.error(ResultCode.ERROR.getCode(),  ResultCode.ERROR.getMsg());
    }

    // 处理服务异常
    @ExceptionHandler (ServiceException.class)
    public R<?> handleServiceException(ServiceException e, ServerWebExchange exchange) {
        ColorLog.debug("ServiceException: {}", e.getMessage());
        exchange.getResponse().setStatusCode(HttpStatus.BAD_REQUEST);
        return R.error(e.getErrCode(), e.getErrMsg());
    }

    // 请求方法不存在
    @ExceptionHandler (MethodNotAllowedException.class)
    public R<?> handleMethodNotAllowedException(MethodNotAllowedException e, ServerWebExchange exchange) {
        ColorLog.debug("MethodNotAllowedException: {}", e.getMessage());
        exchange.getResponse().setStatusCode(HttpStatus.METHOD_NOT_ALLOWED);
        return R.error(ResultCode.FAILED.getCode(), ResultCode.FAILED.getMsg());
    }

    // 请求参数不匹配
    @ExceptionHandler (MethodArgumentTypeMismatchException.class)
    public R<?> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException e, ServerWebExchange exchange) {
        ColorLog.debug("MethodArgumentTypeMismatchException: {}", e.getMessage());
        exchange.getResponse().setStatusCode(HttpStatus.BAD_REQUEST);
        return R.error(ResultCode.FAILED.getCode(), ResultCode.FAILED.getMsg());
    }

    //其他异常
    @ExceptionHandler(Exception.class)
    public R<?> handleException(Exception e, ServerWebExchange exchange) {
        ColorLog.debug("Exception: {}", e.getMessage());
        exchange.getResponse().setStatusCode(HttpStatus.BAD_REQUEST);
        return R.error(ResultCode.FAILED.getCode(), ResultCode.FAILED.getMsg());
    }
}
