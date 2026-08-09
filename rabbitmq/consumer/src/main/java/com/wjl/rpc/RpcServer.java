package com.wjl.rpc;

import com.rabbitmq.client.*;
import com.wjl.constants.RabbitmqConstants;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class RpcServer {
    public static void main(String[] args) throws Exception{
        ConnectionFactory connectionFactory = new ConnectionFactory();
        connectionFactory.setUsername("admin");
        connectionFactory.setPassword("123");
        connectionFactory.setHost("localhost");
        connectionFactory.setPort(5672);
        connectionFactory.setVirtualHost("test");
        Connection connection = connectionFactory.newConnection();
        Channel channel = connection.createChannel();

        //请求队列是由rpc服务器确定的
        channel.queueDeclare(RabbitmqConstants.RpcRequestQueue, true, false, false, null);

        //Rpc 服务器每次只处理一个请求
        channel.basicQos(1);
        //从请求队列中获取请求
        Consumer consumer = new DefaultConsumer(channel){
            @Override
            public void handleDelivery(String consumerTag,
                                       Envelope envelope,
                                       AMQP.BasicProperties properties,
                                       byte[] body)
                    throws IOException
            {
                System.out.println("rpc server get a request");
                String ret = "rpc server successfully handle the request";
                String id = properties.getCorrelationId();
                AMQP.BasicProperties basicProperties = new AMQP.BasicProperties()
                        .builder()
                        .correlationId(id)
                        .build();
                channel.basicPublish("", properties.getReplyTo(), basicProperties, ret.getBytes(StandardCharsets.UTF_8));
                channel.basicAck(envelope.getDeliveryTag(), false);
            }
        };
        System.out.println("service started, waiting request...");
        channel.basicConsume(RabbitmqConstants.RpcRequestQueue, consumer);
    }
}
