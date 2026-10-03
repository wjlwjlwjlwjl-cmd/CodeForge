package com.wjl.constants;

public class CommonConstants {
    /**
     * 通用日期格式
     */
    public static final String STANDARD_FORMAT = "yyyy-MM-dd HH:mm:ss";

    /**
     * 默认编码
     */
    public final static String UTF8 = "UTF-8";

    /**
     * 页大小
     */
    public final static int PAGE_SIZE = 10;

    /**
     * oss 预签名过期时间
     */
    public final static long PRESIGNED_SIGNATURE_EXPIRE_SECONDS = 300 * 1000L;

    /**
     * 用户头像文件允许的类型
     */
    public static final String[] ALLOW_MIME = {"image/jpeg", "image/jpg", "image/png", "image/webp"};

    /**
     * 用户头像尺寸限制
     */
    public static final long MAX_SIZE = 2 * 1024 * 1024;

    /**
     * docker-java 容器端口选择最大重试次数
     */
    public static final Integer MAX_RETRY = 10;

    /**
     * docker-java 容器端口随机尝试范围
     */
    public static final Integer MAX_PORT = 20000;
    public static final Integer MIN_PORT = 40000;

    public static final String CPP_IMAGE = "gcc:13-bookworm";
    public static final String JAVA_IMAGE = "eclipse-temurin:17-jdk-jammy";
}