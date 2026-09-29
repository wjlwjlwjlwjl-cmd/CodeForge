package com.wjl.friend;

import com.wjl.core.utils.ColorLog;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication 
public class FriendApplication {
    public static void main(String[] args) {
        SpringApplication.run(FriendApplication.class, args);
        ColorLog.ok("【Friend Application Start Successfully】");
    }
}
