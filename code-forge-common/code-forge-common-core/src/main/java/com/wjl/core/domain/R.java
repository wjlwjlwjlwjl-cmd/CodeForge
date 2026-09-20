package com.wjl.core.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

// 统一响应结果
@Schema (description = "统一响应结果")
@Data 
public class R <T>{
    private Integer code;
    private String msg;
    private T data;

    public static<T> R<T> success(T data){
        R<T> r = new R<>();
        r.setCode(200);
        r.setMsg("success");
        r.setData(data);
        return r;
    }

    public static<T> R<T> error(Integer code,String msg){
        R<T> r = new R<>();
        r.setCode(code);
        r.setMsg(msg);
        return r;
    }
}
