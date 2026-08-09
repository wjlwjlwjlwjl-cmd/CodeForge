package com.wjl.consumer;

import com.wjl.constants.Constants;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class TopicConsumer {
    @RabbitListener(queues= Constants.TOPIC_QUEUE1)
    public void listener1(Message message){
        System.out.println("listener1 get message: " + message);
    }

    @RabbitListener(queues= Constants.TOPIC_QUEUE2)
    public void listener2(Message message){
        System.out.println("listener2 get message: " + message);
    }
}
