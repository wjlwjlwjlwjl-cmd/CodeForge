package com.wjl.redis.util;

import com.wjl.constants.CacheConstants;

public class CacheUtil {
    //key 处理
    public static String getQuestionListPageKey(int pageNum){
        return CacheConstants.QUESTION_LIST_PAGE_PREFIX + pageNum;
    }

    public static String getExamListPageKey(int pageNum){
        return CacheConstants.EXAM_LIST_PAGE_PREFIX + pageNum;
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
}
