package com.wjl.judge;

import com.wjl.core.utils.ColorLog;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.wjl")
public class JudgeApplication {

    public static void main(String[] args) {
        SpringApplication.run(JudgeApplication.class, args);
        ColorLog.info("【判题服务启动成功】");
    }
}
