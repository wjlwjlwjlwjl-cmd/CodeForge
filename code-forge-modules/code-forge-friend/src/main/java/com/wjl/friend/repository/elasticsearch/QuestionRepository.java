package com.wjl.friend.repository.elasticsearch;

import com.wjl.friend.entity.elasticsearch.QuestionDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface QuestionRepository extends ElasticsearchRepository<QuestionDocument, Long> {
}
