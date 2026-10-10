package com.wjl.domain.constants;

/**
 * 缓存常量
 */
public class CacheConstants {
    /**
     * 缓存有效期，默认720（分钟），12h
     */
    public final static long EXPIRATION = 720;

    /**
     * 缓存刷新时间，默认120（分钟）
     */
    public final static long REFRESH_TIME = 120;

    /**
     * 验证码缓存前缀
     */
    public final static String VERIFY_PREFIX = "verify:code:";

    /**
     * B 端用户信息前缀
     * 管理员用户：prefix+account
     */
    public final static String USER_INFO_PREFIX = "user:info:";
    public final static long USER_INFO_EXPIRATION = 15; //min

    /**
     * 题目列表分页缓存
     */
    public final static String QUESTION_LIST_PAGE_PREFIX = "question:list:page:";
    public final static long QUESTION_LIST_PAGE_EXPIRATION = 5; //min

    /**
     * 题目信息缓存
     */
    public final static String QUESTION_PREFIX = "question:";
    public final static long QUESTION_EXPIRATION = 30; //min

    /**
     * 竞赛列表缓存
     */
    public final static String EXAM_LIST_PAGE_PREFIX = "exam:list:page:";
    public final static long EXAM_LIST_PAGE_EXPIRATION = 5; //min

    /**
     * 竞赛题目列表分页缓存
     */
    public final static String EXAM_QUESTION_LIST_PAGE_PREFIX = "exam:%d:list:page:%d";
    public final static long EXAM_QUESTION_LIST_PAGE_EXPIRATION = 30;

    /**
     * 竞赛信息缓存
     */
    public final static String EXAM_PREFIX = "exam:";
    public final static long EXAM_EXPIRATION = 30;

    /**
     * C端用户信息缓存
     */
    public final static String USER_INFO_PREFIX_C = "user:info:c:%s";
    public final static long USER_INFO_C_EXPIRATION = 15;

    /**
     * 竞赛报名信息缓存
     */
    public final static String USER_EXAM_PREFIX = "user:%d:exam";
    public final static long USER_EXAM_EXPIRATION = 30;

    /**
     * 竞赛状态缓存
     */
    public final static String EXAM_UNSTART = "exam:unstart"; //还未开始的竞赛
    public final static String EXAM_UNFINISH = "exam:unfinish"; //还未结束的竞赛
    public final static String EXAM_FINISHED = "exam:finished"; //已经结束的竞赛

    /**
     * 提交信息缓存
     */
    public final static String QUES_SUBMIT = "ques:%d:user:%d:submit"; //一个用户一道题目所有的提交（分页）
    public final static String USER_SUBMIT = "user:%d"; //一个用户所有的提交（分页）
    public final static String SUBMIT_DETAIL = "submit:detail:%d"; //一次提交的详细信息

    /**
     * 判题请求间隔
     */
    public final static String SUBMIT_INTERVAL_KEY = "interval:user:%d";
    public final static Long SUBMIT_INTERVAL_SEC = 4L; //s
}