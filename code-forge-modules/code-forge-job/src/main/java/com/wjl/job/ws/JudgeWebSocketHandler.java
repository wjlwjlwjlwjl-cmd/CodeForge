package com.wjl.job.ws;

import com.wjl.core.utils.ColorLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class JudgeWebSocketHandler extends TextWebSocketHandler {
    @Autowired
    private WebSocketSessionManager sessionManager;

    //在完成前面AuthHandshakeInterceptor过滤后，会调用这个方法，这时将连接交给ConCurrentHashMap 保管
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userId = getUserId(session);       // ← 取出来
        if (userId == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }
        sessionManager.add(userId, session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        if ("ping".equalsIgnoreCase(payload)) {
            session.sendMessage(new TextMessage("pong"));
            return;
        }
        // 其他消息按业务需要处理
        ColorLog.info(true, "收到客户端消息: {}", payload);
    }

    //WebSocket链接正常关闭是双方发送 Close 帧的过程，之后会调用这个回调
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = getUserId(session);
        if (userId != null) {
            sessionManager.remove(userId, session);
        }
    }

    //TCP 写失败
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        String userId = getUserId(session);
        ColorLog.error("{}传输信息失败: {}", userId, exception.getMessage());
        if(session.isOpen()){
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    /** 统一封装取 userId */
    private String getUserId(WebSocketSession session) {
        Object v = session.getAttributes().get("user_id");
        return v == null ? null : (String) v;
    }
}
