package com.wjl.friend.task;

import com.wjl.core.utils.ColorLog;
import com.wjl.redis.service.RedisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class CacheInitTask {
    @Autowired
    private RedisService redisService;

    @EventListener(ApplicationReadyEvent.class)
    public void initRedisCache(){
        String pattern = "user:*:exam";
        redisService.scan(pattern, 100, key -> redisService.deleteObject(key));
        ColorLog.info("用户竞赛报名列表缓存失效完成");
    }
}
