package com.wjl.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.wjl.core.utils.ColorLog;

@SpringBootApplication(scanBasePackages = "com.wjl")
public class SystemApplication {
    public static void main(String[] args) {
        SpringApplication.run(SystemApplication.class, args);
        ColorLog.ok("SystemApplication start successfully");
    }
}
