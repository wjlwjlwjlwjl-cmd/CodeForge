package com.wjl.config;

import com.wjl.constants.Constants;
import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TopicConfig {
    //声明队列
    @Bean(Constants.TOPIC_QUEUE1)
    public Queue getQueue1(){
        return QueueBuilder.durable(Constants.TOPIC_QUEUE1).build();
    }
    @Bean(Constants.TOPIC_QUEUE2)
    public Queue getQueue2(){
        return QueueBuilder.durable(Constants.TOPIC_QUEUE2).build();
    }

    //声明交换机
    @Bean(Constants.TOPIC_EXCHANGE)
    public Exchange getExchange(){
        return ExchangeBuilder.topicExchange(Constants.TOPIC_EXCHANGE).durable(true).build();
    }

    //进行交换机-队列绑定
    @Bean("topic-binding1")
    public Binding bind1(@Qualifier(Constants.TOPIC_EXCHANGE) TopicExchange fanoutExchange, @Qualifier(Constants.TOPIC_QUEUE1) Queue queue){
        return BindingBuilder.bind(queue).to(fanoutExchange).with("a.b.*");
    }
    @Bean("topic-binding2")
    public Binding bind2(@Qualifier(Constants.TOPIC_EXCHANGE) TopicExchange fanoutExchange, @Qualifier(Constants.TOPIC_QUEUE2) Queue queue){
        return BindingBuilder.bind(queue).to(fanoutExchange).with("1.#");
    }
}
