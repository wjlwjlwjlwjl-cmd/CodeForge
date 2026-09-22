package com.wjl.gateway.config;

import java.util.List;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@RefreshScope
@ConfigurationProperties(prefix="security.ignore")
public class WhiteListConfig {
    private List<String> whites;
}
