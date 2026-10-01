package com.wjl.friend.controller.user;

import com.wjl.constants.SecurityConstants;
import com.wjl.core.domain.R;
import com.wjl.friend.domain.user.dto.UserExamListDTO;
import com.wjl.friend.domain.user.vo.UserExamListVO;
import com.wjl.friend.service.user.UserExamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@Tag(name="C端用户竞赛操作")
@RequestMapping("/user/exam")
public class UserExamController {
    @Autowired
    private UserExamService userExamService;

    @PostMapping("/signUp")
    public R<Void> signUp(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, Long examId){
        userExamService.signUp(token,examId);
        return R.success();
    }

    @GetMapping("/list/mine")
    @Operation(description = "获取用户报名的所有竞赛")
    public R<UserExamListVO> getUserExamList(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, UserExamListDTO dto){
        return R.success(userExamService.getUserExamList(token, dto));
    }
}