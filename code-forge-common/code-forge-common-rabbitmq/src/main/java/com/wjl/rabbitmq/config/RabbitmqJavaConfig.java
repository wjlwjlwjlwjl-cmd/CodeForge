package com.wjl.rabbitmq.config;

import com.wjl.constants.CommonConstants;
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitmqJavaConfig {
    @Bean
    public TopicExchange judgeExchange() {
        return ExchangeBuilder.topicExchange(CommonConstants.JUDGE_EXCHANGE).durable(true).build();
    }

    @Bean
    public Queue judgeQueue() {
        return QueueBuilder.durable(CommonConstants.JAVA_QUEUE).build();
    }

    @Bean
    public Binding judgeBinding(Queue judgeQueue, TopicExchange judgeExchange) {
        return BindingBuilder.bind(judgeQueue).to(judgeExchange).with(CommonConstants.JAVA_ROUTING_KEY);
    }

    @Bean
    public TopicExchange resultExchange(){
        return ExchangeBuilder.topicExchange(CommonConstants.RESULT_EXCHANGE).durable(true).build();
    }

    @Bean
    public Queue resultQueue(){
        return QueueBuilder.durable(CommonConstants.RESULT_QUEUE).build();
    }

    @Bean
    public Binding resultBinding(Queue resultQueue, TopicExchange resultExchange){
        return BindingBuilder.bind(resultQueue).to(resultExchange).with(CommonConstants.RESULT_ROUTING_KEY);
    }
}
