package com.wjl.controller;

import com.wjl.constants.Constants;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/productor")
public class ProductorController {
    @Autowired
    RabbitTemplate rabbitTemplate;

    @RequestMapping("/work")
    public void work(){
        for(int i = 0; i < 10; i++){
            rabbitTemplate.convertAndSend("", Constants.WORK_QUEUE, "hello world: " + i);
        }
    }

    @RequestMapping("/ps")
    public void ps(){
        rabbitTemplate.convertAndSend(Constants.PS_EXCHANGE, "", "hello world");
    }

    @RequestMapping("/routing")
    public void routing(){
        rabbitTemplate.convertAndSend(Constants.ROUTING_EXCHANGE, "black", "hello black");
        rabbitTemplate.convertAndSend(Constants.ROUTING_EXCHANGE, "white", "hello white");
    }

    @RequestMapping("/topic")
    public void topic(){
        rabbitTemplate.convertAndSend(Constants.TOPIC_EXCHANGE, "a.b.c", "hello a.b.c");
        rabbitTemplate.convertAndSend(Constants.TOPIC_EXCHANGE, "1.2.3", "hello 1.2.3");
    }

    @RequestMapping("/manual_ack")
    public void manalAck(){
        rabbitTemplate.convertAndSend(Constants.ACK_QUEUE, "test manual ack");
    }

    @RequestMapping("/ttl")
    public void ttl(){
        String ttl = "10000"; //10s
        rabbitTemplate.convertAndSend(Constants.TTL_EXCHANGE, Constants.TTL_QUEUE, "testing ttl", messagePostProcesser->{
            messagePostProcesser.getMessageProperties().setExpiration(ttl);
            return messagePostProcesser;
        });
    }

    @RequestMapping("/dl_ttl")
    public void dlTtl(){
        rabbitTemplate.convertAndSend(Constants.NORMAL_EX, "normal", "testing dl caused by ttl");
    }

    @RequestMapping("/dl_len")
    public void dlLen(){
        for(int i = 0; i < 20; i++)
            rabbitTemplate.convertAndSend(Constants.NORMAL_EX, "normal", "testing dl caused by length");
    }

    @RequestMapping("/dl_nack")
    public void dlNack(){
        rabbitTemplate.convertAndSend(Constants.NORMAL_EX, "normal", "testing dl caused by nack");
    }
}
