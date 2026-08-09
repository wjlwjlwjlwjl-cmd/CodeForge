package com.wjl.publish_confirm;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.ConfirmListener;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.SortedSet;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.concurrent.TimeUnit;

public class PublishConfirm {
    static ConnectionFactory connectionFactory;
    static Connection connection;
    static Channel channel;
    static int total = 1000;

    public static void main(String[] args) throws Exception{
        //publish messages individually，每次发布消息都进行确认
        //用来解决生产者发送消息到Broker 失败的情况
        connectionFactory = new ConnectionFactory();
        connectionFactory.setUsername("admin");
        connectionFactory.setPassword("123");
        connectionFactory.setHost("localhost");
        connectionFactory.setPort(5672);
        connectionFactory.setVirtualHost("test");
        connection = connectionFactory.newConnection();
        channel = connection.createChannel();
        channel.queueDeclare("publish_confirm", true, false, false, null);
        channel.confirmSelect(); //开启信道确认模式

        for(int i = 0; i < 5; i++){
            individually();
            inBatches();
            asynchronously();
            TimeUnit.SECONDS.sleep(1);
            System.out.println();
        }

        channel.close();
        connection.close();
    }

    public static void individually() throws Exception{
        long start = System.currentTimeMillis();
        for(int i = 0; i < total; i++){
            String msg = "hello";
            channel.basicPublish("", "publish_confirm", null, msg.getBytes(StandardCharsets.UTF_8));
            channel.waitForConfirmsOrDie(5000); //等待应答，5秒超时时间，超时则抛出异常
        }
        long end = System.currentTimeMillis();
        System.out.println("请求单独确认，100条消息发送，耗时（毫秒）：" + (end - start));
    }

    public static void inBatches() throws Exception{
        //RabbitMQ Broker 开启信道确认后，接收到消息会调用 basicAck，其中的 deliveryTag 类似 Tcp 中的 Ack 应答报文中的 32 位确认序号，之前的内容全部收到
        long start = System.currentTimeMillis();
        int batchSize = 100;
        int outstandingMessageCount = 0;
        for(int i = 0; i < total; i++){
            String msg = "hello";
            channel.basicPublish("", "publish_confirm", null, msg.getBytes(StandardCharsets.UTF_8));
            outstandingMessageCount++;
            if(outstandingMessageCount == batchSize){
                channel.waitForConfirmsOrDie(5000);
                outstandingMessageCount = 0;
            }
        }
        if(outstandingMessageCount == 0){
            channel.waitForConfirmsOrDie(5000);
        }
        long end = System.currentTimeMillis();
        System.out.println("请求批量确认，200条消息发送，耗时（毫秒）：" + (end - start));
    }

    public static void asynchronously() throws Exception{
        //通过 confirmListener 异步等待，通过 handleAck 和 handleNack 回调更新确认结果
        long start = System.currentTimeMillis();

        SortedSet<Long> confirm = Collections.synchronizedSortedSet(new TreeSet<>());
        channel.addConfirmListener(new ConfirmListener() {
            @Override
            public void handleAck(long deliveryTag, boolean multiple) throws IOException {
                if(multiple){
                    //批量确认，deliveryTag 及其之前的全部确认
                    confirm.headSet(deliveryTag + 1).clear();
                }
                else{
                    confirm.remove(deliveryTag); //删除确认过的元素
                }
            }

            @Override
            public void handleNack(long deliveryTag, boolean multiple) throws IOException {
                if(multiple){
                    System.out.println("messages before " + deliveryTag + " all lost!!!");
                    confirm.headSet(deliveryTag + 1).clear();
                }
                else{
                    System.out.println("messages " + deliveryTag + "lost!!!");
                    confirm.remove(deliveryTag); //删除确认过的元素
                }
            }
        });
        for(int i = 0; i < total; i++){
            long nextSeqNo = channel.getNextPublishSeqNo();
            confirm.add(nextSeqNo);
            String msg = "hello";
            channel.basicPublish("", "publish_confirm", null, msg.getBytes(StandardCharsets.UTF_8));
        }
        while(!confirm.isEmpty()){}

        long end = System.currentTimeMillis();
        System.out.println("请求异步确认，200条消息发送，耗时（毫秒）：" + (end - start));
    }
}
