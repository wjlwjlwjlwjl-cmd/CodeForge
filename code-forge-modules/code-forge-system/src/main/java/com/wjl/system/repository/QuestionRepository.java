package com.wjl.system.repository;

import com.wjl.system.document.QuestionDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionRepository extends ElasticsearchRepository<QuestionDocument,Long> {

}
