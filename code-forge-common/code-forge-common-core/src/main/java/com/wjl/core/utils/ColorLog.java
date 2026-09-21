package com.wjl.core.utils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 彩色控制台日志工具
 * <p>
 * 简单易用的彩色日志打印工具，适用于开发调试场景。
 * 支持 SLF4J 风格的 {@code {}} 占位符：
 * <pre>
 *     ColorLog.info("用户 {} 登录，角色：{}", "wjl", "admin");
 * </pre>
 * 输出示例（带颜色）：
 * <pre>
 *     [2026-09-21 10:00:00.123] [INFO ] [main] 用户 wjl 登录，角色：admin
 * </pre>
 * <p>
 * 默认开启彩色输出。若在不支持 ANSI 的终端（如老版本 Windows cmd）运行，
 * 可调用 {@link #setEnableColor(boolean)} 关闭彩色。
 * </p>
 *
 * @author wjl
 */
public final class ColorLog {

    private ColorLog() {
    }

    // ===================== ANSI 颜色码 =====================
    private static final String RESET   = "\033[0m";
    private static final String BOLD    = "\033[1m";
    private static final String RED     = "\033[31m";
    private static final String GREEN   = "\033[32m";
    private static final String YELLOW  = "\033[33m";
    private static final String BLUE    = "\033[34m";
    private static final String MAGENTA = "\033[35m";
    private static final String CYAN    = "\033[36m";
    private static final String GRAY    = "\033[90m";

    // ===================== 日志级别 =====================
    private static final String LEVEL_DEBUG = "DEBUG";
    private static final String LEVEL_INFO  = "INFO ";
    private static final String LEVEL_WARN  = "WARN ";
    private static final String LEVEL_ERROR = "ERROR";
    private static final String LEVEL_OK    = "OK   ";

    private static final DateTimeFormatter DTF =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    /** 是否启用彩色输出 */
    private static volatile boolean enableColor = true;

    /**
     * 设置是否启用彩色输出。
     *
     * @param enable {@code true} 开启彩色，{@code false} 关闭彩色
     */
    public static void setEnableColor(boolean enable) {
        enableColor = enable;
    }

    /**
     * 打印 DEBUG 级别日志（蓝色）。
     *
     * @param message 日志消息，支持 {@code {}} 占位符
     * @param args    占位符对应的参数
     */
    public static void debug(String message, Object... args) {
        print(GRAY, LEVEL_DEBUG, message, args, false);
    }

    /**
     * 打印 INFO 级别日志（青色）。
     *
     * @param message 日志消息，支持 {@code {}} 占位符
     * @param args    占位符对应的参数
     */
    public static void info(String message, Object... args) {
        print(CYAN, LEVEL_INFO, message, args, false);
    }

    /**
     * 打印 WARN 级别日志（黄色）。
     *
     * @param message 日志消息，支持 {@code {}} 占位符
     * @param args    占位符对应的参数
     */
    public static void warn(String message, Object... args) {
        print(YELLOW, LEVEL_WARN, message, args, true);
    }

    /**
     * 打印 ERROR 级别日志（红色）。
     *
     * @param message 日志消息，支持 {@code {}} 占位符
     * @param args    占位符对应的参数
     */
    public static void error(String message, Object... args) {
        print(RED, LEVEL_ERROR, message, args, true);
    }

    /**
     * 打印 ERROR 级别日志（红色），并附异常堆栈。
     *
     * @param message 日志消息
     * @param t       异常对象
     */
    public static void error(String message, Throwable t) {
        print(RED, LEVEL_ERROR, message, null, true);
        if (t != null) {
            t.printStackTrace(System.err);
        }
    }

    /**
     * 打印成功日志（绿色加粗）。
     *
     * @param message 日志消息，支持 {@code {}} 占位符
     * @param args    占位符对应的参数
     */
    public static void ok(String message, Object... args) {
        print(GREEN + BOLD, LEVEL_OK, message, args, false);
    }

    /**
     * 使用自定义颜色打印日志。
     * <p>颜色码可直接使用本类中的常量，如 {@link #GREEN}、{@link #RED}。</p>
     *
     * @param color   ANSI 颜色码
     * @param message 日志消息，支持 {@code {}} 占位符
     * @param args    占位符对应的参数
     */
    public static void custom(String color, String message, Object... args) {
        print(color, "CUSTOM", message, args, false);
    }

    /**
     * 打印一行彩色分割线（青色）。
     *
     * @param text 分割线文字，可为空
     */
    public static void line(String text) {
        String content = text == null ? "" : " " + text + " ";
        int fillLen = Math.max(0, 60 - content.length());
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < fillLen / 2; i++) {
            sb.append('=');
        }
        String half = sb.toString();
        String line = half + content + half + (fillLen % 2 == 1 ? "=" : "");
        System.out.println(wrap(line, CYAN));
    }

    // ===================== 内部方法 =====================

    /**
     * 核心打印方法。
     *
     * @param color   ANSI 颜色码
     * @param level   日志级别标识
     * @param message 日志消息模板
     * @param args    占位符参数
     * @param toError 输出到 System.err
     */
    private static void print(String color, String level, String message, Object[] args, boolean toError) {
        String timestamp = LocalDateTime.now().format(DTF);
        String threadName = Thread.currentThread().getName();
        String content = format(message, args);

        String prefix = String.format("[%s] [%s] [%s] ", timestamp, level, threadName);
        String full = wrap(prefix, color) + wrap(content, GRAY);

        if (toError) {
            System.err.println(full);
        } else {
            System.out.println(full);
        }
    }

    /**
     * SLF4J 风格的占位符替换，将 {@code {}} 按顺序替换为参数值。
     * <p>若参数为 null，替换为字符串 "null"。</p>
     *
     * @param template 消息模板
     * @param args     参数数组
     * @return 替换后的字符串
     */
    private static String format(String template, Object[] args) {
        if (template == null) {
            return "null";
        }
        if (args == null || args.length == 0) {
            return template;
        }
        StringBuilder sb = new StringBuilder(template.length() + 64);
        int argIndex = 0;
        int i = 0;
        while (i < template.length()) {
            char c = template.charAt(i);
            if (c == '{' && i + 1 < template.length() && template.charAt(i + 1) == '}') {
                sb.append(argIndex < args.length ? String.valueOf(args[argIndex]) : "{}");
                argIndex++;
                i += 2;
            } else {
                sb.append(c);
                i++;
            }
        }
        return sb.toString();
    }

    /**
     * 用指定颜色码包裹文本，若未启用彩色则原样返回。
     *
     * @param text  原始文本
     * @param color ANSI 颜色码
     * @return 带颜色码的文本
     */
    private static String wrap(String text, String color) {
        if (enableColor) {
            return color + text + RESET;
        }
        return text;
    }
}