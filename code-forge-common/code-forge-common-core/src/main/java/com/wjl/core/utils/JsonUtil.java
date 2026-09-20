package com.wjl.core.utils;

import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.wjl.constants.CommonConstants;

import lombok.extern.slf4j.Slf4j;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;

@Slf4j
public class JsonUtil {
    static private ObjectMapper OBJECT_MAPPER;

    static {
    OBJECT_MAPPER =JsonMapper.builder()
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)    //反序列化时，如果Json中出现Java对象不存在的属性时，忽略
        .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)       //序列化时，不要将日期类型序列化为时间戳，而是通过后续配置的方式序列化
        .configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false)             //序列化时，当 Java 对象为空时，不要报错，返回空 Json
        .configure(DeserializationFeature.FAIL_ON_INVALID_SUBTYPE, false)       //，如果 JSON 数据中指定的类型信息与期望的 Java 类型层次结构不匹配，不抛出异常
        .configure(SerializationFeature.WRITE_DATE_KEYS_AS_TIMESTAMPS, false)   //使Map的日期键通过统一指定的方式序列化，不要序列化为默认的时间戳格式
        .configure(MapperFeature.USE_ANNOTATIONS, false)                        //不允许类通过注解更改序列化、反序列化行为，简化配置操作
        .addModule(new JavaTimeModule())                                               //序列化 LocalDateTime 和 LocalDate 的必要方式
        .defaultDateFormat(new SimpleDateFormat(CommonConstants.STANDARD_FORMAT))                
        .serializationInclusion(JsonInclude.Include.NON_NULL)                          //只针对非空的值进行序列化
        .build();
    }

    /**
     * 
     * @param <T> 转换对象类型
     * @param obj 转换对象
     * @return    转换结果
     */
    public static<T> String object2String(T obj){
        if(obj == null){
            return null;
        }
        try{
            return obj instanceof String ? (String) obj : OBJECT_MAPPER.writeValueAsString(obj);
        }
        catch (JsonProcessingException e) {
            log.warn("obj transfer to json fail: {}", e.toString());
            return null;
        }
    }

    /**
     * 
     * @param <T> 转换对象类型
     * @param obj 转换对象
     * @return    返回结果（美化）
     */
    public static<T> String object2StringPretty(T obj){
        if(obj == null){
            return null;
        }
        try{
            return obj instanceof String ? (String)obj : OBJECT_MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(obj);
        }
        catch (JsonProcessingException e) {
            log.warn("obj transfer to json fail: {}", e.toString());
            return null;
        }
    }

    /**
     * 
     * @param <T> 转换结果类型
     * @param str 用来转换的 json 串
     * @param clazz 转换结果类型
     * @return 转换对象
     */
    @SuppressWarnings("unchecked")
    public static<T> T string2Object(String str, Class<T> clazz){
        if(str == null || str.isEmpty() || clazz == null){
            return null;
        }
        try{
            return clazz.equals(String.class) ? (T)str : (T)OBJECT_MAPPER.readValue(str, clazz);
        }
        catch(JsonProcessingException e){
            log.warn("json transfer to obj fail: {}", e.toString());
            return null;
        }
    }

    //**********************
    //为了解决 Java 泛型抹除 
    //**********************

    /**
     * 
     * @param <T> List元素类型
     * @param str 转换的 json 串
     * @param clazz 转换结果类型
     * @return 解析结果
     */
    public static<T> List<T> string2List(String str, Class<T> clazz){
        if(str == null || str.isEmpty() || clazz == null){
            return null;
        }
        JavaType javaType = OBJECT_MAPPER.getTypeFactory().constructParametricType(List.class, clazz);
        try{
            return OBJECT_MAPPER.readValue(str, javaType);
        }
        catch(JsonProcessingException e){
            log.warn("json transfer to List<type> fail: {}", e.toString());
            return null;
        }
    }

    /**
     * 
     * @param <K> Map key 类型
     * @param <V> Map value 类型
     * @param str 解析 Json 串
     * @param k key 类型
     * @param v value 类型
     * @return 解析结果
     */
    public static<K, V> Map<K, V> string2Map(String str, Class<K> k, Class<V> v){
        if(str == null || str.isEmpty() || k == null || v == null){
            return null;
        }
        JavaType javaType = OBJECT_MAPPER.getTypeFactory().constructMapType(Map.class, k, v);
        try{
            return OBJECT_MAPPER.readValue(str, javaType);
        }
        catch(JsonProcessingException e){
            log.warn("json transfer to Map<K, V> fail: {}", e.toString());
            return null;
        }
    }

    /**
     * 
     * @param <T> 嵌套类型
     * @param str 解析 Json
     * @param ref 嵌套类型
     * @return 解析结果
     */
    public static<T> T string2Object(String str, TypeReference<T> ref){ //为了解决多层嵌套泛型的问题
        if(str == null || str.isEmpty() || ref == null){
            return null;
        }
        try{
            return OBJECT_MAPPER.readValue(str, ref);
        }
        catch(JsonProcessingException e){
            log.warn("json transfer to complex-imbeded type fail: {}", e.toString());
            return null;
        }
    }
}
