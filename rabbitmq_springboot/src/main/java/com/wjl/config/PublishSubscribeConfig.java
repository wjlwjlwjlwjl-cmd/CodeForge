package com.wjl.config;

import com.wjl.constants.Constants;
import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PublishSubscribeConfig {
    //声明队列
    @Bean(Constants.PS_QUEUE1)
    public Queue getQueue1(){
        return QueueBuilder.durable(Constants.PS_QUEUE1).build();
    }
    @Bean(Constants.PS_QUEUE2)
    public Queue getQueue2(){
        return QueueBuilder.durable(Constants.PS_QUEUE2).build();
    }

    //声明交换机
    @Bean(Constants.PS_EXCHANGE)
    public Exchange getExchange(){
        return ExchangeBuilder.fanoutExchange(Constants.PS_EXCHANGE).build();
    }

    //进行交换机-队列绑定
    @Bean("binding1")
    public Binding bind1(@Qualifier(Constants.PS_EXCHANGE) FanoutExchange fanoutExchange, @Qualifier(Constants.PS_QUEUE1) Queue queue){
        return BindingBuilder.bind(queue).to(fanoutExchange);
    }
    @Bean("binding2")
    public Binding bind2(@Qualifier(Constants.PS_EXCHANGE) FanoutExchange fanoutExchange, @Qualifier(Constants.PS_QUEUE2) Queue queue){
        return BindingBuilder.bind(queue).to(fanoutExchange);
    }
}
