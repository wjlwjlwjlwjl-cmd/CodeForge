package com.wjl.job.domain.vo;

import com.wjl.domain.domain.vo.BasePageVO;
import lombok.Data;

@Data
public class SubmitHistoryVO extends BasePageVO<SubmitVO> {
    public boolean has = true;
}
