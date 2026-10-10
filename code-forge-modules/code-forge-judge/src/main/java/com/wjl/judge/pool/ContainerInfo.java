package com.wjl.judge.pool;

import lombok.Data;

@Data
public class ContainerInfo {
    private String containerId;
    private String containerName;
    // 该容器专属的宿主机目录（bind 源）与容器内目录（bind 目标）
    private String hostDir;
    private String containerDir;
    private Long createdAt;
    private Long borrowedAt;
    private Boolean inUse = false;
}
