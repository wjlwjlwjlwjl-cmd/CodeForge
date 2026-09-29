package com.wjl.friend.controller.exam;

import com.wjl.constants.CommonConstants;
import com.wjl.constants.SecurityConstants;
import com.wjl.core.domain.R;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/exam")
public class UserExamController {
    public R<Void> signUp(@RequestHeader(SecurityConstants.AUTHENTICATION) String token, Long examId){
        return null;
    }
}