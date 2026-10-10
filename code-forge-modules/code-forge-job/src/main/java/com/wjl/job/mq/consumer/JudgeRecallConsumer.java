package com.wjl.job.mq.consumer;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wjl.domain.constants.CommonConstants;
import com.wjl.core.utils.ColorLog;
import com.wjl.domain.domain.dto.CaseResultDTO;
import com.wjl.domain.domain.dto.JudgeResponseDTO;
import com.wjl.domain.enums.JudgeStatus;
import com.wjl.job.entity.UserExam;
import com.wjl.job.entity.UserSubmit;
import com.wjl.job.mapper.UserExamMapper;
import com.wjl.job.mapper.UserSubmitMapper;
import com.wjl.job.ws.WebSocketSessionManager;
import com.wjl.redis.service.RedisService;
import com.wjl.redis.util.CacheUtil;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Component
public class JudgeRecallConsumer {
    @Autowired
    private UserSubmitMapper userSubmitMapper;
    @Autowired
    private UserExamMapper userExamMapper;
    @Autowired
    private WebSocketSessionManager sessionManager;
    @Autowired
    private RedisService redisService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @RabbitListener(queues = CommonConstants.RESULT_QUEUE)
    public void judgeRecallHandler(JudgeResponseDTO dto) {
        ColorLog.info(true, "获取判题结果：{}", dto.toString());

        Long submitId = dto.getSubmitId();
        JudgeStatus status = dto.getStatus();
        String compileResult = dto.getCompileResult();
        List<CaseResultDTO> caseResults = dto.getCaseResults();
        Integer runTime = dto.getRunTime();
        Long examId = dto.getExamId();
        Long userId = dto.getUserId();

        //在前面接收到判题请求时，program_type、question_id、submitId、userId、user_code、create_by、create_time已插入数据库，
        //是否通过 0:compile error 1:未能正常运行 2:超时错误 3:答案错误 4:ac
        //0: stderr, 1: stderr, 2: null, 3: stdout 4: null
        int pass = -1;
        String exeMessage = null;
        if(Objects.equals(status.getStatus(), JudgeStatus.ACCEPTED.getStatus())){
            //通过
            pass = 4;
        }
        else{
            //未通过
            if(Objects.equals(status.getStatus(), JudgeStatus.COMPILE_ERROR.getStatus())){
                //编译错误
                pass = 0;
                exeMessage = compileResult;
            }
            else if(Objects.equals(status.getStatus(), JudgeStatus.RUNTIME_ERROR.getStatus())){
                //运行时错误，将最后一个用例的信息序列化为执行结果
                CaseResultDTO caseResultDTO = caseResults.get(caseResults.size() - 1);
                pass = 1;
                try{
                    exeMessage = objectMapper.writeValueAsString(caseResultDTO);
                }
                catch(IOException e){
                    ColorLog.error("CaseResultDTO 序列化失败{}", e.getMessage());
                    exeMessage = "Runtime Exception...";
                }
            }
            else if(Objects.equals(status.getStatus(), JudgeStatus.TIME_LIMIT_EXCEEDED.getStatus())){
                //超时错误
                pass = 2;
            }
            else if(Objects.equals(status.getStatus(), JudgeStatus.WRONG_ANSWER.getStatus())){
                //答案错误
                CaseResultDTO caseResultDTO = caseResults.get(caseResults.size() - 1);
                pass = 3;
                try{
                    exeMessage = objectMapper.writeValueAsString(caseResultDTO);
                }
                catch(IOException e){
                    ColorLog.error("CaseResultDTO 序列化失败{}", e.getMessage());
                    exeMessage = "Runtime Exception...";
                }
            }
        }

        userSubmitMapper.update(new LambdaUpdateWrapper<UserSubmit>()
                .eq(UserSubmit::getSubmitId, submitId)
                .set(UserSubmit::getExamId, examId)
                .set(UserSubmit::getRunTime, runTime)
                .set(UserSubmit::getPass, pass)
                .set(UserSubmit::getExeMessage, exeMessage)
                .set(UserSubmit::getUpdateBy, 1L)
                .set(UserSubmit::getUpdateTime, LocalDateTime.now())
        );

        if(examId != null){
            // 竞赛计分逻辑
            // 1. score，直接取决于解题数量，即：解题越多，排名越高
            // 2. 罚时，非ac的一律增加罚时，一次加5min，作为score相同时的排序
            if(pass == 4){
                userExamMapper.update(new LambdaUpdateWrapper<UserExam>()
                        .eq(UserExam::getExamId, examId)
                        .setSql("score=score+1")
                );
            }
            else{
                userExamMapper.update(new LambdaUpdateWrapper<UserExam>()
                        .eq(UserExam::getExamId, examId)
                        .setSql("penalty=penalty+5")
                );
            }
        }

        // 更新提交记录缓存：
        //   只有缓存已存在（说明里面是全量列表）才做增量插入；
        //   否则会往 Redis 里造出一个「只有一条」的列表，破坏分页与总数。
        UserSubmit userSubmit = userSubmitMapper.selectById(submitId);
        String cacheKey1 = CacheUtil.getQuesSubmitKey(dto.getQuestionId(), dto.getUserId()); //问题提交记录
        if (redisService.hasKey(cacheKey1)) {
            redisService.leftPushForList(cacheKey1, userSubmit); // 最新记录插到最前，保持时间倒序
        }
        String cacheKey2 = CacheUtil.getUserSubmitKey(dto.getUserId());//用户提交记录
        if (redisService.hasKey(cacheKey2)) {
            redisService.leftPushForList(cacheKey2, userSubmit);
        }

        // 判题结果已落库，提交详情缓存失效（pass/runTime 已变化）
        redisService.deleteObject(CacheUtil.getSubmitDetail(submitId));

        //完成结果落库后，进行websocket结果推送
        try{
            String msg = objectMapper.writeValueAsString(dto);
            sessionManager.sendMessage(String.valueOf(userId), msg);
        }
        catch(IOException e){
            ColorLog.error("{} JudgeResponseDTO 序列化失败: {}", submitId, e.getMessage());
        }
    }
}
