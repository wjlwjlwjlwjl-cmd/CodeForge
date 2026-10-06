package com.wjl.judge.task;

import com.wjl.domain.constants.CommonConstants;
import com.wjl.docker.util.ContainerUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class JudgeContainerInitTask {
    @Autowired
    private ContainerUtil containerUtil;

    @EventListener(ApplicationReadyEvent.class)
    public void init() throws InterruptedException {
        containerUtil.pullImage(CommonConstants.CPP_IMAGE);
        containerUtil.pullImage(CommonConstants.JAVA_IMAGE);
    }

}
