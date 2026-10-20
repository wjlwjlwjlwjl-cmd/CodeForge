package com.wjl.config;

import com.wjl.constants.Constants;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AckQueueConfig {
    @Bean
    public Queue getQueue(){
        return QueueBuilder.durable(Constants.ACK_QUEUE).build();
    }
}