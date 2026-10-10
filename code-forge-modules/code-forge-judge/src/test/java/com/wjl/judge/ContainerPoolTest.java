package com.wjl.judge;

import com.wjl.core.utils.ColorLog;
import com.wjl.judge.pool.ContainerPool;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class ContainerPoolTest {
    @Autowired
    private ContainerPool containerPool;

    @Test
    public void testContainerPool() throws InterruptedException {
        ColorLog.info(true, "testContainerPool");

        //先测试获取容器，并通过 Thread.sleep模拟判题
        Thread thread1 = new Thread(() -> {
            String containerId = containerPool.getContainer().getContainerId();
            try {
                ColorLog.info(true, "{} 执行十秒的判题任务");
                Thread.sleep(10_000);
                containerPool.release(containerId);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        });
        Thread thread2 = new Thread(() -> {
            String containerId = containerPool.getContainer().getContainerId();
            try {
                ColorLog.info(true, "{} 执行十秒的判题任务");
                Thread.sleep(10_000);
                containerPool.release(containerId);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        });
        Thread thread3 = new Thread(() -> {
            String containerId = containerPool.getContainer().getContainerId();
            try {
                ColorLog.info(true, "{} 执行十秒的判题任务");
                Thread.sleep(10_000);
                containerPool.release(containerId);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        });
        Thread thread4 = new Thread(() -> {
            String containerId = containerPool.getContainer().getContainerId();
            try {
                ColorLog.info(true, "{} 执行十秒的判题任务");
                Thread.sleep(10_000);
                containerPool.release(containerId);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        });
        Thread thread5 = new Thread(() -> {
            String containerId = containerPool.getContainer().getContainerId();
            try {
                ColorLog.info(true, "{} 执行十秒的判题任务");
                Thread.sleep(10_000);
                containerPool.release(containerId);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        });

        thread1.start();
        thread2.start();
        thread3.start();
        thread4.start();
        thread5.start();

        thread1.join();
        thread2.join();
        thread3.join();
        thread4.join();
        thread5.join();
    }
}
