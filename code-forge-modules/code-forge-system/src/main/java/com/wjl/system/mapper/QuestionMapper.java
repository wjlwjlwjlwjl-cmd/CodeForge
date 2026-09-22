package com.wjl.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wjl.system.entity.question.Question;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface QuestionMapper extends BaseMapper<Question> {

}
