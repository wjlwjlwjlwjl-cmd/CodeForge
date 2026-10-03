package com.wjl.docker.domain;

import lombok.Data;

@Data
public class CodeContainerDTO {
    private Integer hostLocalPort;
    private String containId;
}
