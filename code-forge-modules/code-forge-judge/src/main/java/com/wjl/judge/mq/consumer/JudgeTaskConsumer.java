package com.wjl.judge.mq.consumer;

import com.wjl.domain.constants.CommonConstants;
import com.wjl.core.utils.ColorLog;
import com.wjl.domain.domain.dto.JudgeRequestDTO;
import com.wjl.domain.domain.dto.JudgeResponseDTO;
import com.wjl.judge.enums.LanguageConfigurations;
import com.wjl.judge.service.JudgeService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class JudgeTaskConsumer {
    @Autowired
    private JudgeService judgeService;

    @RabbitListener(queues = CommonConstants.JAVA_QUEUE)
    public void judgeTaskHandler(JudgeRequestDTO judgeRequestDTO) {
        JudgeResponseDTO judgeResponseDTO = judgeService.judge(judgeRequestDTO, LanguageConfigurations.JAVA_PROFILE.getLanguageProfile());
        ColorLog.info(true, "{} 判题完成，结果{}", judgeResponseDTO.getSubmitId(), judgeResponseDTO.getStatus().getMsg());
    }
}
