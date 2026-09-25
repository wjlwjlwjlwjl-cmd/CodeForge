package com.nexus.nexuscommonmessage.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class EmailService {
    @Value("${email.username}")
    String from;

    @Autowired
    JavaMailSender javaMailSender;

    public EmailService(){
        log.info("Email Service Constructing...");
    }

    public Boolean sendSimpleEmail(String to, String content){
        String msg = String.format("您好！您的 WispCode 注册验证码为 %s，请在五分钟内完成验证！", content);
        return sendSimpleEmail(to, "WispCode 登录验证码", msg);
    }

    public Boolean sendSimpleEmail(String to, String subject, String content){
        SimpleMailMessage simpleMailMessage = new SimpleMailMessage();
        simpleMailMessage.setFrom(from);
        simpleMailMessage.setTo(to);
        simpleMailMessage.setSubject(subject);
        simpleMailMessage.setText(content);

        try{
            javaMailSender.send(simpleMailMessage);
        }
        catch(MailException e) {
            log.warn(e.getMessage());
            return false;
        }
        return true;
    }
}
