package com.wjl.core.utils;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

import org.springframework.beans.BeanUtils;

import lombok.ToString;

@ToString //生成 toString 方法
public class BeanCopyUtil extends BeanUtils{
    public static <S, T> List<T> copyListProperties(List<S> sources, Supplier<T> target) {
        List<T> list = new ArrayList<>(sources.size());
        for (S source : sources) {
            if(source == null) continue;
            T t = target.get();
            if(t == null) continue;
            copyProperties(source, t);
            list.add(t);
        }
        return list;
    }
}
