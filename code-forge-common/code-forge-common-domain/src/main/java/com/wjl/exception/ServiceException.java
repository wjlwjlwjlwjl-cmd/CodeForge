package com.wjl.exception;

public class ServiceException extends RuntimeException {
    private Integer errCode; // 错误码
    private String errMsg; // 错误信息

    public ServiceException(Integer errCode, String errMsg) {
        super(errMsg);
        this.errCode = errCode;
        this.errMsg = errMsg;
    }

    public ServiceException(Integer errCode) {
        super("服务异常");
        this.errCode = errCode;
        this.errMsg = "服务异常";
    }

    public ServiceException(String errMsg) {
        super(errMsg);
        this.errMsg = errMsg;
    }

    public Integer getErrCode() {
        return errCode;
    }

    public String getErrMsg() {
        return errMsg;
    }
}
