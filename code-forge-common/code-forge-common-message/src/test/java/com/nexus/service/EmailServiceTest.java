package com.nexus.service;

import com.nexus.nexuscommonmessage.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

@SpringBootTest
class EmailServiceTest {
    @Autowired
    ApplicationContext applicationContext;

    @Test
    void sendSimpleEmail() {
        EmailService emailService = applicationContext.getBean(EmailService.class);
        emailService.sendSimpleEmail("25300120122@m.fudan.edu.cn", "hello world");
    }
}