package com.wjl.config;

import org.springframework.amqp.core.ReturnedMessage;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitTemplateConfig {
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);

        //Confirm 模式
        rabbitTemplate.setConfirmCallback((correlationData, ack, cause) -> {
            if(ack){
                System.out.println("Broker 成功接收消息");
            }
            else{
                System.out.println("Broker 接收消息失败");
            }
        });

        //Return 模式
        rabbitTemplate.setReturnsCallback(returned -> {
            System.out.println("消息路由失败：" + returned);
        });

        return rabbitTemplate;
    }
}
