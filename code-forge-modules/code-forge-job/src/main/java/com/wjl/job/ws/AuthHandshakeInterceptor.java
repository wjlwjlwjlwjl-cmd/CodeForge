package com.wjl.job.ws;

import com.wjl.domain.constants.SecurityConstants;
import com.wjl.core.utils.ColorLog;
import com.wjl.domain.domain.dto.LoginUserDTO;
import com.wjl.security.service.TokenService;
import com.wjl.security.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
public class AuthHandshakeInterceptor implements HandshakeInterceptor {
    @Autowired
    private TokenService tokenService;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        //是C端用户，并且信息解析正确（和Gateway的校验规则一样），才进行 WebSocket 连接的维护
        String token = request.getHeaders().getFirst(SecurityConstants.AUTHENTICATION);
        if(token == null || token.isBlank()){
            //浏览器发起websocket连接请求，一般不能将请求放进Header，所以要到param中取
            if(request instanceof ServletServerHttpRequest servletRequest){
                token = servletRequest.getServletRequest().getParameter("token");
            }
            if(token == null || token.isBlank()){
                ColorLog.info("token is null");
                return false;
            }
        }

        LoginUserDTO loginUserDTO = tokenService.getCLoginUser(token);
        if(loginUserDTO == null){
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            ColorLog.info("WebSocket 握手失败 LoginUserDTO is null");
            return false;
        }

        String userId =  loginUserDTO.getUserId();
        String userType = loginUserDTO.getUserType();
        if(userType == null || userType.equals(SecurityConstants.ADMIN)){
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            ColorLog.info("WebSocket 握手失败{}", userId);
            return false;
        }

        if(!loginUserDTO.getUserAccount().equals(JwtUtil.getEmailOrAccount(token))
                || !loginUserDTO.getUsername().equals(JwtUtil.getUserName(token))
                || !loginUserDTO.getUserId().equals(JwtUtil.getUserId(token))
                || !loginUserDTO.getUserType().equals(JwtUtil.getUserType(token))){
            ColorLog.info("WebSocket 握手失败{}", userId);
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        ColorLog.info("WebSocket 握手成功{}", userId);
        attributes.put("user_id", userId);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {
        //握手之后暂时不需要处理
    }
}
