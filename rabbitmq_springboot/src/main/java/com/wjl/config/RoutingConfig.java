package com.wjl.config;

import com.wjl.constants.Constants;
import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RoutingConfig {
    //声明队列
    @Bean(Constants.ROUTING_QUEUE1)
    public Queue getQueue1(){
        return QueueBuilder.durable(Constants.ROUTING_QUEUE1).build();
    }
    @Bean(Constants.ROUTING_QUEUE2)
    public Queue getQueue2(){
        return QueueBuilder.durable(Constants.ROUTING_QUEUE2).build();
    }

    //声明交换机
    @Bean(Constants.ROUTING_EXCHANGE)
    public Exchange getExchange(){
        return ExchangeBuilder.directExchange(Constants.ROUTING_EXCHANGE).build();
    }

    //进行交换机-队列绑定
    @Bean("routing-binding1")
    public Binding bind1(@Qualifier(Constants.ROUTING_EXCHANGE) DirectExchange fanoutExchange, @Qualifier(Constants.ROUTING_QUEUE1) Queue queue){
        return BindingBuilder.bind(queue).to(fanoutExchange).with("black");
    }
    @Bean("routing-binding2")
    public Binding bind2(@Qualifier(Constants.ROUTING_EXCHANGE) DirectExchange fanoutExchange, @Qualifier(Constants.ROUTING_QUEUE2) Queue queue){
        return BindingBuilder.bind(queue).to(fanoutExchange).with("white");
    }
}
