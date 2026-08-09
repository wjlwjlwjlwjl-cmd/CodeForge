package com.wjl;

import com.rabbitmq.client.BuiltinExchangeType;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

import java.util.concurrent.TimeUnit;

public class ProducerApplication {
    static ConnectionFactory connectionFactory;
    static Connection connection;
    static Channel channel;

    public static void main(String[] args) throws Exception{
        connectionFactory = new ConnectionFactory();
        connectionFactory.setHost("localhost");
        connectionFactory.setUsername("admin");
        connectionFactory.setPassword("123");
        connectionFactory.setPort(5672);
        connectionFactory.setVirtualHost("test");

        connection = connectionFactory.newConnection();
        channel = connection.createChannel();
        channel.queueDeclare("test_queue1", true, false, false, null);
        channel.queueDeclare("test_queue2", true, false, false, null);

        //modeWorkQueue();
        //modePublishSubscribe();
        //modeRouting();
        modeTopic();

        TimeUnit.SECONDS.sleep(5);

        channel.close();
        connection.close();
    }

    public static void modeWorkQueue() throws Exception{
        for(int i = 0; i < 10; i++){
            String msg = i + ": hello world";
            channel.basicPublish("", "test_queue", null, msg.getBytes()); //交换机默认是 ""
            TimeUnit.SECONDS.sleep(1);
        }
    }

    public static void modePublishSubscribe() throws Exception{
        //由交换机对所有绑定到交换机的队列进行转发。声明交换机（fanout）、绑定队列、发布消息
        channel.exchangeDeclare("publish/subscribe", BuiltinExchangeType.FANOUT, true, false, null);
        channel.queueBind("test_queue1", "publish/subscribe", ""); //如果交换机类型为 fanout，那么路由键设置为 ""，表示广播到所有队列
        channel.queueBind("test_queue2", "publish/subscribe", ""); //如果交换机类型为 fanout，那么路由键设置为 ""，表示广播到所有队列

        for(int i = 0; i < 10; i++){
            String msg = i + ": hello world";
            channel.basicPublish("publish/subscribe", "", null, msg.getBytes()); //交换机默认是 ""
            TimeUnit.SECONDS.sleep(1);
        }
    }

    public static void modeRouting() throws Exception{
        //交换机根据指定绑定队列时的绑定键和发布队列时的路由键进行匹配，声明交换机（direct）、绑定队列（指定绑定键）、发布消息（指定路由键）
        channel.exchangeDeclare("routing", BuiltinExchangeType.DIRECT, true, false, null);
        channel.queueBind("test_queue1", "routing", "test_queue1"); //如果交换机类型为 fanout，那么路由键设置为 ""，表示广播到所有队列
        channel.queueBind("test_queue2", "routing", "test_queue2"); //如果交换机类型为 fanout，那么路由键设置为 ""，表示广播到所有队列

        for(int i = 0; i < 10; i++){
            String msg = i + ": hello world";
            if(i % 2 == 1){
                channel.basicPublish("routing", "test_queue1", null, msg.getBytes()); //交换机默认是 ""
            }
            else{
                channel.basicPublish("routing", "test_queue2", null, msg.getBytes()); //交换机默认是 ""
            }
            TimeUnit.SECONDS.sleep(1);
        }
    }

    public static void modeTopic() throws Exception{
        //* 表示单个单词，# 表示多个单词
        channel.exchangeDeclare("topic", BuiltinExchangeType.TOPIC, true, false, null);
        channel.queueBind("test_queue1", "a.b.*", "test_queue1"); //如果交换机类型为 fanout，那么路由键设置为 ""，表示广播到所有队列
        channel.queueBind("test_queue2", "1.#", "test_queue2"); //如果交换机类型为 fanout，那么路由键设置为 ""，表示广播到所有队列

        for(int i = 0; i < 10; i++){
            String msg = i + ": hello world";
            if(i % 2 == 1){
                channel.basicPublish("a.b.c", "test_queue1", null, msg.getBytes()); //交换机默认是 ""
            }
            else{
                channel.basicPublish("1.2.3.4", "test_queue2", null, msg.getBytes()); //交换机默认是 ""
            }
            TimeUnit.SECONDS.sleep(1);
        }
    }
}
