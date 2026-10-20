package com.wjl.consumer;

import com.rabbitmq.client.Channel;
import com.wjl.constants.Constants;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.http.HttpMessageConverters;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class TtlConsumer {
    @Autowired
    private RabbitTemplate rabbitTemplate;
    @Autowired
    private HttpMessageConverters messageConverters;

    /*@RabbitListener(queues = {Constants.TTL_QUEUE})
    public void ttlSender(Channel channel, Message message) throws IOException {
        Long deliveryTag = message.getMessageProperties().getDeliveryTag();
        System.out.println("get ttl message: " + message);
        channel.basicNack(deliveryTag, false, false);
    }*/
}
