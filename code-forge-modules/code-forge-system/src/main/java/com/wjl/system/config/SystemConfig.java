package com.wjl.system.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.wjl.system.intercepter.SystemIntercepter;

@Configuration 
public class SystemConfig implements WebMvcConfigurer{
    @Autowired 
    private SystemIntercepter systemIntercepter;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(systemIntercepter)
                .addPathPatterns("/system/**")
                .excludePathPatterns("/system/login");
    }

}
