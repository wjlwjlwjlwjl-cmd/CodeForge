package com.wjl.friend;

import com.wjl.core.utils.ColorLog;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling // 开启spring boot定时任务
@SpringBootApplication(scanBasePackages = "com.wjl")
@EnableElasticsearchRepositories("com.wjl")
public class FriendApplication {
    public static void main(String[] args) {
        SpringApplication.run(FriendApplication.class, args);
        ColorLog.ok("【Friend Application Start Successfully】");
    }
}
