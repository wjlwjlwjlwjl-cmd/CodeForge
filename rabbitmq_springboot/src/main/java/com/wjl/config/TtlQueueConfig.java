package com.wjl.config;

import com.wjl.constants.Constants;
import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TtlQueueConfig {
    @Bean("ttl_exchange")
    public FanoutExchange getTtlExchange(){
        return ExchangeBuilder.fanoutExchange(Constants.TTL_EXCHANGE).build();
    }

    @Bean("ttl_queue")
    public Queue getTtlQueue(){
        return QueueBuilder.durable(Constants.TTL_QUEUE).ttl(10*1000).build();
    }

    @Bean("ttl_binding")
    public Binding getBinding(@Qualifier(value = "ttl_exchange")FanoutExchange exchange,
                              @Qualifier(value = "ttl_queue")Queue queue){
        return BindingBuilder.bind(queue).to(exchange);
    }
}
