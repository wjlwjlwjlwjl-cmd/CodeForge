package com.wjl.security.handler;

import com.wjl.core.domain.R;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.ColorLog;
import com.wjl.exception.ServiceException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class GlobalExceptionHandler {

    // 运行时异常
    @ExceptionHandler(RuntimeException.class)
    public R<?> handleRuntimeException(RuntimeException ex, HttpServletRequest request) {
        String uri = request.getRequestURI();
        ColorLog.error("RuntimeException: {}, URI: {}", ex.getMessage(), uri);
        return R.error(ResultCode.ERROR.getCode(), ResultCode.ERROR.getMsg());
    }

    // 业务自定义异常
    @ExceptionHandler(ServiceException.class)
    public R<?> handleServiceException(ServiceException e, HttpServletRequest request) {
        String uri = request.getRequestURI();
        ColorLog.error("ServiceException: {}, URI: {}", e.getMessage(), uri);
        // 防御性兜底：单参构造的 ServiceException 可能未携带错误码/错误信息字段
        Integer code = e.getErrCode() != null ? e.getErrCode() : ResultCode.FAILED.getCode();
        String msg = e.getErrMsg() != null ? e.getErrMsg() : e.getMessage();
        return R.error(code, msg);
    }

    // 请求方法不支持
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public R<?> handleMethodNotSupported(HttpRequestMethodNotSupportedException e, HttpServletRequest request) {
        String uri = request.getRequestURI();
        ColorLog.error("HttpRequestMethodNotSupportedException: {}, URI: {}", e.getMessage(), uri);
        return R.error(ResultCode.FAILED.getCode(), ResultCode.FAILED.getMsg());
    }

    // 参数类型不匹配
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public R<?> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException e, HttpServletRequest request) {
        String uri = request.getRequestURI();
        ColorLog.error("MethodArgumentTypeMismatchException: {}, URI: {}", e.getMessage(), uri);
        return R.error(ResultCode.FAILED.getCode(), ResultCode.FAILED.getMsg());
    }

    // @RequestBody 参数校验失败 @Valid
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public R<?> handleMethodArgumentNotValidException(MethodArgumentNotValidException e, HttpServletRequest request) {
        String uri = request.getRequestURI();
        ColorLog.error("MethodArgumentNotValidException: {}, URI: {}", e.getMessage(), uri);
        return R.error(ResultCode.FAILED_PARAMS_VALIDATE.getCode(), ResultCode.FAILED_PARAMS_VALIDATE.getMsg());
    }

    // 兜底捕获所有其他异常
    @ExceptionHandler(Exception.class)
    public R<?> handleException(Exception e, HttpServletRequest request) {
        String uri = request.getRequestURI();
        ColorLog.error("Exception: {}, URI: {}", e.getMessage(), uri);
        return R.error(ResultCode.ERROR.getCode(), ResultCode.ERROR.getMsg());
    }
}
