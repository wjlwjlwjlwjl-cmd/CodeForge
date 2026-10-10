package com.wjl.judge.task;

import com.wjl.core.utils.ColorLog;
import com.wjl.domain.constants.CommonConstants;
import com.wjl.docker.util.ContainerUtil;
import com.wjl.judge.domain.language.LanguageProfile;
import com.wjl.judge.enums.LanguageConfigurations;
import com.wjl.judge.pool.ContainerPool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class JudgeContainerTask {
    @Autowired
    private ContainerUtil containerUtil;
    @Autowired
    private ContainerPool containerPool;

    @EventListener(ApplicationReadyEvent.class)
    public void init() throws InterruptedException {
        containerUtil.pullImage(CommonConstants.JAVA_IMAGE);
        ColorLog.info(true, "Image Pulling success");

        containerUtil.cleanOrphan();

        LanguageProfile languageProfile = LanguageConfigurations.JAVA_PROFILE.getLanguageProfile();
        for (int i = 0; i < CommonConstants.CONTAINER_POOL_SIZE; i++) {
            String containerName = String.format(CommonConstants.POOL_CONTAINER_NAME, i);
            ColorLog.info(true, "create container " + containerName);
            containerPool.addContainer(languageProfile, containerName);
        }
        // 预热完成：此后健康检查才开始工作（避免与 init 并发重复建容器）
        containerPool.markReady();
        ColorLog.info(true, "Container Pool Init success");
    }

    @EventListener(ContextClosedEvent.class)
    public void contextClosed() {
        // 先标记关闭，避免定时健康检查在关闭过程中又重新创建容器
        containerPool.shutdown();
        ColorLog.info(true, "Container Pool Closing...");
        containerPool.closeAllContainer();
        ColorLog.info(true, "Container Pool Close success");
    }

    // initialDelay：启动 30s 后才开始体检，避免和预热阶段并发
    @Scheduled(fixedRate = 30_000, initialDelay = 30_000)
    public void containerHealthCheck() {
        // 未就绪/已关闭时 checkContainers 内部会直接返回
        containerPool.checkContainers();
    }
}