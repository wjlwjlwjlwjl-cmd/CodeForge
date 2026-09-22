package com.wjl.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.wjl.core.utils.ColorLog;

@SpringBootApplication 
public class GatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
        ColorLog.ok("GatewayApplication start");
    }
}
