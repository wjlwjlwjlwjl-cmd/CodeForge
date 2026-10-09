package com.wjl.job.ws;

import com.wjl.core.utils.ColorLog;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSessionManager {
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public void add(String userId, WebSocketSession session){
        WebSocketSession old = sessions.put(userId, session);
        if(old != null && old.isOpen()){
            try {
                old.close();
            } catch (IOException e) {
                ColorLog.error("关闭 {} 旧链接失败 {}", userId, e.getMessage());
            }
        }
        ColorLog.info("成功添加链接 {}", userId);
    }

    public void remove(String userId,  WebSocketSession session){
        //为了保证不错误关闭连接，只有kv都符合时才删除
        sessions.remove(userId, session);
        ColorLog.info("成功删除链接 {}", userId);
    }

    public Boolean isOnline(String userId){
        WebSocketSession session = sessions.get(userId);
        return session != null && session.isOpen();
    }

    public void sendMessage(String userId, String msg){
        WebSocketSession session = sessions.get(userId);
        if(session == null || !session.isOpen()){
            ColorLog.info(true, "用户{}不在线", userId);
            return;
        }
        try{
            synchronized (session){
                session.sendMessage(new TextMessage(msg));
            }
        }
        catch (IOException e){
            ColorLog.error(true, "推送ws消息to {}失败{}", userId, e.getMessage());
            return;
        }
        //这里不采用发送成功一次消息后立刻断开连接
    }
}
