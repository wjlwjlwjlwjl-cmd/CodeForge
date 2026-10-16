package com.wjl.redis.util;

import com.wjl.domain.constants.CacheConstants;

public class CacheUtil {
    //key 处理
    public static String getQuestionListPageKey(int pageNum){
        return CacheConstants.QUESTION_LIST_PAGE_PREFIX + pageNum;
    }

    public static String getQuestionKey(Long qId){
        return CacheConstants.QUESTION_PREFIX + qId;
    }

    public static String getExamListPageKey(int pageNum){
        return CacheConstants.EXAM_LIST_PAGE_PREFIX + pageNum;
    }

    /**
     * 竞赛列表分页缓存 key
     * <p>
     * B 端看全部竞赛、C 端只看已发布，同一页在两种口径下内容不同，
     * 所以 key 必须分开（否则 C 端会拿到含未发布的数据、B 端会拿到被过滤的）。
     * 失效仍用 {@code exam:list:page:*} 前缀扫描，两种 key 都会被覆盖。
     */
    public static String getExamListPageKey(int pageNum, boolean onlyPublished){
        return CacheConstants.EXAM_LIST_PAGE_PREFIX + pageNum + (onlyPublished ? ":pub" : "");
    }

    public static String getExamQuestionListPageKey(int pageNum, long examId){
        return String.format(CacheConstants.EXAM_QUESTION_LIST_PAGE_PREFIX, examId, pageNum);
    }

    public static String getExamKey(Long examId){
        return CacheConstants.EXAM_PREFIX + examId;
    }

    public static String getUserInfoCKey(String userId){
        return String.format(CacheConstants.USER_INFO_PREFIX_C, userId);
    }

    public static String getUserExamKey(Long userId){
        return String.format(CacheConstants.USER_EXAM_PREFIX, userId);
    }

    public static String getQuesSubmitKey(Long questionId, Long userId){
        return String.format(CacheConstants.QUES_SUBMIT, questionId, userId);
    }

    public static String getUserSubmitKey(Long userId){
        return String.format(CacheConstants.USER_SUBMIT, userId);
    }

    public static String getSubmitDetail(Long submitId){
        return String.format(CacheConstants.SUBMIT_DETAIL, submitId);
    }

    public static String getSubmitIntervalKey(Long userId){
        return String.format(CacheConstants.SUBMIT_INTERVAL_KEY, userId);
    }

    public static String getSubmitInfoKey(Long userId){
        return String.format(CacheConstants.USER_SUBMIT_INFO, userId);
    }

    public static String getExamRankKey(Long examId){
        return String.format(CacheConstants.EXAM_RANK, examId);
    }
}
