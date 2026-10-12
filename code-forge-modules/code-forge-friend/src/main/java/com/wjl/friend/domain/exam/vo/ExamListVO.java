package com.wjl.friend.domain.exam.vo;

import lombok.Data;

import java.util.List;

@Data
public class ExamListVO{
    private Integer pageSize;
    private Integer pageNum;
    private Integer total;
    private List<ExamVO> list;
}