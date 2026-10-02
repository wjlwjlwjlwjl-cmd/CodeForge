package com.wjl.friend.entity.elasticsearch;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Document(
        indexName="oj_question", //这里交给 springboot 创建索引
        createIndex = true
)
public class QuestionDocument {
    /**
     * ES 文档Id，拿到后去检索 Redis 缓存或者数据库
     */
    @Id
    private Long id;

    /**
     * 标题，倒排索引
     */
    @Field(
            type = FieldType.Text,
            analyzer = "smartcn"
    )
    private String title;

    /**
     * 正文，倒排索引
     */
    @Field(
            type = FieldType.Text,
            analyzer = "smartcn"
    )
    private String content;

    /**
     * 难度，标签
     */
    @Field(
            type = FieldType.Integer
    )
    private Integer difficulty;
}
