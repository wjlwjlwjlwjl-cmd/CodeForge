package com.wjl.redis.service;

import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.Set;
import java.util.Map;
import java.util.Objects;
import java.util.function.Consumer;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.*;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;
import com.wjl.core.utils.JsonUtil;

import lombok.extern.slf4j.Slf4j;

@Component
@SuppressWarnings({"unchecked", "rawtypes", "null"})
@Slf4j
public class RedisService {
    @Autowired
    @Qualifier(value="sf_redisTemplate")
    RedisTemplate redisTemplate;

    //*************** */
    // 键值对操作
    //*************** */

    /**
     * 设置键值对过期时间（默认时间颗粒度秒）
     * 
     * @param key       键
     * @param timeout   值
     * @return          是否成功设置键值对
     */
    public boolean expire(final String key, final long timeout){
        return redisTemplate.expire(key, timeout, TimeUnit.SECONDS);
    }

    /**
     * 设置键值对过期时间（指定时间颗粒度）
     * 
     * @param key       键
     * @param timeout   值
     * @param unit      时间颗粒度
     * @return          是否成功设置键值对
     */
    public boolean expire(final String key, final long timeout, TimeUnit unit){
        return redisTemplate.expire(key, timeout, unit);
    }

    /**
     * 获取过期时间
     * 
     * @param key   键值对主键
     * @return      过期时间
     */
    public long getExpire(final String key){
        return redisTemplate.getExpire(key);
    }

    /**
     * 检查是否存在某个键值对
     * 
     * @param key   键值对主键
     * @return      是否存在
     */
    public boolean hasKey(final String key){
        return redisTemplate.hasKey(key);
    }

    /**
     * 根据匹配规则查询所有 key
     * 
     * @param patteString   匹配规则
     * @return              匹配到的键值对主键
     */
    public Collection<String> keys(final String patteString){
        return redisTemplate.keys(patteString);
    }

    /**
     * 渐进式遍历
     *
     * @param pattern 匹配规则
     * @param count 一次遍历的数量
     * @param consumer 对遍历结果的处理方法
     */
    public void scan(final String pattern, final int count, final Consumer<String> consumer){
        if(consumer == null){
            return;
        }

        ScanOptions options = ScanOptions.scanOptions()
                .count(count)
                .match(pattern)
                .build();

        redisTemplate.execute((RedisCallback<Void>) connection -> {
            try(Cursor<byte[]> cursor = connection.keyCommands().scan(options)){
                while(cursor.hasNext()){
                    String key = new String(cursor.next(), StandardCharsets.UTF_8);
                    consumer.accept(key);
                }
            }
            catch(Exception e){
                System.out.println(e.getMessage());
            }
            return null;
        });
    }

    /**
     * 重命名键值对
     * 
     * @param oldName   旧名
     * @param newName   新名
     */
    public void renameKey(final String oldName, final String newName){
        redisTemplate.rename(oldName, newName);
    }    

    /**
     * 删除单个键值对
     * 
     * @param key 键值对主键
     * @return    删除结果
     */
    public boolean deleteObject(final String key){
        return redisTemplate.delete(key);
    }

    /**
     * 删除多个键值对
     * 
     * @param keys
     * @return
     */
    public boolean deleteObject(final Collection<String> keys){
        return redisTemplate.delete(keys) > 0;
    }

    //*************** */    
    // String 操作
    //*************** */    

    /**
     * 将 obj 序列化为 Json 存储进 redis
     * 
     * @param <T>   缓存对象类型
     * @param key   缓存对象对应主键
     * @param obj   缓存对象
     */
    public <T> void setCacheObject(final String key, T obj){
        redisTemplate.opsForValue().set(key, obj);
    }

    /**
     * 将 obj 序列化为 Json 存储进 Redis，同时指定过期时间与时间颗粒度
     * 
     * @param <T>       缓存对象类型
     * @param key       缓存对象对应主键
     * @param obj       缓存对象
     * @param timeout   过期时间
     * @param unit      时间颗粒度
     */
    public <T> void setCacheObject(final String key, T obj, long timeout, TimeUnit unit){
        redisTemplate.opsForValue().set(key, obj, timeout, unit);
    }

    /**
     * 如果对应 key 不存在，则将 obj 序列化为 Json 存储进 Redis，同时指定过期时间与时间颗粒度
     * 
     * @param <T>
     * @param key
     * @param obj
     * @param timeout
     * @param unit
     */
    public <T> void setCacheObjectIfAbsent(final String key, T obj, long timeout, TimeUnit unit){
        redisTemplate.opsForValue().setIfAbsent(key, obj, timeout, unit);
    }

    /**
     * 如果对应 key 不存在，则将 obj 序列化为 Json 存储进 Redis
     * 
     * @param <T>
     * @param key
     * @param obj
     */
    public <T> void setCacheObjectIfAbsent(final String key, T obj){
        redisTemplate.opsForValue().setIfAbsent(key, obj);
    }

    /**
     * 获取 key 对应的缓存对象
     * 
     * @param <T>   缓存对象类型
     * @param key   键值对键
     * @param clazz 缓存对象类对象（缓存对象需要设置默认构造方法，直接使用 @AllArgsConstructor 和 @NoArgsConstructor 即可
     * @return      获得的缓存对象
     */
    public <T> T getCacheObject(final String key, Class<T> clazz){
        ValueOperations<String, T> operation = redisTemplate.opsForValue();
        Object t = operation.get(key);
        if(t == null){  //解析失败
            return null;
        }
        return JsonUtil.string2Object(JsonUtil.object2String(t), clazz);
    }

    /**
     * 获取 key 对应的缓存对象（支持复杂类型）
     * 
     * @param <T>
     * @param key
     * @param reference
     * @return
     */
    public <T> T getCacheObject(final String key, TypeReference<T> reference){
        ValueOperations valueOperations = redisTemplate.opsForValue();
        Object o = valueOperations.get(key);
        if(o == null) return null;
        return JsonUtil.string2Object(JsonUtil.object2String(o), reference);
    }

    //************** */
    // list 操作
    //************** */
    
    /**
     * 缓存 list 数据
     * 
     * @param <T>       list 元素类型
     * @param key       list 键值
     * @param dataList  list 对象
     * @return          添加元素后 list 长度
     */
    public <T> long setCacheList(final String key, final List<T> dataList){
        Long count = redisTemplate.opsForList().rightPushAll(key, dataList);
        return count == null ? 0 : count;
    }

    /**
     * 从左侧插入单个对象（头插）
     * 
     * @param <T>   添加元素类型
     * @param key   list 键值
     * @param value 添加元素
     */
    public <T> void leftPushForList(final String key, final T value){
        redisTemplate.opsForList().leftPush(key, value);
    }

    /**
     * 从右侧插入单个对象（尾插）
     * 
     * @param <T>   添加元素类型
     * @param key   list 键值
     * @param value 添加元素
     */
    public <T> void rightPushForList(final String key, final T value){
        redisTemplate.opsForList().rightPush(key, value);
    }

    /**
     * 删除最左侧元素（头删）
     * 
     * @param key 目标键值
     */
    public void leftPopForList(final String key){
        redisTemplate.opsForList().leftPop(key);
    }

    /**
     * 删除最右侧元素（尾删）
     * 
     * @param key 目标键值
     */
    public void rightPopForList(final String key){
        redisTemplate.opsForList().rightPop(key);
    }

    /**
     * 从列表中移除第一个匹配的元素
     * 
     * @param <T>       移除元素的类型
     * @param key       list 对应的键值
     * @param value     移除元素
     */
    public <T> void removeForList(final String key, T value){
        redisTemplate.opsForList().remove(key, 1L, value);
    }

    /**
     * 从列表中删除所有匹配的元素
     * 
     * @param <T>       移除元素的类型
     * @param key       list 对应的键值
     * @param value     移除的元素
     */
    public <T> void removeAllForList(final String key, T value){
        redisTemplate.opsForList().remove(key, 0, value);
    }

    /**
     * 删除一个 list 中的所有元素（不是删除 list 本身）
     * 
     * @param key list 对应的 key
     */
    public void removeForAllList(final String key){
        redisTemplate.opsForList().trim(key, -1, 0); 
    }

    /**
     * 修改 list 中指定元素
     * 
     * @param <T>   元素类型
     * @param key   list 键值
     * @param index value
     * @param value
     */
    public <T> void setElementAtIndex(final String key, int index, T value){
        redisTemplate.opsForList().set(key, index, value);
    }

    /**
     * 获取整个列表，并指定列表元素类型（简单元素）
     * 
     * @param <T>       列表元素类型
     * @param key       list 键值
     * @param clazz     列表元素类对象
     * @return          获取到的列表
     */
    public <T> List<T> getCacheList(final String key, Class<T> clazz){
        List list = redisTemplate.opsForList().range(key, 0, -1); // Redis 对于列表区间的指定策略是左闭右闭
        return JsonUtil.string2List(JsonUtil.object2String(list), clazz);
    }

    /**
     * 保留列表前 N 项（多余项裁剪）
     * @param key 键
     * @param maxLen 最大保留长度
     */
    public void trimList(final String key, final int maxLen) {
        long end = Math.max(0, maxLen - 1);
        redisTemplate.opsForList().trim(key, 0, end);
    }

    /**
     * 获取整个列表，并指定列表元素类型（复杂类型）
     * 
     * @param <T>           列表元素类型
     * @param key           list 键值
     * @param reference     复杂对象类型
     * @return              获取到的列表
     */
    public <T> List<T> getCacheList(final String key, TypeReference<List<T>> reference){
        List list = redisTemplate.opsForList().range(key, 0, -1);
        return JsonUtil.string2Object(JsonUtil.object2String(list), reference);
    }

    /**
     * 获得[start, end]的子列表
     * 
     * @param <T>       列表元素类型
     * @param key       list 键值 
     * @param start     subList 起始位置
     * @param end       subList 结束位置
     * @param clazz     列表元素类对象
     * @return          获取到的列表
     */
    public <T> List<T> getCacheListByRange(final String key, long start, long end, Class<T> clazz){
        List list = redisTemplate.opsForList().range(key, start, end);
        return JsonUtil.string2List(JsonUtil.object2String(list), clazz);
    }

    /**
     * 获得[start, end]的子列表（复杂类型）
     * 
     * @param <T>       列表元素类型
     * @param key       list 键值
     * @param start     subList 起始位置
     * @param end       subList 结束位置
     * @param reference 列表元素类对象
     * @return          获取到的列表
     */
    public <T> List<T> getCacheListByRange(final String key, long start, long end, TypeReference<List<T>> reference){
        List list = redisTemplate.opsForList().range(key, start, end);
        return JsonUtil.string2Object(JsonUtil.object2String(list), reference);
    }

    /**
     * 获取列表长度
     * 
     * @param key   list 键值
     * @return      list 长度
     */
    public Long getCacheListSize(final String key){
        Long ret = redisTemplate.opsForList().size(key);
        return ret == null ? 0L : ret;
    }

    //************ */
    // Set 类型
    //************ */

    /**
     * 向 Set 中添加一个或多个元素
     * 
     * @param key   Set 键值
     * @param objs  要插入的一个或多个元素
     */
    public void addMember(final String key, Object... objs){
        redisTemplate.opsForSet().add(key, objs);
    }

    /**
     * 从 Set 中移除一个或多个元素
     * 
     * @param key   Set 键值
     * @param objs  要删除的一个或多个元素
     */
    public void deleteMember(final String key, Object... objs){
        redisTemplate.opsForSet().remove(key, objs);
    }

    /**
     * 获取集合中的所有元素（复杂类型）
     * 
     * @param <T>           Set 中单个元素类型
     * @param key           Set 键值
     * @param reference     复杂类型
     * @return              查询得到的 Set
     */
    public <T> Set<T> getCacheSet(final String key, TypeReference<Set<T>> reference){
        Set set = redisTemplate.opsForSet().members(key);
        return JsonUtil.string2Object(JsonUtil.object2String(set), reference);
    }

    //******************* */
    // Zset 类型
    //******************* */

    /**
     * 添加单个元素到 ZSet 中
     * 
     * @param key       Zset 键值
     * @param obj       要添加的元素
     * @param seqNo     seqNo，元素分数
     */
    public void addMemberZSet(final String key, Object obj, double seqNo){
        redisTemplate.opsForZSet().add(key, obj, seqNo);
    }

    /**
     * 删除ZSet中的某个元素
     * 
     * @param key   ZSet 键值
     * @param obj   要移除的对象
     */
    public void delMemberZSet(final String key, Object obj){
        redisTemplate.opsForZSet().remove(key, obj);
    }

    /**
     * 删除分数在 [minScore, maxScore] 区间的 ZSet 中的元素
     * 
     * @param key           Zset 键值
     * @param startScore    起始分数
     * @param endScore      结束分数
     */
    public void removeZSetByScore(final String key, double startScore, double endScore){
        redisTemplate.opsForZSet().removeRangeByScore(key, startScore, endScore);
    }

    /**
     * 获取到某个结合中的所有内容（复杂类型）
     * 
     * @param <T>           单个元素类型
     * @param key           ZSet 键值
     * @param reference     复杂类型
     * @return              获取到的 Set
     */
    public <T> Set<T> getCacheZSet(final String key, TypeReference<LinkedHashSet<T>> reference){
        Set set = redisTemplate.opsForZSet().range(key, 0, -1);
        return JsonUtil.string2Object(JsonUtil.object2String(set), reference);
    }

    /**
     * 逆序获取到某个集合中所有内容（复杂类型）
     * 
     * @param <T>           单个元素类型
     * @param key           ZSet 键值
     * @param reference     复杂类型
     * @return              获取到的 Set
     */
    public <T> Set<T> getCacheZSetReverse(final String key, TypeReference<LinkedHashSet<T>> reference){
        Set set = redisTemplate.opsForZSet().reverseRange(key, 0, -1);
        return JsonUtil.string2Object(JsonUtil.object2String(set), reference);
    }

    //*************** */
    //  Hash 类型
    //*************** */

    /**
     * 将 dataMap 中的所有键值对都作为 Hash 存储进 Redis
     * 
     * @param <T>       键值对值类型
     * @param key       Hash key
     * @param dataMap   承载着所有需要存放的键值对的 Map
     */
    public <T> void setCacheHash(final String key, final Map<String, T> dataMap){
        redisTemplate.opsForHash().putAll(key, dataMap); 
    }

    /**
     * 往 Hash 中增添键值对
     * 
     * @param <T>       键值对值类型
     * @param key       Hash key
     * @param hKey      键值对主键
     * @param value     键值对值
     */
    public <T> void setCacheMapValue(final String key, final String hKey, T value){
        redisTemplate.opsForHash().put(key, hKey, value);
    }

    /**
     * 删除 Hash 中的单个键值对
     * 
     * @param key       Hash key
     * @param hKey      要删除的键值对的 key
     * @return          是否删除成功
     */
    public boolean deleteCacheMapValue(final String key, final String hKey){
        return redisTemplate.opsForHash().delete(key, hKey) > 0;
    }

    /**
     * 获取 Hash 中的所有键值对
     * 
     * @param <T>               键值对值类型
     * @param key               Hash key
     * @param typeReference     Map类型
     * @return                  返回结果
     */
    public <T> Map<String, T> getCacheMap(final String key, TypeReference<Map<String, T>> typeReference){
        Map map = redisTemplate.opsForHash().entries(key);
        return JsonUtil.string2Object(JsonUtil.object2String(map), typeReference);
    }

    /**
     * 获取 Hash 的一个键值对中的值
     * 
     * @param <T>   键值对的值类型
     * @param key   Hash Key
     * @param hKey  键值对键
     * @return      获取结果
     */
    public <T> T getCacheMapValue(final String key, final String hKey){
        HashOperations<String, String, T> operations = redisTemplate.opsForHash();
        return operations.get(key, hKey);
    }

    /**
     * 获取一个 Hash 中的若干键值对
     * 
     * @param <T>           Hash 中值的类型
     * @param key           Hash key
     * @param hKeys         要查询的 Hash 中的key 
     * @param reference     复杂嵌套类型
     * @return              查询结果
     */
    public <T> List<T> getCacheMapMultiValue(final String key, final Collection<String> hKeys, TypeReference<List<T>> reference){
        List list = redisTemplate.opsForHash().multiGet(key, hKeys);
        return JsonUtil.string2Object(JsonUtil.object2String(list), reference);
    }

    /**
     * 引入 Lua 脚本，删除指定值对应的 Redis 中的键值（compare and delete）
     *
     * @param key   缓存key
     * @param value value
     * @return 是否完成了比较并删除
     */
    public boolean cad(String key, String value) {
        if (key.contains(StringUtils.SPACE) || value.contains(StringUtils.SPACE)) {
            return false;
        }
        String script = "if redis.call('get', KEYS[1]) == ARGV[1] then returnredis.call('del', KEYS[1]) else return 0 end";
        // 通过lua脚本原子验证令牌和删除令牌
        Long result = (Long) redisTemplate.execute(new DefaultRedisScript<>(script, Long.class),
                Collections.singletonList(key),
                value);
        return !Objects.equals(result, 0L);
    }
}
