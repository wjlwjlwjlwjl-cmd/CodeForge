package com.wjl.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Slf4j
@Configuration
public class EmailConfig {
    @Value("${email.host:smtp.qq.com}")
    String emailHost;

    @Value("${email.port:587}")
    Integer emailPort;

    @Value("${email.username}")
    String userName;

    @Value("${email.password}")
    String password;

    @Value("${email.connection-timeout:10000}")
    int connectionTimeout;

    @Value("${email.timeout:10000}")
    int timeout;

    @Value("${email.write-timeout:10000}")
    int writeTimeout;

    @Bean
    public JavaMailSender getBean(){
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(emailHost);
        sender.setPort(emailPort);
        sender.setUsername(userName);
        sender.setPassword(password);
        sender.setProtocol("smtp");
        sender.setDefaultEncoding("UTF-8");

        Properties properties = new Properties();

        properties.put("mail.smtp.auth", true);

        // 根据端口选择加密方式：587端口使用STARTTLS，465端口使用SSL
        if (emailPort == 465) {
            // 465端口使用SSL
            properties.put("mail.smtp.ssl.enable", true);
            properties.put("mail.smtp.ssl.required", true);
            properties.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            properties.put("mail.smtp.socketFactory.port", 465);
        } else {
            // 587端口使用STARTTLS（TLS）
            properties.put("mail.smtp.starttls.enable", true);
            properties.put("mail.smtp.starttls.required", true);
        }

        // 添加超时和连接配置
        properties.put("mail.smtp.connectiontimeout", connectionTimeout);
        properties.put("mail.smtp.timeout", timeout);
        properties.put("mail.smtp.writetimeout", writeTimeout);

        sender.setJavaMailProperties(properties);
        return sender;
    }
}
