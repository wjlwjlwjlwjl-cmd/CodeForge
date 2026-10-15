package com.wjl.system.task;

import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.wjl.domain.constants.CacheConstants;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.core.utils.ColorLog;
import com.wjl.redis.service.RedisService;
import com.wjl.system.domain.exam.vo.ExamVO;
import com.wjl.system.entity.exam.Exam;
import com.wjl.system.entity.user.UserExam;
import com.wjl.system.mapper.ExamMapper;
import com.wjl.system.mapper.UserExamMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
public class CompetitionScheduleTask {
    @Autowired
    private ExamMapper examMapper;
    @Autowired
    private RedisService redisService;
    @Autowired
    private UserExamMapper userExamMapper;

    @Scheduled(cron="0 0 0 * * ?") //秒、分、时、日、月、星期，每天0点执行
    public void competitionScheduleTask(){
        ColorLog.info("开始执行竞赛状态更新任务");
        redisService.deleteObject(CacheConstants.EXAM_FINISHED);
        redisService.deleteObject(CacheConstants.EXAM_UNFINISH);
        redisService.deleteObject(CacheConstants.EXAM_UNSTART);

        List<Exam> exams = examMapper.selectList(null);

        for(Exam exam:exams){
            LocalDateTime examStartTime = exam.getStartTime();
            LocalDateTime examEndTime = exam.getEndTime();
            String cacheKey;
            if(LocalDateTime.now().isBefore(examStartTime)){ //竞赛未开始
                cacheKey = CacheConstants.EXAM_UNSTART;
            }
            else if(LocalDateTime.now().isAfter(examStartTime) && LocalDateTime.now().isBefore(examEndTime)){ //竞赛未结束
                cacheKey = CacheConstants.EXAM_UNFINISH;
            }
            else{ //竞赛已经结束
                cacheKey = CacheConstants.EXAM_FINISHED;
            }

            //缓存对象使用 ExamVO
            ExamVO examVO = new ExamVO();
            BeanCopyUtil.copyProperties(exam, examVO);
            if(redisService.hasKey(cacheKey)){
                redisService.rightPushForList(cacheKey, examVO);
            }
            else{
                List<ExamVO> examVOS = new ArrayList<>();
                examVOS.add(examVO);
                redisService.setCacheList(cacheKey, examVOS);
            }
        }
        ColorLog.info("竞赛状态更新任务执行完毕");
    }

    @EventListener(ApplicationReadyEvent.class)
    public void CompetitionInitTask(){
        ColorLog.info("开始执行竞赛状态更新任务");
        redisService.deleteObject(CacheConstants.EXAM_FINISHED);
        redisService.deleteObject(CacheConstants.EXAM_UNFINISH);
        redisService.deleteObject(CacheConstants.EXAM_UNSTART);

        List<Exam> exams = examMapper.selectList(null);

        for(Exam exam:exams){
            LocalDateTime examStartTime = exam.getStartTime();
            LocalDateTime examEndTime = exam.getEndTime();
            String cacheKey;
            if(LocalDateTime.now().isBefore(examStartTime)){ //竞赛未开始
                cacheKey = CacheConstants.EXAM_UNSTART;
            }
            else if(LocalDateTime.now().isAfter(examStartTime) && LocalDateTime.now().isBefore(examEndTime)){ //竞赛未结束
                cacheKey = CacheConstants.EXAM_UNFINISH;
            }
            else{ //竞赛已经结束
                cacheKey = CacheConstants.EXAM_FINISHED;
            }

            //缓存对象使用 ExamVO
            ExamVO examVO = new ExamVO();
            BeanCopyUtil.copyProperties(exam, examVO);
            if(redisService.hasKey(cacheKey)){
                redisService.rightPushForList(cacheKey, examVO);
            }
            else{
                List<ExamVO> examVOS = new ArrayList<>();
                examVOS.add(examVO);
                redisService.setCacheList(cacheKey, examVOS);
            }
        }
        ColorLog.info("竞赛状态更新任务执行完毕");
    }

    @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Shanghai")
    public void persistExamRanksSchedule() {
        //每天零点，进行竞赛排名信息的数据库持久化
        int batchSize = 1000;

        Set<String> keys = redisService.keys("exam:*:rank");
        if (keys == null || keys.isEmpty()) {
            return;
        }

        for (String key : keys) {
            // 2. 分页拉取该竞赛的全部 userId，按排名从高到低
            List<String> userIds = new ArrayList<>();
            int start = 0;
            while (true) {
                Set<String> batch = redisService.getRankList(key, start, batchSize);
                if (batch == null || batch.isEmpty()) {
                    break;
                }
                userIds.addAll(batch);
                if (batch.size() < batchSize) {
                    break;
                }
                start += batchSize;
            }

            if (userIds.isEmpty()) {
                continue;
            }

            // 3. 下标即排名（0-based），按你的业务决定是否 +1
            //    这里从 key 中解析出 examId，便于入库
            //    key 形如 exam:1:rank
            String examId = key.split(":")[1];

            for (int i = 0; i < userIds.size(); i++) {
                String userId = userIds.get(i);
                int rank = i + 1; // 1-based 排名

                userExamMapper.update(new LambdaUpdateWrapper<UserExam>()
                        .eq(UserExam::getUserId, userId)
                        .eq(UserExam::getExamId, examId)
                        .set(UserExam::getExamRank, rank)
                );
            }
        }
        ColorLog.info(true, "定时排名持久化更新完成");
    }

    @EventListener(ApplicationReadyEvent.class)
    public void persistExamRanksInit() {
        //每天零点，进行竞赛排名信息的数据库持久化
        int batchSize = 1000;

        Set<String> keys = redisService.keys("exam:*:rank");
        if (keys == null || keys.isEmpty()) {
            return;
        }

        for (String key : keys) {
            // 2. 分页拉取该竞赛的全部 userId，按排名从高到低
            List<String> userIds = new ArrayList<>();
            int start = 0;
            while (true) {
                Set<String> batch = redisService.getRankList(key, start, batchSize);
                if (batch == null || batch.isEmpty()) {
                    break;
                }
                userIds.addAll(batch);
                if (batch.size() < batchSize) {
                    break;
                }
                start += batchSize;
            }

            if (userIds.isEmpty()) {
                continue;
            }

            // 3. 下标即排名（0-based），按你的业务决定是否 +1
            //    这里从 key 中解析出 examId，便于入库
            //    key 形如 exam:1:rank
            String examId = key.split(":")[1];

            for (int i = 0; i < userIds.size(); i++) {
                String userId = userIds.get(i);
                int rank = i + 1; // 1-based 排名

                userExamMapper.update(new LambdaUpdateWrapper<UserExam>()
                        .eq(UserExam::getUserId, userId)
                        .eq(UserExam::getExamId, examId)
                        .set(UserExam::getExamRank, rank)
                );
            }
        }
        ColorLog.info(true, "启动排名持久化更新完成");
    }
}
