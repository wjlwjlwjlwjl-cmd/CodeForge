package com.wjl.job;

import com.wjl.core.utils.ColorLog;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.wjl")
public class JobApplication {
    public static void main(String[] args) {
        SpringApplication.run(JobApplication.class, args);
        ColorLog.info("JobApplication starts successfully");
    }
}