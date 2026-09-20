package com.wjl.system.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wjl.core.domain.R;
import com.wjl.system.domain.dto.SysLoginDTO;

@RestController 
@RequestMapping ("/system")
public class SystemController {
    @RequestMapping("login")
    public R<String> login(SysLoginDTO loginDTO) {
        return R.success("login");
    }
}
