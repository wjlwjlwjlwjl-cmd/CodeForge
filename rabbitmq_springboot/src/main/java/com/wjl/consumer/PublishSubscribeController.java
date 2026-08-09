package com.wjl.consumer;

import com.wjl.constants.Constants;
import org.apache.tomcat.util.bcel.Const;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class PublishSubscribeController {
    @RabbitListener(queues= Constants.PS_QUEUE1)
    public void listener1(Message message){
        System.out.println("listener1 get message: " + message);
    }

    @RabbitListener(queues= Constants.PS_QUEUE2)
    public void listener2(Message message){
        System.out.println("listener2 get message: " + message);
    }
}
