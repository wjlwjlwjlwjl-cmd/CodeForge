package com.wjl.friend.mapper.question;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wjl.friend.entity.question.Question;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface QuestionMapper extends BaseMapper<Question> {
}