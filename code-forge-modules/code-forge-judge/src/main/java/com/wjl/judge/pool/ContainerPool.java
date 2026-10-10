package com.wjl.judge.pool;

import com.wjl.core.utils.ColorLog;
import com.wjl.docker.util.ContainerUtil;
import com.wjl.domain.constants.CommonConstants;
import com.wjl.judge.domain.language.LanguageProfile;
import com.wjl.judge.enums.LanguageConfigurations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class ContainerPool {
    /** 池满时创建的临时容器名（不入池，用完即毁） */
    private static final String TEMP_CONTAINER_NAME = "pool-java-tmp-%d";

    @Autowired
    private ContainerUtil containerUtil;

    /** 池内可复用容器：containerId -> 信息（含 hostDir/containerDir） */
    private final ConcurrentHashMap<String, ContainerInfo> containerInfoMap = new ConcurrentHashMap<>();

    /** 池满时新建的临时容器：containerId -> 信息（不入池，但登记以便归还时销毁） */
    private final ConcurrentHashMap<String, ContainerInfo> tempContainerMap = new ConcurrentHashMap<>();

    // 关闭标记：服务关闭后不再创建容器
    private final AtomicBoolean closed = new AtomicBoolean(false);
    // 预热完成标记：预热结束前，健康检查不做事（否则会和 init 并发重复建容器）
    private final AtomicBoolean ready = new AtomicBoolean(false);
    // 临时容器序号，保证并发下名字唯一
    private final AtomicInteger tempCounter = new AtomicInteger(0);

    public void markReady() {
        ready.set(true);
    }

    public boolean isReady() {
        return ready.get();
    }

    /**
     * 新增容器并返回其信息（含 id 与专属目录）：
     *   - 未达上限：加入缓存池
     *   - 已达上限：创建临时容器，但不加入缓存池
     * 每个容器的目录用「容器名」填充模板得到，独立且稳定；
     * 宿主机 hostDir 与容器内 containerDir 已 bind，写入 hostDir 即对容器可见。
     */
    public synchronized ContainerInfo addContainer(LanguageProfile languageProfile, String containerName) {
        if (closed.get()) {
            return null;
        }

        // 同名容器若已在池中，先把旧条目摘掉（createContainer 会删除旧的同名容器）
        removeFromPoolByName(containerName);

        String hostDir = String.format(languageProfile.getHostDir(), containerName);
        String containerDir = String.format(languageProfile.getContainerDir(), containerName);

        String containerId = containerUtil.createContainer(
                hostDir, containerDir, languageProfile.getImage(), containerName);
        containerUtil.startContainer(containerId);
        // 容器以 root 运行：顺手放开 bind 目录权限，保证宿主机 Java 进程可写
        containerUtil.grantDirPermission(containerId, containerDir);

        ContainerInfo containerInfo = new ContainerInfo();
        containerInfo.setContainerId(containerId);
        containerInfo.setContainerName(containerName);
        containerInfo.setHostDir(hostDir);
        containerInfo.setContainerDir(containerDir);
        containerInfo.setCreatedAt(System.currentTimeMillis());

        if (containerInfoMap.size() >= CommonConstants.MAX_CONTAINER_POOL_SIZE) {
            tempContainerMap.put(containerId, containerInfo); // 临时容器不入池
            return containerInfo;
        }

        containerInfoMap.put(containerId, containerInfo);
        return containerInfo;
    }

    /** 取一个空闲容器；池内无空闲时创建临时容器。返回带目录的容器信息 */
    public synchronized ContainerInfo getContainer() {
        for (ContainerInfo containerInfo : containerInfoMap.values()) {
            if (Boolean.FALSE.equals(containerInfo.getInUse())) {
                containerInfo.setInUse(true);
                containerInfo.setBorrowedAt(System.currentTimeMillis());
                return containerInfo;
            }
        }

        LanguageProfile languageProfile = LanguageConfigurations.JAVA_PROFILE.getLanguageProfile();
        String containerName = String.format(TEMP_CONTAINER_NAME, tempCounter.incrementAndGet());
        return addContainer(languageProfile, containerName);
    }

    /**
     * 统一归还：
     *   - 池内容器：仍存活则标记空闲可复用；已被 kill（如运行超时）则丢弃，由健康检查补齐
     *   - 临时容器：直接销毁
     */
    public void release(String containerId) {
        if (containerId == null) {
            return;
        }
        synchronized (this) {
            ContainerInfo pooled = containerInfoMap.get(containerId);
            if (pooled != null) {
                if (containerUtil.isAlive(containerId)) {
                    pooled.setInUse(false);
                    pooled.setBorrowedAt(null);
                } else {
                    // 容器已死（超时被 kill 等），不能回池
                    containerInfoMap.remove(containerId);
                    containerUtil.stopAndRemoveContainer(containerId);
                    ColorLog.info("池内容器 {} 已失效，丢弃等待补齐", containerId);
                }
                return;
            }

            ContainerInfo temp = tempContainerMap.remove(containerId);
            if (temp != null) {
                containerUtil.stopAndRemoveContainer(containerId);
                ColorLog.info("临时容器 {} 已销毁", containerId);
            }
        }
    }

    /** 标记关闭（不再创建容器） */
    public void shutdown() {
        closed.set(true);
    }

    public synchronized void closeAllContainer() {
        closed.set(true);
        for (ContainerInfo containerInfo : containerInfoMap.values()) {
            containerUtil.stopAndRemoveContainer(containerInfo.getContainerId());
            ColorLog.info(true, "container {} close successfully", containerInfo.getContainerId());
        }
        for (ContainerInfo containerInfo : tempContainerMap.values()) {
            containerUtil.stopAndRemoveContainer(containerInfo.getContainerId());
            ColorLog.info(true, "temp container {} close successfully", containerInfo.getContainerId());
        }
        // 必须清空，否则关闭后会被误认为池里还有容器
        containerInfoMap.clear();
        tempContainerMap.clear();
    }

    public synchronized void checkContainers() {
        // 未就绪（预热中）或已关闭时不做事
        if (closed.get() || !ready.get()) {
            return;
        }

        // 移除不健康的容器
        for (Map.Entry<String, ContainerInfo> entry : containerInfoMap.entrySet()) {
            String containerId = entry.getKey();
            if (!containerUtil.isAlive(containerId)) {
                containerInfoMap.remove(containerId);
                containerUtil.stopAndRemoveContainer(containerId);
                ColorLog.info("移除不健康容器 {}", containerId);
            }
        }

        // 补齐到池的目标数量（加 guard 防止异常情况下死循环）
        int target = CommonConstants.CONTAINER_POOL_SIZE;
        int guard = 0;
        while (containerInfoMap.size() < target && guard++ < CommonConstants.MAX_CONTAINER_POOL_SIZE) {
            LanguageProfile languageProfile = LanguageConfigurations.JAVA_PROFILE.getLanguageProfile();
            addContainer(languageProfile, nextFreeName());
        }
    }

    /** 摘掉池中所有同名条目（用于同名重建前清理，避免 map 里残留失效条目） */
    private void removeFromPoolByName(String containerName) {
        for (Map.Entry<String, ContainerInfo> entry : containerInfoMap.entrySet()) {
            ContainerInfo info = entry.getValue();
            if (containerName.equals(info.getContainerName())) {
                containerInfoMap.remove(entry.getKey());
            }
        }
    }

    /** 取一个池中未被占用的容器名（避免与已有容器重名） */
    private String nextFreeName() {
        Set<String> used = new HashSet<>();
        for (ContainerInfo ci : containerInfoMap.values()) {
            if (ci.getContainerName() != null) {
                used.add(ci.getContainerName());
            }
        }
        for (int i = 0; i < CommonConstants.CONTAINER_POOL_SIZE; i++) {
            String name = String.format(CommonConstants.POOL_CONTAINER_NAME, i);
            if (!used.contains(name)) {
                return name;
            }
        }
        // 兜底：正常情况下不会走到这里
        return String.format(CommonConstants.POOL_CONTAINER_NAME, containerInfoMap.size());
    }
}