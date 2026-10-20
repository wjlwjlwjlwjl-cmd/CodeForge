package com.wjl.config;

import com.wjl.constants.Constants;
import org.apache.tomcat.util.bcel.Const;
import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DeadLetterConfig {
    @Bean("dlx")
    public FanoutExchange getDlx(){
        return ExchangeBuilder.fanoutExchange(Constants.DLX).build();
    }

    @Bean("dlq")
    public Queue getDlq(){
        return QueueBuilder.durable(Constants.DLQ).build();
    }

    @Bean
    public Binding getBinding1(@Qualifier(value = "dlx") Exchange exchange, @Qualifier(value = "dlq") Queue queue){
        return BindingBuilder.bind(queue).to(exchange).with("dlx").noargs();
    }

    @Bean("nor_ex")
    public FanoutExchange getNormalEx(){
        return ExchangeBuilder.fanoutExchange(Constants.NORMAL_EX).build();
    }

    @Bean("nor_q")
    public Queue getNormalQ(){
        //设置死信队列、死信交换机
        return QueueBuilder.durable(Constants.NORMAL_Q)
                .deadLetterExchange(Constants.DLX)
                .deadLetterRoutingKey("dlx")
                .ttl(10 * 1000) //过期
                .maxLength(10L) //超过队列长度
                .build();
    }

    @Bean
    public Binding getBinding2(@Qualifier(value = "nor_ex") Exchange exchange, @Qualifier(value = "nor_q") Queue queue){
        return BindingBuilder.bind(queue).to(exchange).with("normal").noargs();
    }
}
