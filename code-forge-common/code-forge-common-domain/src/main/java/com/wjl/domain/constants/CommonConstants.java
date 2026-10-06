package com.wjl.domain.constants;

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

    /**
     * 判题容器使用镜像
     */
    public static final String CPP_IMAGE = "gcc:13-bookworm";
    public static final String JAVA_IMAGE = "eclipse-temurin:17-jdk-jammy";

    /**
     * 容器目录绑定
     */
    //public static final String HOST_DIR = System.getProperty("user.dir") + "/user-code/java/" + "%d";
    public static final String JAVA_HOST_DIR = "/data/oj/java/%d";
    public static final String JAVA_CONTAINER_DIR = "/workspace/java/%d";
    public static final String JAVA_CONTAINER_NAME = "oj-java-%d";

    /**
     * Java 代码的编译模版与运行模版
     */
    public static final String JAVA_COMPILE_TEMPLATE =
            "cd /workspace/java/%d && javac -encoding UTF-8 Main.java";
    public static final String JAVA_RUNTIME_TEMPLATE = """
        cd /workspace/java/%d && java \\
          -XX:+UseSerialGC \\
          -XX:TieredStopAtLevel=1 \\
          -Xss64m \\
          Main < input.txt""";

    /**
     * 编译超时和运行超时
     */
    public static final long JAVA_COMPILE_TIMEOUT_MS = 10_000L;
    public static final long JAVA_RUN_TIMEOUT_MS = 3_000L;

    /**
     * 源码名
     */
    public static final String JAVA_SOURCE_CODE = "Main.java";

    /**
     * 运行环境启动时间
     */
    public static final long JAVA_RUN_OVERHEAD_MS = 800L;

    /**
     * rabbitmq 交换机、队列、路由键配置
     */
    // ========== 判题请求 ==========
    public static final String JUDGE_EXCHANGE = "judge.exchange";

    // Java 判题请求
    public static final String JAVA_ROUTING_KEY = "judge.java";
    public static final String JAVA_QUEUE = "judge.java.queue";

    // ========== 判题结果 ==========
    public static final String RESULT_EXCHANGE = "judge.result.exchange";
    public static final String RESULT_ROUTING_KEY = "judge.result";
    public static final String RESULT_QUEUE = "judge.result.queue";
}