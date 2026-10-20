package com.wjl.consumer;

import com.rabbitmq.client.Channel;
import com.wjl.constants.Constants;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class AckConsumer {
    @RabbitListener(queues = {Constants.ACK_QUEUE})
    public void ackFunc(Channel channel, Message message) throws IOException {
        System.out.println("get message: " + message);
        Long deliveryTag = message.getMessageProperties().getDeliveryTag();
        try{
            channel.basicAck(deliveryTag, false);
        }
        catch(Exception e){
            System.out.println("发生异常");
            channel.basicNack(deliveryTag, false, false);
        }
    }
}
