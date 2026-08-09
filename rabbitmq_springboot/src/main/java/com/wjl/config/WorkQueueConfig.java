package com.wjl.config;

import com.wjl.constants.QueueConstants;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WorkQueueConfig {
    @Bean("workQueue")
    public Queue getWorkQueue(){
        return QueueBuilder.durable(QueueConstants.WORK_QUEUE).build(); //队列内容进行持久化
    }
}
