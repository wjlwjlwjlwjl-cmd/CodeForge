package com.wjl.consumer;

import com.rabbitmq.client.Channel;
import com.wjl.constants.Constants;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class DlConsumer {
    @RabbitListener(queues = Constants.NORMAL_Q)
    public void normalListener(Channel channel, Message message) throws IOException {
        long deliveryTag = message.getMessageProperties().getDeliveryTag();
        channel.basicNack(deliveryTag, false, false);
    }
}
