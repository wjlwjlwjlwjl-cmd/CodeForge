package com.wjl.docker.util;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.InspectImageResponse;
import com.github.dockerjava.api.command.PullImageResultCallback;
import com.github.dockerjava.api.exception.NotFoundException;
import com.github.dockerjava.api.model.*;
import com.wjl.constants.CommonConstants;
import com.wjl.core.utils.ColorLog;
import com.wjl.docker.domain.CodeContainerDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.ServerSocket;
import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;

import static com.wjl.constants.CommonConstants.MAX_PORT;
import static com.wjl.constants.CommonConstants.MIN_PORT;

@Component
public class ContainerUtil {
    @Autowired
    private DockerClient dockerClient;

    public final Random random = new Random();

    public Boolean containerExists(String containerId){
        try{
            dockerClient.inspectContainerCmd(containerId).exec();
            return true;
        }
        catch(NotFoundException e){
            return false;
        }
    }

    public CodeContainerDTO createContainer(String hostDir, String containerDir, String image) {
        CodeContainerDTO ret = new CodeContainerDTO();

        for (int retry = 0; retry < CommonConstants.MAX_RETRY; retry++) {
            //尝试寻找 MAX_RETRY 次
            int hostLocalPort = getRandomAvailablePort();
            String containerId = null;
            try {
                // 目录绑定，显式读写模式
                Bind bindMount = new Bind(hostDir, new Volume(containerDir), AccessMode.rw);

                Ports.Binding binding = new Ports.Binding("0.0.0.0", String.valueOf(hostLocalPort));
                PortBinding portBinding = new PortBinding(
                        binding,
                        ExposedPort.tcp(8080)
                );

                HostConfig hostConfig = new HostConfig()
                        .withBinds(bindMount)
                        .withPortBindings(portBinding)
                        .withAutoRemove(true)
                        .withRestartPolicy(RestartPolicy.noRestart());

                CreateContainerResponse resp = dockerClient.createContainerCmd(image)
                        .withName("oj-" + image)
                        .withUser("root")
                        .withHostConfig(hostConfig)
                        .withExposedPorts(ExposedPort.tcp(8080))
                        .withWorkingDir(containerDir)
                        .withEnv("PWD=" + containerDir)
                        .withCmd(
                        )
                        .exec();

                containerId = resp.getId();
                dockerClient.startContainerCmd(containerId).exec();

                ret.setContainId(containerId);
                ret.setHostLocalPort(hostLocalPort);
                return ret;
                // 服务没就绪，清理容器，进入下一次重试
            } catch (Exception e) {
                // 异常：清理残留容器
                if (containerId != null) {
                    try {
                        dockerClient.removeContainerCmd(containerId).withForce(true).exec();
                    } catch (Exception ignore) {
                    }
                }
                continue;
            }
        }
        return null;
    }

    public void stopAndRemoveContainer(String containerId) {
        try {
            dockerClient.stopContainerCmd(containerId).exec();
            dockerClient.removeContainerCmd(containerId).withForce(true).exec();
        } catch (Exception e) {
            ColorLog.error("停止容器失败");
        }
    }

    /**
     * 拉取镜像（带实时进度打印）
     */
    public void pullImage(String imageName) throws InterruptedException {
        // 解析镜像名
        String[] parts = imageName.split(":", 2);
        String repository = parts[0];
        String tag = parts.length > 1 ? parts[1] : "latest";

        ColorLog.info("开始拉取镜像：{}，仓库：{}，标签：{}", imageName, repository, tag);

        if (imageExists(imageName)) {
            return;
        }

        dockerClient.pullImageCmd(repository)
                .withTag(tag)
                .exec(new ResultCallback.Adapter<PullResponseItem>() {
                    @Override
                    public void onNext(PullResponseItem item) {
                        String id = item.getId() == null ? "" : item.getId();
                        String status = item.getStatus() == null ? "" : item.getStatus();
                        String progress = item.getProgress() == null ? "" : item.getProgress();
                        // 有进度则带进度，否则只打状态（Pulling/Pulling fs layer/Waiting等）
                        if (progress.isEmpty()) {
                            ColorLog.info("[{}] {}\r", id, status);
                        } else {
                            ColorLog.info("[{}] {} | {}\r", id, status, progress);
                        }
                    }

                    @Override
                    public void onError(Throwable throwable) {
                        ColorLog.error("拉取镜像失败：{}", throwable.getMessage());
                    }
                })
                .awaitCompletion(10, TimeUnit.MINUTES);   // 加超时，防止网络卡死

        ColorLog.info("成功拉取镜像：{}", imageName);
    }


    private int getRandomAvailablePort() {
        //每次寻找，随机找100个端口
        for (int i = 0; i < 100; i++) {
            int port = random.nextInt(MAX_PORT - MIN_PORT + 1) + MIN_PORT;
            try (ServerSocket serverSocket = new ServerSocket(port, 1, InetAddress.getByName("127.0.0.1"))) {
                return port;
            } catch (Exception ignored) {
            }
        }
        ColorLog.error("无法获取可用端口，尝试100次均失败");
        return -1;
    }

    private Boolean imageExists(String imageName) {
        List<Image> images = dockerClient
                .listImagesCmd()
                .withReferenceFilter(imageName)
                .exec();
        return !images.isEmpty();
    }
}