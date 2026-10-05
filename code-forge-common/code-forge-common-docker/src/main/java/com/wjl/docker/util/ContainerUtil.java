package com.wjl.docker.util;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.exception.NotFoundException;
import com.github.dockerjava.api.model.*;
import com.wjl.core.utils.ColorLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class ContainerUtil {
    @Autowired
    private DockerClient dockerClient;

    public Boolean containerExists(String containerId){
        try{
            dockerClient.inspectContainerCmd(containerId).exec();
            return true;
        }
        catch(NotFoundException e){
            return false;
        }
    }

    /**
     * 创建容器
     *
     * @param hostDir 宿主机目录
     * @param image 使用的镜像（Java、C++）
     * @return 容器 ContainerId
     */
    public String createContainer(String hostDir, String containerDir, String image, String containerName) {
        List<Container> existing = dockerClient.listContainersCmd()
                .withShowAll(true)
                .withNameFilter(Collections.singleton(containerName))
                .exec();
        for (Container c : existing) {
            dockerClient.removeContainerCmd(c.getId()).withForce(true).exec();
        }

        Volume workspace = new Volume(containerDir);
        HostConfig hostConfig = HostConfig.newHostConfig()
                .withBinds(new Bind(hostDir, workspace, AccessMode.rw))
                .withNetworkMode("none") // 禁止容器访问外部网络
                .withMemory(256L * 1024 * 1024) // 内存限制：256 MiB
                .withNanoCPUs(1_000_000_000L) // CPU 限制：1 核
                .withPidsLimit(64L) // 限制进程数量
                .withCapAdd(Capability.DAC_OVERRIDE) //保留最基本的写权限
                .withSecurityOpts(
                        java.util.List.of("no-new-privileges:true")// 禁止提权
                );

        CreateContainerResponse response = dockerClient
                .createContainerCmd(image)
                .withName(containerName)
                .withHostConfig(hostConfig)
                .withWorkingDir("/workspace")
                // 启动后保持容器运行，等待后续 exec 编译和运行
                .withCmd("sh", "-c", "while true; do sleep 3600; done")
                .withTty(false)
                .withStdinOpen(false)
                .exec();

        return response.getId();
    }

    public Boolean startContainer(String containerId){
        try {
            dockerClient.startContainerCmd(containerId).exec();
            return true;
        } catch (RuntimeException e) {
            // 创建成功但启动失败时，避免遗留容器
            stopAndRemoveContainer(containerId);
            throw e;
        }
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

    private Boolean imageExists(String imageName) {
        List<Image> images = dockerClient
                .listImagesCmd()
                .withReferenceFilter(imageName)
                .exec();
        return !images.isEmpty();
    }
}