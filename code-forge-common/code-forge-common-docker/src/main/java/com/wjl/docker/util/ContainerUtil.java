package com.wjl.docker.util;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.CopyArchiveFromContainerCmd;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.InspectContainerResponse;
import com.github.dockerjava.api.exception.ConflictException;
import com.github.dockerjava.api.exception.NotFoundException;
import com.github.dockerjava.api.model.*;
import com.github.dockerjava.core.command.ExecStartResultCallback;
import com.wjl.core.utils.ColorLog;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;
import org.apache.commons.compress.utils.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class ContainerUtil {
    @Autowired
    private DockerClient dockerClient;

    /**
     *
     * @param containerId 容器id
     * @return 是否存在该容器
     */
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
        // 先可靠删除同名残留容器（运行中/已停止/正在删除都处理）
        removeContainersByName(containerName);

        // 必须由当前进程先创建宿主机目录：
        // 若交给 Docker 建 bind 源目录，它会以 root 身份创建，
        // 之后 Java 进程没有写权限，报“源代码写入目录失败”。
        try {
            Files.createDirectories(Paths.get(hostDir));
        } catch (IOException e) {
            throw new RuntimeException("创建宿主机目录失败：" + hostDir, e);
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

        // 同名容器可能正处于 "Removing" 中，名字短暂仍被占用，冲突时重试
        ConflictException lastConflict = null;
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
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
            } catch (ConflictException e) {
                lastConflict = e;
                ColorLog.error("创建容器 {} 名称冲突，第 {} 次重试", containerName, attempt);
                removeContainersByName(containerName);
                try {
                    Thread.sleep(500L * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        throw lastConflict != null
                ? lastConflict
                : new RuntimeException("创建容器失败：" + containerName);
    }

    /**
     * 按名称删除所有同名容器（去掉前导斜杠后做精确匹配），返回删除数量。
     * 直接用 withNameFilter 有时不可靠，这里改为列出全部再逐个比对。
     */
    public int removeContainersByName(String containerName) {
        int removed = 0;
        List<Container> all = dockerClient.listContainersCmd().withShowAll(true).exec();
        for (Container c : all) {
            String[] names = c.getNames();
            if (names == null) {
                continue;
            }
            boolean match = false;
            for (String n : names) {
                if (n == null) {
                    continue;
                }
                String norm = n.startsWith("/") ? n.substring(1) : n;
                if (norm.equals(containerName)) {
                    match = true;
                    break;
                }
            }
            if (match && removeContainerQuietly(c.getId())) {
                ColorLog.info("移除同名容器 {} ({})", containerName, c.getId());
                removed++;
            }
        }
        return removed;
    }

    /** 强制删除容器：容器不存在或已停止都不报错 */
    public boolean removeContainerQuietly(String containerId) {
        try {
            dockerClient.removeContainerCmd(containerId)
                    .withForce(true)
                    .withRemoveVolumes(true)
                    .exec();
            return true;
        } catch (NotFoundException e) {
            return true; // 已经不在了
        } catch (Exception e) {
            ColorLog.error("移除容器{}失败: {}", containerId, e.getMessage());
            return false;
        }
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

    /**
     * 在容器内把目录权限放开（容器以 root 运行，会作用到宿主机 bind 源目录）。
     * 用于兼容「宿主机目录已被 Docker 以 root 创建」的历史情况，
     * 否则 Java 进程没有写权限，写源码时会报“源代码写入目录失败”。
     */
    public void grantDirPermission(String containerId, String dir) {
        try {
            String execId = dockerClient.execCreateCmd(containerId)
                    .withCmd("chmod", "-R", "777", dir)
                    .exec()
                    .getId();
            dockerClient.execStartCmd(execId)
                    .exec(new ExecStartResultCallback())
                    .awaitCompletion();
        } catch (Exception e) {
            ColorLog.error("放开目录权限失败 {}: {}", dir, e.getMessage());
        }
    }

    public void stopAndRemoveContainer(String containerId) {
        try {
            dockerClient.stopContainerCmd(containerId).withTimeout(5).exec();
        } catch (Exception ignored) {
            // 容器可能已经停止或不存在（stop 会抛 304），不能因此跳过删除
        }
        removeContainerQuietly(containerId);
    }

    /**
     * 拉取镜像（带实时进度打印）
     */
    public void pullImage(String imageName) throws InterruptedException {
        // 解析镜像名
        String[] parts = imageName.split(":", 2);
        String repository = parts[0];
        String tag = parts.length > 1 ? parts[1] : "latest";

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
    }

    private Boolean imageExists(String imageName) {
        List<Image> images = dockerClient
                .listImagesCmd()
                .withReferenceFilter(imageName)
                .exec();
        return !images.isEmpty();
    }

    public void cleanOrphan() {

        List<Container> orphans = dockerClient.listContainersCmd()
                .withShowAll(true)  // 包括已停止的容器
                .exec()
                .stream()
                .filter(c -> {
                    String[] names = c.getNames();
                    if (names == null || names.length == 0) return false;
                    // 任意一个名称包含 "pool-java" 即匹配
                    for (String name : names) {
                        if (name != null && name.contains("pool-java")) {
                            return true;
                        }
                    }
                    return false;
                })
                .toList();

        for (Container c : orphans) {
            if (removeContainerQuietly(c.getId())) {
                ColorLog.info("清除容器: {} ({})", c.getId(), c.getNames()[0]);
            }
        }
        ColorLog.info("残留容器清除完成，共处理 {} 个", orphans.size());
    }


    public boolean isAlive(String containerId) {
        try {
            InspectContainerResponse info = dockerClient.inspectContainerCmd(containerId).exec();
            InspectContainerResponse.ContainerState state = info.getState();
            return state != null && Boolean.TRUE.equals(state.getRunning());
        } catch (Exception e) {
            return false;
        }
    }

    /**
     *
     * @param containerId 容器id
     * @param hostPath 本地文件或目录
     * @param containerTargetPath 容器内路径
     */
    /**
     * 把宿主机目录拷贝到容器内目标目录。
     * 注意：Docker 的 PUT archive 要求目标目录【已经存在】，
     * 所以要先在容器里 mkdir -p 目标目录，并等它真正执行完再拷贝；
     * 只建父目录、或不等执行完成，都会报 404 Could not find the file。
     */
    public void copyToContainer(String containerId,
                                String hostPath, String containerTargetPath) {
        String execId = dockerClient.execCreateCmd(containerId)
                .withCmd("mkdir", "-p", containerTargetPath)
                .exec()
                .getId();
        try {
            dockerClient.execStartCmd(execId)
                    .exec(new ExecStartResultCallback())
                    .awaitCompletion();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        dockerClient.copyArchiveToContainerCmd(containerId)
                .withHostResource(hostPath)
                .withRemotePath(containerTargetPath)
                .withNoOverwriteDirNonDir(false)
                .exec();
    }
}