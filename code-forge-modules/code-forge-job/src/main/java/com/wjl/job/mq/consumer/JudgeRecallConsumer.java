package com.wjl.job.mq.consumer;

import com.wjl.constants.CommonConstants;
import com.wjl.core.utils.ColorLog;
import com.wjl.job.domain.dto.JudgeResponseDTO;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class JudgeRecallConsumer {
    @RabbitListener(queues = CommonConstants.RESULT_QUEUE)
    public void judgeRecallHandler(JudgeResponseDTO dto) {
        //获取到判题结果，交给前端
        ColorLog.info(true, "获取判题结果：{}", dto.toString());
    }
}
