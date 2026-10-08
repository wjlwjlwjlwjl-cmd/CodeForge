package com.wjl.job.controller;

import com.wjl.core.domain.R;
import com.wjl.domain.constants.SecurityConstants;
import com.wjl.domain.domain.dto.JudgeRequestDTO;
import com.wjl.domain.domain.dto.JudgeResponseDTO;
import com.wjl.job.domain.dto.SubmitInfoDTO;
import com.wjl.job.service.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/job")
public class JobController {
    @Autowired
    private JobService jobService;

    @RequestMapping("/java/submit")
    public R<Void> javaSubmit(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, SubmitInfoDTO submitInfoDTO) {
        jobService.handleSubmit(token, submitInfoDTO);
        return R.success();
    }

    //测试，由 test 模拟前端进行判题请求 -> 服务后端发送判题消息到 mq（含带 userId） -> JudgeWorker 订阅消费消息 -> 判题结束发送消息到判题结果队列（含有 userId）
    //                  sudo systemctl restart docker                                              -> 后端订阅判题结果队列，有消息后入数据库 -> 根据 userId 选择链接，进行 webSocket 推送
    @RequestMapping("/test")
    public void test(){
        jobService.buildTest();
    }
}

/*
* 1. 两数之和（784）
Scanner sc = new Scanner(System.in);
int a = sc.nextInt();
int b = sc.nextInt();
System.out.println(a + b);

* 2. 两数之差（785）
Scanner sc = new Scanner(System.in);
int a = sc.nextInt();
int b = sc.nextInt();
System.out.println(a - b);
*
* */