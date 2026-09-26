package com.wjl.core.utils;

public class EmailValidateUtil {
    /**
     * 业务常用邮箱正则校验
     * @param email 待校验邮箱
     * @return true=合法，false=不合法
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        // 正则：用户名@域名
        // 用户名：字母数字 . _ -
        // 域名：多级域名，必须带 . 后缀
        String regex = "^[A-Za-z0-9_-]+(\\.[A-Za-z0-9_-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}$";
        return email.matches(regex);
    }
}
