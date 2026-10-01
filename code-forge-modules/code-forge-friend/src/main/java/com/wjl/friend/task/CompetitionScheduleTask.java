package com.wjl.friend.task;

import com.wjl.constants.CacheConstants;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.core.utils.ColorLog;
import com.wjl.friend.domain.exam.vo.ExamVO;
import com.wjl.friend.entity.exam.Exam;
import com.wjl.friend.mapper.exam.ExamMapper;
import com.wjl.redis.service.RedisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class CompetitionScheduleTask {
    @Autowired
    private ExamMapper examMapper;
    @Autowired
    private RedisService redisService;

    @Scheduled(cron="0 0 0 * * ?") //秒、分、时、日、月、星期，每天0点执行
    public void competitionScheduleTask(){
        ColorLog.info("开始执行竞赛状态更新任务");
        redisService.deleteObject(CacheConstants.EXAM_FINISHED);
        redisService.deleteObject(CacheConstants.EXAM_UNFINISH);

        List<Exam> exams = examMapper.selectList(null);

        for(Exam exam:exams){
            LocalDateTime examStartTime = exam.getStartTime();
            LocalDateTime examEndTime = exam.getEndTime();
            String cacheKey = null;
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
        ColorLog.info("竞赛状态启动更新中...");
        competitionScheduleTask();
    }
}
