package com.wjl.system.handler;

import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.wjl.core.domain.R;
import com.wjl.core.enums.ResultCode;
import com.wjl.exception.ServiceException;

@RestControllerAdvice 
public class ServiceHandler{
    // 处理服务异常
    @ExceptionHandler (ServiceException.class)
    public R<Void> handleServiceException(ServiceException e){
        return R.error(e.getErrCode(), e.getErrMsg());
    }

    // 处理其他异常
    @ExceptionHandler (Exception.class)
    public R<Void> handleException(Exception e){
        return R.error(2000, ResultCode.ERROR.getMsg());
    }
}
