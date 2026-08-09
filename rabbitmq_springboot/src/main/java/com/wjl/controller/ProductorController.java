package com.wjl.controller;

import com.wjl.constants.QueueConstants;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping("/productor")
public class ProductorController {
    @Autowired
    RabbitTemplate rabbitTemplate;

    @RequestMapping("/work")
    public void work(){
        for(int i = 0; i < 10; i++){
            rabbitTemplate.convertAndSend("", QueueConstants.WORK_QUEUE, "hello world: " + i);
        }
    }
}
