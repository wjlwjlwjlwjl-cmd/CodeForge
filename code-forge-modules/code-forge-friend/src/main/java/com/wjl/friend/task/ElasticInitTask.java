package com.wjl.friend.task;

import com.github.pagehelper.PageHelper;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.core.utils.ColorLog;
import com.wjl.friend.entity.elasticsearch.QuestionDocument;
import com.wjl.friend.entity.question.Question;
import com.wjl.friend.mapper.question.QuestionMapper;
import com.wjl.friend.repository.elasticsearch.QuestionRepository;
import org.apache.ibatis.annotations.Mapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * 初始化 ElasticSearch 索引，并导入 MySQL 的题目
 */
@Component
public class ElasticInitTask {
    @Mapper
    private QuestionMapper questionMapper;

    @Autowired
    private QuestionRepository questionRepository;

    //导入 Mysql 数据，索引根据 document 自动建立
    @EventListener(ApplicationReadyEvent.class)
    public void importElasticData(){
        ColorLog.info("开始导入 MySQL 题目数据");
        //题目采取分页的方式导入
        int pageNum = 1;
        int pageSize = 100;
        while (true) {
            PageHelper.startPage(pageNum, pageSize);
            List<Question> questions = questionMapper.selectList(null);

            if(questions == null || questions.isEmpty()){
                break;
            }

            List<QuestionDocument> questionDocuments = BeanCopyUtil.copyListProperties(questions, QuestionDocument::new);
            questionRepository.saveAll(questionDocuments);
            if(questions.size() < pageSize){
                break;
            }
            pageNum++;
        }

        ColorLog.info("MySQL 数据导入完成");
    }
}

/*
  {
    "mappings": {
      "properties": {
        "id": {
          "type": "long"
        },
        "title": {
          "type": "text", 倒排索引
          "analyzer": "smartcn"
        },
        "content": {
          "type": "text", 倒排索引
          "analyzer": "smartcn"
        },
        "difficulty": {
          "type": "integer", 标签过滤
        }
      }
    }
  }

 */