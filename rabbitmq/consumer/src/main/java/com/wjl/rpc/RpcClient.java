package com.wjl.rpc;

import com.rabbitmq.client.*;
import com.rabbitmq.client.RpcServer;
import com.wjl.constants.RabbitmqConstants;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.Array;
import java.util.UUID;
import java.util.concurrent.ArrayBlockingQueue;

public class RpcClient {
    public static void main(String[] args) throws Exception{
        ConnectionFactory connectionFactory = new ConnectionFactory();
        connectionFactory.setUsername("admin");
        connectionFactory.setPassword("123");
        connectionFactory.setHost("localhost");
        connectionFactory.setPort(5672);
        connectionFactory.setVirtualHost("test");
        Connection connection = connectionFactory.newConnection();
        Channel channel = connection.createChannel();

        //声明自己的回调队列
        channel.queueDeclare(RabbitmqConstants.RpcResponseQueue, true, false, false, null);

        //发送 RPC 请求
        String id = UUID.randomUUID().toString();
        AMQP.BasicProperties basicProperties = new AMQP.BasicProperties()
                .builder()
                .correlationId(id) //设置请求校验id
                .replyTo(RabbitmqConstants.RpcResponseQueue) //设置回调队列
                .build();
        String rpcRequest = "this is a rpc request";
        channel.basicPublish("", RabbitmqConstants.RpcRequestQueue, basicProperties, rpcRequest.getBytes(StandardCharsets.UTF_8));

        //订阅回调队列，等待处理结果
        ArrayBlockingQueue<String> arrayBlockingQueue = new ArrayBlockingQueue<>(1);
        Consumer consumer = new DefaultConsumer(channel){
            @Override
            public void handleDelivery(String consumerTag,
                                       Envelope envelope,
                                       AMQP.BasicProperties properties,
                                       byte[] body)
                    throws IOException
            {
                System.out.println("get rpc response: " + new String(body));
                if(id.equals(properties.getCorrelationId())){
                    try{
                        arrayBlockingQueue.put(new String(body));
                    }
                    catch(Exception e){
                        System.out.println(e);
                    }
                }
            }
        };
        channel.basicConsume(RabbitmqConstants.RpcResponseQueue, true, consumer);
        arrayBlockingQueue.take(); //阻塞等待处理结果
        channel.close();
        connection.close();
    }
}
