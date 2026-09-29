package com.wjl.friend.service.user;

import com.wjl.constants.CacheConstants;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.domain.dto.LoginUserDTO;
import com.wjl.exception.ServiceException;
import com.wjl.friend.domain.user.vo.UserExamVO;
import com.wjl.friend.entity.exam.Exam;
import com.wjl.friend.entity.user.UserExam;
import com.wjl.friend.mapper.exam.ExamMapper;
import com.wjl.friend.mapper.user.UserExamMapper;
import com.wjl.redis.service.RedisService;
import com.wjl.redis.util.CacheUtil;
import com.wjl.security.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
public class UserExamService {
    @Autowired
    private TokenService tokenService;
    @Autowired
    private ExamMapper examMapper;
    @Autowired
    private RedisService redisService;
    @Autowired
    private UserExamMapper userExamMapper;

    public void signUp(String token, Long examId){
        LoginUserDTO loginUserDTO = tokenService.getCLoginUser(token);
        String userId = loginUserDTO.getUserId();

        Exam exam = examMapper.selectById(examId);
        if(exam == null){
            throw new ServiceException(ResultCode.EXAM_NOT_EXISTS.getCode(), ResultCode.EXAM_NOT_EXISTS.getMsg());
        }

        UserExam userExam = new UserExam();
        userExam.setExamId(examId);
        userExam.setUserId(Long.valueOf(userId));
        userExam.setCreateBy(Long.valueOf(userId));
        userExam.setCreateTime(LocalDateTime.now());
        userExamMapper.insert(userExam);

        //处于业务需求，竞赛只要报名后，立刻进行缓存
        String cacheKey = CacheUtil.getUserExamKey(Long.valueOf(userId), examId);
        UserExamVO userExamVO = new UserExamVO();
        BeanCopyUtil.copyProperties(userExam,userExamVO);
        redisService.setCacheObject(cacheKey, userExamVO, CacheConstants.USER_EXAM_EXPIRATION, TimeUnit.MINUTES);
    }


}