package com.wjl.redis.config;

import java.text.SimpleDateFormat;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.wjl.constants.CommonConstants;

@Configuration 
public class RedisConfig {
    @Bean(value="sf_redisTemplate")
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory){
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(factory);

        // key 的序列化配置
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        redisTemplate.setHashKeySerializer(new StringRedisSerializer());

        // value 的序列化配置
        GenericJackson2JsonRedisSerializer genericJackson2JsonRedisSerializer = getGenericJackson2JsonRedisSerializer();
        redisTemplate.setValueSerializer(genericJackson2JsonRedisSerializer);
        redisTemplate.setHashValueSerializer(genericJackson2JsonRedisSerializer);
        redisTemplate.afterPropertiesSet();

        return redisTemplate;
    }

    private GenericJackson2JsonRedisSerializer getGenericJackson2JsonRedisSerializer(){
        ObjectMapper mapper = JsonMapper.builder()
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)    //反序列化时，如果Json中出现Java对象不存在的属性时，忽略
        .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)       //序列化时，不要将日期类型序列化为时间戳，而是通过后续配置的方式序列化
        .configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false)             //序列化时，当 Java 对象为空时，不要报错，返回空 Json
        .configure(DeserializationFeature.FAIL_ON_INVALID_SUBTYPE, false)       //，如果 JSON 数据中指定的类型信息与期望的 Java 类型层次结构不匹配，不抛出异常
        .configure(SerializationFeature.WRITE_DATE_KEYS_AS_TIMESTAMPS, false)   //使Map的日期键通过统一指定的方式序列化，不要序列化为默认的时间戳格式
        .configure(MapperFeature.USE_ANNOTATIONS, false)                        //不允许类通过注解更改序列化、反序列化行为，简化配置操作
        .addModule(new JavaTimeModule())                                               //序列化 LocalDateTime 和 LocalDate 的必要方式
        .defaultDateFormat(new SimpleDateFormat(CommonConstants.STANDARD_FORMAT))      //序列化日期类型i时的时间格式
        .serializationInclusion(JsonInclude.Include.NON_NULL)                          //只针对非空的值进行序列化
        .build();

        return new GenericJackson2JsonRedisSerializer(mapper);
    }
}
