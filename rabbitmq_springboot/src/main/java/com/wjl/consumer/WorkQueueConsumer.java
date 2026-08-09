package com.wjl.consumer;

import com.wjl.constants.QueueConstants;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class WorkQueueConsumer {
    @RabbitListener(queues=QueueConstants.WORK_QUEUE)
    public void listener1(Message message){
        System.out.println("listener1 get a message from " + QueueConstants.WORK_QUEUE + ", content: " + message);
    }

    @RabbitListener(queues=QueueConstants.WORK_QUEUE)
    public void listener2(Message message){
        System.out.println("listener2 get a message from " + QueueConstants.WORK_QUEUE + ", content: " + message);
    }
}
