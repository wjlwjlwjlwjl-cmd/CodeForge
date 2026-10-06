package com.wjl.friend.service.question;

import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType;
import com.wjl.domain.constants.CacheConstants;
import com.wjl.domain.constants.CommonConstants;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.core.utils.ColorLog;
import com.wjl.friend.domain.question.dto.QuestionSearchDTO;
import com.wjl.friend.domain.question.vo.ListQuestionVO;
import com.wjl.friend.domain.question.vo.QuestionVO;
import com.wjl.friend.entity.elasticsearch.QuestionDocument;
import com.wjl.friend.entity.question.Question;
import com.wjl.friend.mapper.question.QuestionMapper;
import com.wjl.redis.service.RedisService;
import com.wjl.redis.util.CacheUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.FetchSourceFilter;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

@Service
public class QuestionService {
    private static final float MIN_SCORE = 0.5F;
    private static final Duration ES_QUERY_TIMEOUT = Duration.ofSeconds(3);
    @Autowired
    private QuestionMapper questionMapper;

    @Autowired
    private ElasticsearchOperations elasticsearchOperations;

    @Autowired
    private RedisService redisService;


    public ListQuestionVO getQuestionListByES(QuestionSearchDTO dto) {
        ListQuestionVO listQuestionVO = new ListQuestionVO();

        List<Long> idList;
        List<Question> questionList = new ArrayList<>();

        // 每页数量
        int size = CommonConstants.PAGE_SIZE;

        // Spring Data Elasticsearch 的 PageRequest 是从 0 开始
        int pageNum = dto.getPageNum();

        String keyword = dto.getKeyword();
        Integer difficulty = dto.getDifficulty();

        BoolQuery.Builder boolQuery = new BoolQuery.Builder();
        if (StringUtils.hasText(keyword)) {
            boolQuery.must(
                    Query.of(q -> q.multiMatch(m -> m
                            .query(keyword)
                            .fields(
                                    "title^3",
                                    "content"
                            )
                            .type(TextQueryType.BestFields)
                    ))
            );
        }

        if (difficulty != null) {
            boolQuery.filter(
                    Query.of(q -> q.term(t -> t
                            .field("difficulty")
                            .value(difficulty)
                    ))
            );
        }

        BoolQuery bool = boolQuery.build();
        long total = 0L;

        if (bool.must().isEmpty() && bool.filter().isEmpty()) {
            idList = List.of();
        } else {
            NativeQuery query = NativeQuery.builder()
                    .withQuery(
                            Query.of(q -> q.bool(bool))
                    )
                    .withPageable(
                            PageRequest.of(pageNum - 1, size)
                    )
                    .withSourceFilter(
                            new FetchSourceFilter(
                                    new String[]{},
                                    null
                            )
                    )
                    .withTimeout(
                            ES_QUERY_TIMEOUT
                    )
                    .withMinScore(
                            MIN_SCORE
                    )
                    .build();

            SearchHits<QuestionDocument> searchHits =
                    elasticsearchOperations.search(
                            query,
                            QuestionDocument.class
                    );

            total = searchHits.getTotalHits();
            idList = searchHits.getSearchHits()
                    .stream()
                    .map(hit -> {
                        try {
                            return Long.valueOf(hit.getId());
                        } catch (NumberFormatException e) {
                            return null;
                        }
                    })
                    .filter(Objects::nonNull)
                    .toList();
        }
        for (Long qId : idList) {
            String cacheKey = CacheUtil.getQuestionKey(qId);
            Question question;
            if (redisService.hasKey(cacheKey)) {
                question = redisService.getCacheObject(
                        cacheKey,
                        Question.class
                );
            } else {
                question = questionMapper.selectById(qId);
                if (question != null) {

                    redisService.setCacheObject(
                            cacheKey,
                            question,
                            CacheConstants.QUESTION_EXPIRATION,
                            TimeUnit.MINUTES
                    );
                }
            }
            if (question != null) {
                questionList.add(question);
            }
        }

        List<QuestionVO> questionVOS =
                BeanCopyUtil.copyListProperties(
                        questionList,
                        QuestionVO::new
                );

        listQuestionVO.setList(questionVOS);
        listQuestionVO.setPageNum(pageNum);
        listQuestionVO.setPageSize(size);
        listQuestionVO.setTotal(total);

        //24 / 10 + 1
        int pages = (int)(total / size + (total % size == 0 ? 0 : 1));
        listQuestionVO.setPages(pages);
        ColorLog.info("total: {}, pageNum: {}, size: {}, pages: {}", total, pageNum, size, pages);
        return listQuestionVO;
    }
}
