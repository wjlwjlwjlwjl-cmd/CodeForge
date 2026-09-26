package com.wjl.service;

import com.wjl.constants.CacheConstants;
import com.wjl.redis.service.RedisService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class EmailService {
    @Value("${email.username}")
    private String from;

    @Autowired
    private JavaMailSender javaMailSender;

    @Autowired
    private RedisService redisService;

    private final SecureRandom random = new SecureRandom();

    public EmailService(){
        log.info("Email Service Constructing...");
    }

    /**
     * 发送验证码
     * @param to 用户邮箱
     * @return 是否发送成功
     */
    public Boolean sendVerifyCode(String to){
        Integer raw = random.nextInt(0, 1_000_000);
        String code = String.format("%06d", raw);

        //将验证码放到 redis 中
        redisService.setCacheObject(CacheConstants.VERIFY_PREFIX + to, code, 300, TimeUnit.SECONDS); //五分钟过期

        return sendSimpleEmail(to, code);
    }

    public Boolean sendSimpleEmail(String to, String content){
        String msg = String.format("您好！您的 CodeForge 注册验证码为 %s，请在五分钟内完成验证！", content);
        return sendSimpleEmail(to, "CodeForge 登录验证码", msg);
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
