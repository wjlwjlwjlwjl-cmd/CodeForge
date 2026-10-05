package com.wjl.judge.controller;

import com.wjl.core.utils.ColorLog;
import com.wjl.judge.domain.dto.JudgeRequestDTO;
import com.wjl.judge.domain.dto.JudgeResponseDTO;
import com.wjl.judge.enums.LanguageConfigurations;
import com.wjl.judge.service.JudgeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/judge")
public class JudgeController {
    @Autowired
    private JudgeService judgeService;
    @Value("${spring.rabbitmq.host:NOT_FOUND}")
    private String rabbitmqHost;

    @RequestMapping("/java/submit")
    public JudgeResponseDTO javaSubmit(JudgeRequestDTO judgeRequestDTO){
        ColorLog.info(rabbitmqHost);
        return judgeService.judge(judgeRequestDTO, LanguageConfigurations.JAVA_PROFILE.getLanguageProfile());
    }
}