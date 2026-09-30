package com.wjl.friend.service.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.conditions.query.LambdaQueryChainWrapper;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.wjl.constants.CacheConstants;
import com.wjl.constants.CommonConstants;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.domain.dto.LoginUserDTO;
import com.wjl.exception.ServiceException;
import com.wjl.friend.domain.user.dto.UserExamListDTO;
import com.wjl.friend.domain.user.vo.UserExamListVO;
import com.wjl.friend.domain.user.vo.UserExamVO;
import com.wjl.friend.entity.exam.Exam;
import com.wjl.friend.entity.user.UserExam;
import com.wjl.friend.mapper.exam.ExamMapper;
import com.wjl.friend.mapper.user.UserExamMapper;
import com.wjl.redis.service.RedisService;
import com.wjl.redis.util.CacheUtil;
import com.wjl.security.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
        //竞赛报名缓存使用 list
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
        try{
            userExamMapper.insert(userExam);
        }
        catch(DuplicateKeyException e){
            throw new ServiceException(ResultCode.USER_EXAM_HAS_ENTER.getCode(), ResultCode.USER_EXAM_HAS_ENTER.getMsg());
        }

        //处于业务需求，竞赛只要报名后，立刻进行缓存
        String cacheKey = CacheUtil.getUserExamKey(Long.valueOf(userId));
        UserExamVO userExamVO = new UserExamVO();
        BeanCopyUtil.copyProperties(userExam,userExamVO);

        if(redisService.hasKey(cacheKey)){
            redisService.leftPushForList(cacheKey, userExamVO);
        }
        else{
            List<UserExamVO> list = new ArrayList<>();
            list.add(userExamVO);
            redisService.setCacheList(cacheKey, list);
            redisService.expire(cacheKey, CacheConstants.USER_EXAM_EXPIRATION);
        }
    }

    public UserExamListVO getUserExamList(String token, UserExamListDTO dto){
        LoginUserDTO loginUserDTO = tokenService.getCLoginUser(token);

        UserExamListVO userExamListVO = new UserExamListVO();
        Long userId = Long.valueOf(loginUserDTO.getUserId());
        Integer pageNum = dto.getPageNum();
        int pageSize = CommonConstants.PAGE_SIZE;
        String cacheKey =  CacheUtil.getUserExamKey(userId);

        List<UserExamVO> list;
        if(redisService.hasKey(cacheKey)){
             list = redisService.getCacheList(cacheKey, UserExamVO.class);
        }
        else{
            //从数据库获取
            PageHelper.startPage(pageNum, pageSize);

            List<UserExam> tmp = userExamMapper.selectList(new LambdaQueryWrapper<UserExam>()
                    .eq(UserExam::getUserId, userId)
            );
            list = BeanCopyUtil.copyListProperties(tmp, UserExamVO::new);
            redisService.setCacheList(cacheKey, list);
            redisService.expire(cacheKey, CacheConstants.USER_EXAM_EXPIRATION);
        }

        PageInfo<UserExamVO> pageInfo = new PageInfo<>(list);
        userExamListVO.setList(list);
        userExamListVO.setTotal(pageInfo.getTotal());
        userExamListVO.setPageNum(pageNum);
        userExamListVO.setPageSize(pageSize);
        userExamListVO.setPages(pageInfo.getPages());

        return userExamListVO;
    }
}