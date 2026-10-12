package com.wjl.friend.service.user;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.wjl.domain.constants.CacheConstants;
import com.wjl.domain.constants.CommonConstants;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.BeanCopyUtil;
import com.wjl.domain.domain.dto.LoginUserDTO;
import com.wjl.domain.exception.ServiceException;
import com.wjl.friend.domain.exam.dto.ExamListSortByTimeDTO;
import com.wjl.friend.domain.exam.vo.ExamListVO;
import com.wjl.friend.domain.exam.vo.ExamVO;
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
        //竞赛报名缓存使用 list
        LoginUserDTO loginUserDTO = tokenService.getCLoginUser(token);
        String userId = loginUserDTO.getUserId();

        Exam exam = examMapper.selectById(examId); //从数据库中获取竞赛信息
        if(exam == null){ //竞赛不存在
            throw new ServiceException(ResultCode.EXAM_NOT_EXISTS.getCode(), ResultCode.EXAM_NOT_EXISTS.getMsg());
        }

        //时间校验
        LocalDateTime now = LocalDateTime.now();
        if(now.isAfter(exam.getEndTime())){ //竞赛结束，禁止报名
            throw new ServiceException(ResultCode.EXAM_IS_FINISH.getCode(), ResultCode.EXAM_IS_FINISH.getMsg());
        }
        else if(now.isBefore(exam.getStartTime())){ //竞赛未开始，禁止报名
            throw new ServiceException(ResultCode.EXAM_NOT_STARTED.getCode(), ResultCode.EXAM_NOT_STARTED.getMsg());
        }

        UserExam userExam = new UserExam();
        userExam.setExamId(examId);
        userExam.setUserId(Long.valueOf(userId));
        userExam.setCreateBy(Long.valueOf(userId));
        userExam.setCreateTime(LocalDateTime.now());
        try{
            userExamMapper.insert(userExam);
        }
        catch(DuplicateKeyException e){ //用户已经报名（联合唯一键）
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
            redisService.expire(cacheKey, CacheConstants.USER_EXAM_EXPIRATION, TimeUnit.MINUTES);
        }
    }

    public UserExamListVO getUserExamList(String token, UserExamListDTO dto){
        LoginUserDTO loginUserDTO = tokenService.getCLoginUser(token);

        UserExamListVO userExamListVO = new UserExamListVO();
        Long userId = Long.valueOf(loginUserDTO.getUserId());
        Integer pageNum = dto.getPageNum();
        int pageSize = CommonConstants.PAGE_SIZE;
        String cacheKey = CacheUtil.getUserExamKey(userId);

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
            if(tmp.isEmpty()){
                return null;
            }
            list = BeanCopyUtil.copyListProperties(tmp, UserExamVO::new);
            // setCacheList 内部是 rightPushAll（追加），并发时两个请求都判定未命中
            // 会各写一次导致列表出现重复行，所以写入前先删除旧 key（覆盖语义）
            redisService.deleteObject(cacheKey);
            redisService.setCacheList(cacheKey, list);
            redisService.expire(cacheKey, CacheConstants.USER_EXAM_EXPIRATION, TimeUnit.MINUTES);
        }

        PageInfo<UserExamVO> pageInfo = new PageInfo<>(list);
        userExamListVO.setList(list);
        userExamListVO.setTotal(pageInfo.getTotal());
        userExamListVO.setPageNum(pageNum);
        userExamListVO.setPageSize(pageSize);
        userExamListVO.setPages(pageInfo.getPages());

        return userExamListVO;
    }

    public ExamListVO getExamListSortByTime(ExamListSortByTimeDTO dto){
        ExamListVO examListVO = new ExamListVO();

        Integer pageNum = dto.getPageNum();
        Integer pageSize = CommonConstants.PAGE_SIZE;
        Integer option = dto.getOption();
        String cacheKey;
        switch(option){
            case 0:
                cacheKey = CacheConstants.EXAM_UNSTART;
                break;
            case 1:
                cacheKey = CacheConstants.EXAM_UNFINISH;
                break;
            case 2:
                cacheKey = CacheConstants.EXAM_FINISHED;
                break;
            default:
                throw new ServiceException(ResultCode.FAILED_PARAMS_VALIDATE.getCode(), ResultCode.FAILED_PARAMS_VALIDATE.getMsg());
        }
        List<ExamVO> examVOs = redisService.getCacheListByRange(cacheKey, (long) pageSize * (pageNum - 1), (long) pageSize * pageNum - 1, ExamVO.class);

        examListVO.setTotal(Math.toIntExact(redisService.getCacheListSize(cacheKey)));
        examListVO.setList(examVOs);
        examListVO.setPageNum(pageNum);
        examListVO.setPageSize(pageSize);

        return examListVO;
    }
}