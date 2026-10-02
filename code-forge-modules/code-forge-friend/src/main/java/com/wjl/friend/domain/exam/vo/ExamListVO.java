package com.wjl.friend.domain.exam.vo;

import lombok.Data;

import java.util.List;

@Data
public class ExamListVO{
    private Integer pageSize;
    private Integer pageNum;
    private List<ExamVO> list;
}