package com.wjl.friend.controller.user;

import com.wjl.constants.SecurityConstants;
import com.wjl.core.domain.R;
import com.wjl.friend.domain.user.vo.UserExamListVO;
import com.wjl.friend.service.user.UserExamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/exam")
public class UserExamController {
    @Autowired
    private UserExamService userExamService;

    @PostMapping("/signUp")
    public R<Void> signUp(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, Long examId){
        userExamService.signUp(token,examId);
        return R.success();
    }

    @GetMapping("/list/mine")
    public R<UserExamListVO> getUserExamList(UserExamListVO dto){
        return null;
    }
}