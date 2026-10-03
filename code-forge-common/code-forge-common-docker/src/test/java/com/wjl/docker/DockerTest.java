package com.wjl.docker;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.wjl.constants.CommonConstants;
import com.wjl.core.utils.ColorLog;
import com.wjl.docker.util.ContainerUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;
import java.nio.file.Path;
import java.util.UUID;

@SpringBootTest
public class DockerTest {
    @Autowired
    private ContainerUtil containerUtil;

    @Test
    public void testConnection() throws IOException {
        String dockerHost = "tcp://localhost:2375";
        DefaultDockerClientConfig config =
                DefaultDockerClientConfig.createDefaultConfigBuilder()
                        .withDockerHost(dockerHost)
                        .build();

        ApacheDockerHttpClient httpClient =
                new ApacheDockerHttpClient.Builder()
                        .dockerHost(config.getDockerHost())
                        .sslConfig(config.getSSLConfig())
                        .build();
        DockerClient dockerClient = DockerClientImpl.getInstance(config, httpClient);

        String ret = null;
        // 测试 Docker API 是否可用
        ret += "Ping: " +  dockerClient.pingCmd().exec();
        ret += '\n';

        // 获取 Docker 版本
        ret += "Version: " + dockerClient.versionCmd().exec();
        ret += '\n';

        // 获取容器列表
        ret += "Containers: " +
                dockerClient.listContainersCmd()
                        .withShowAll(true)
                        .exec().size();
        ret += '\n';
        ColorLog.info(ret);
        httpClient.close();
    }

    @Test
    public void testImagePull() throws InterruptedException {
        containerUtil.pullImage(CommonConstants.CPP_IMAGE);
    }

    @Test
    public void testContainer(){
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String containerId = containerUtil.createContainer("/data/" + suffix, CommonConstants.CPP_IMAGE, "CPP" + suffix);
        ColorLog.info(containerUtil.startContainer(containerId).toString());

        suffix = UUID.randomUUID().toString().substring(0, 8);
        containerId = containerUtil.createContainer("/data/" + suffix, CommonConstants.JAVA_IMAGE, "CPP" + suffix);
        ColorLog.info(containerUtil.startContainer(containerId).toString());
    }
}
