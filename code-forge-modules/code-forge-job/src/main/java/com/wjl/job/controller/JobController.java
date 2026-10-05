package com.wjl.job.controller;

import com.wjl.constants.SecurityConstants;
import com.wjl.job.domain.dto.JudgeRequestDTO;
import com.wjl.job.domain.dto.JudgeResponseDTO;
import com.wjl.job.service.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/judge")
public class JobController {
    @Autowired
    private JobService jobService;

    //测试，由 test 模拟前端进行判题请求
    //前端请求 -> 后端 controller -> 服务后端发送判题消息到 mq（含带 userId） -> JudgeWorker 订阅消费消息 -> 判题结束发送消息到判题结果队列（含有 userId）
    //                                                                -> 后端订阅判题结果队列，有消息后入数据库 -> 根据 userId 选择链接，进行 webSocket 推送
    @RequestMapping("/java/submit")
    public JudgeResponseDTO javaSubmit(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, JudgeRequestDTO judgeRequestDTO){
        return jobService.handleSubmit(token, judgeRequestDTO);
    }

    @RequestMapping("/test")
    public void test(){
        jobService.testJudge();
    }
}