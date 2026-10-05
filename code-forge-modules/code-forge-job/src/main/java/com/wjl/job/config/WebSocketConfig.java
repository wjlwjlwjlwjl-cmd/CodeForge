package com.wjl.job.config;

import com.wjl.job.ws.AuthHandshakeInterceptor;
import com.wjl.job.ws.JudgeWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    @Autowired
    private JudgeWebSocketHandler judgeWebSocketHandler;
    @Autowired
    private AuthHandshakeInterceptor authHandshakeInterceptor;

    //前端url，ws://${ip}:${port}/ws/judge?token=${jwt}
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(judgeWebSocketHandler, "/ws/judge")
                .addInterceptors(authHandshakeInterceptor)
                .setAllowedOriginPatterns("*");   // 生产环境改成具体域名
    }
}
