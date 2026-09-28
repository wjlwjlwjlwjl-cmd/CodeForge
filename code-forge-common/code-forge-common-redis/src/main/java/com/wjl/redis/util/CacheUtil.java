package com.wjl.redis.util;

import com.wjl.constants.CacheConstants;

public class CacheUtil {
    //key 处理
    public static String getQuestionListPageKey(int pageNum){
        return CacheConstants.QUESTION_LIST_PAGE_PREFIX + pageNum + ":";
    }
}
