package com.wjl;

import com.rabbitmq.client.*;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

public class ConsumerApplication2 {
    static ConnectionFactory connectionFactory;
    static Connection connection;
    static Channel channel;
    static Consumer consumer;

    public static void main(String[] args) throws Exception{
        //Simple 简单模式，点对点，一个生产者一个消费者，消息只能被消费一次
        //Work Queue 工作序列，一个生产者多个消费者，适用于异步处理。比如订票服务，处理完成后将消息放到 RabbitMQ，再由短信服务自行取消息完成处理
        //Publish/Subscribe 模式，订阅/发布模式
        connectionFactory = new ConnectionFactory();
        connectionFactory.setHost("localhost");
        connectionFactory.setUsername("admin");
        connectionFactory.setPassword("123");
        connectionFactory.setPort(5672);
        connectionFactory.setVirtualHost("test");

        connection = connectionFactory.newConnection();
        channel = connection.createChannel();
        channel.queueDeclare("test_queue2", true, false, false, null);

        consumer = new DefaultConsumer(channel){
            @Override
            public void handleDelivery(String consumerTag,
                                       Envelope envelope,
                                       AMQP.BasicProperties properties,
                                       byte[] body)
                    throws IOException
            {
                System.out.println("consumer2 get a new msg: " + new String(body));
            }
        };

        //modeWorkQueue();
        //modePublishSubscribe();
        //modeRouting();
        modeTopic();

        TimeUnit.SECONDS.sleep(5);
    }

    public static void modeWorkQueue() throws Exception{
        channel.basicConsume("test_queue2", consumer);
    }

    public static void modePublishSubscribe() throws Exception{
        channel.basicConsume("test_queue2", true, consumer);
    }

    public static void modeRouting() throws Exception{
        channel.basicConsume("test_queue2", true, consumer);
    }

    public static void modeTopic() throws Exception{
        channel.basicConsume("test_queue2", true, consumer);
    }
}
