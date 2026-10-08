package com.wjl.job.service;

import com.wjl.core.enums.ResultCode;
import com.wjl.domain.constants.CommonConstants;
import com.wjl.domain.domain.dto.JudgeRequestDTO;
import com.wjl.domain.domain.dto.JudgeResponseDTO;
import com.wjl.domain.domain.dto.LoginUserDTO;
import com.wjl.domain.domain.dto.TestCaseDTO;
import com.wjl.domain.exception.ServiceException;
import com.wjl.job.domain.dto.SubmitInfoDTO;
import com.wjl.job.domain.entity.UserSubmit;
import com.wjl.job.mapper.UserSubmitMapper;
import com.wjl.rabbitmq.utils.RabbitmqUtil;
import com.wjl.security.service.TokenService;
import jakarta.annotation.Nonnull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class JobService {
    @Autowired
    private TokenService tokenService;
    @Autowired
    private RabbitmqUtil rabbitmqUtil;
    @Autowired
    private UserSubmitMapper userSubmitMapper;

    public JudgeResponseDTO handleSubmit(String token, SubmitInfoDTO submitInfoDTO) {
        LoginUserDTO loginUserDTO = tokenService.getCLoginUser(token);
        if(loginUserDTO == null) throw new ServiceException(ResultCode.FAILED_UNAUTHORIZED.getCode(), ResultCode.FAILED_UNAUTHORIZED.getMsg());

        String userId =  loginUserDTO.getUserId();
        Long questionId = submitInfoDTO.getQuestionId();
        Long examId = submitInfoDTO.getExamId();
        String sourceCode = submitInfoDTO.getUserCode();

        submitInfoDTO.setUserId(Long.valueOf(userId));

        //在这里对判题请求信息进行填写
        //在前面接收到判题请求时，user_code、create_by、create_time已插入数据库，
        UserSubmit userSubmit = new UserSubmit();
        userSubmit.setUserId(Long.valueOf(userId));
        userSubmit.setProgramType(0); //已经通过LanguageProfile抽象出了语言配置，但是目前只支持Java
        userSubmit.setQuestionId(questionId);
        userSubmit.setUserCode(sourceCode);
        userSubmit.setCreateBy(Long.valueOf(userId));
        userSubmit.setCreateTime(LocalDateTime.now());
        userSubmitMapper.insert(userSubmit);

        Long submitId = userSubmit.getSubmitId();
        //完成前置信息入库，接下验证 qid 和 eid，从数据库获取，构建判题请求
        JudgeRequestDTO judgeRequestDTO = new JudgeRequestDTO();
        judgeRequestDTO.setSubmitId(submitId);
        judgeRequestDTO.setUserId(Long.valueOf(userId));
        judgeRequestDTO.setExamId(examId);
        judgeRequestDTO.setQuestionId(questionId);
        judgeRequestDTO.setSourceCode(sourceCode);

        //从数据库中获取TestCaseDTO
        List<TestCaseDTO> testCaseDTOS = new ArrayList<>();
        judgeRequestDTO.setTestCases(testCaseDTOS);

        //发送判题消息到判题请求队列
        rabbitmqUtil.sendToExchange(CommonConstants.JUDGE_EXCHANGE, CommonConstants.JAVA_ROUTING_KEY, judgeRequestDTO);
        return null;
    }

    public void buildTest() {
        // ========== 场景 1：两数之和，正常通过 ==========
        SubmitInfoDTO submitInfo1 = createSubmitInfo1();
        List<TestCaseDTO> cases1 = Arrays.asList(
                TestCaseDTO.builder().input("1 2").expectedOutput("3").build(),
                TestCaseDTO.builder().input("-5 7").expectedOutput("2").build(),
                TestCaseDTO.builder().input("0 0").expectedOutput("0").build()
        );
        JudgeRequestDTO request1 = buildJudgeRequest(submitInfo1, cases1);
        rabbitmqUtil.sendToExchange(CommonConstants.JUDGE_EXCHANGE, CommonConstants.JAVA_ROUTING_KEY, request1);

        // ========== 场景 2：答案错误（输出与预期不符） ==========
        SubmitInfoDTO submitInfo2 = new SubmitInfoDTO();
        submitInfo2.setUserId(1L);
        submitInfo2.setQuestionId(2002L);
        submitInfo2.setUserCode(
                "import java.util.*;\n" +
                        "public class Main {\n" +
                        "    public static void main(String[] args) {\n" +
                        "        Scanner sc = new Scanner(System.in);\n" +
                        "        int a = sc.nextInt(), b = sc.nextInt();\n" +
                        "        System.out.println(a - b);\n" +
                        "    }\n" +
                        "}"
        );
        List<TestCaseDTO> cases2 = Collections.singletonList(
                TestCaseDTO.builder().input("5 3").expectedOutput("8").build()
        );
        JudgeRequestDTO request2 = buildJudgeRequest(submitInfo2, cases2);
        rabbitmqUtil.sendToExchange(CommonConstants.JUDGE_EXCHANGE, CommonConstants.JAVA_ROUTING_KEY, request2);

        // ========== 场景 3：编译错误 ==========
        SubmitInfoDTO submitInfo3 = new SubmitInfoDTO();
        submitInfo3.setUserId(1L);
        submitInfo3.setQuestionId(2003L);
        submitInfo3.setUserCode(
                "public class Main {\n" +
                        "    public static void main(String[] args) {\n" +
                        "        System.out.println(undefinedVariable);\n" +
                        "    }\n" +
                        "}"
        );
        List<TestCaseDTO> cases3 = Collections.singletonList(
                TestCaseDTO.builder().input("1").expectedOutput("1").build()
        );
        JudgeRequestDTO request3 = buildJudgeRequest(submitInfo3, cases3);
        rabbitmqUtil.sendToExchange(CommonConstants.JUDGE_EXCHANGE, CommonConstants.JAVA_ROUTING_KEY, request3);

        // ========== 场景 4：超时（死循环） ==========
        SubmitInfoDTO submitInfo4 = new SubmitInfoDTO();
        submitInfo4.setUserId(1L);
        submitInfo4.setQuestionId(2004L);
        submitInfo4.setUserCode(
                "public class Main {\n" +
                        "    public static void main(String[] args) {\n" +
                        "        while (true) {}\n" +
                        "    }\n" +
                        "}"
        );
        List<TestCaseDTO> cases4 = Collections.singletonList(
                TestCaseDTO.builder().input("1").expectedOutput("1").build()
        );
        JudgeRequestDTO request4 = buildJudgeRequest(submitInfo4, cases4);
        rabbitmqUtil.sendToExchange(CommonConstants.JUDGE_EXCHANGE, CommonConstants.JAVA_ROUTING_KEY, request4);

        // ========== 场景 5：运行时报错（数组越界） ==========
        SubmitInfoDTO submitInfo5 = new SubmitInfoDTO();
        submitInfo5.setUserId(1L);
        submitInfo5.setQuestionId(2005L);
        submitInfo5.setUserCode(
                "public class Main {\n" +
                        "    public static void main(String[] args) {\n" +
                        "        int[] arr = new int[1];\n" +
                        "        System.out.println(arr[10]);\n" +
                        "    }\n" +
                        "}"
        );
        List<TestCaseDTO> cases5 = Collections.singletonList(
                TestCaseDTO.builder().input("1").expectedOutput("1").build()
        );
        JudgeRequestDTO request5 = buildJudgeRequest(submitInfo5, cases5);
        rabbitmqUtil.sendToExchange(CommonConstants.JUDGE_EXCHANGE, CommonConstants.JAVA_ROUTING_KEY, request5);

        // ========== 场景 6：内存超限（申请超大数组） ==========
        SubmitInfoDTO submitInfo6 = new SubmitInfoDTO();
        submitInfo6.setUserId(1L);
        submitInfo6.setQuestionId(2006L);
        submitInfo6.setUserCode(
                "public class Main {\n" +
                        "    public static void main(String[] args) {\n" +
                        "        int[] arr = new int[Integer.MAX_VALUE / 2];\n" +
                        "        System.out.println(arr.length);\n" +
                        "    }\n" +
                        "}"
        );
        List<TestCaseDTO> cases6 = Collections.singletonList(
                TestCaseDTO.builder().input("1").expectedOutput("0").build()
        );
        JudgeRequestDTO request6 = buildJudgeRequest(submitInfo6, cases6);
        rabbitmqUtil.sendToExchange(CommonConstants.JUDGE_EXCHANGE, CommonConstants.JAVA_ROUTING_KEY, request6);

        // ========== 场景 7：多测试用例部分通过 ==========
        SubmitInfoDTO submitInfo7 = new SubmitInfoDTO();
        submitInfo7.setUserId(1L);
        submitInfo7.setQuestionId(2007L);
        submitInfo7.setUserCode(
                "import java.util.*;\n" +
                        "public class Main {\n" +
                        "    public static void main(String[] args) {\n" +
                        "        Scanner sc = new Scanner(System.in);\n" +
                        "        int n = sc.nextInt();\n" +
                        "        if (n == 3) System.out.println(\"yes\");\n" +
                        "        else System.out.println(\"no\");\n" +
                        "    }\n" +
                        "}"
        );
        List<TestCaseDTO> cases7 = Arrays.asList(
                TestCaseDTO.builder().input("3").expectedOutput("yes").build(),
                TestCaseDTO.builder().input("5").expectedOutput("yes").build()
        );
        JudgeRequestDTO request7 = buildJudgeRequest(submitInfo7, cases7);
        rabbitmqUtil.sendToExchange(CommonConstants.JUDGE_EXCHANGE, CommonConstants.JAVA_ROUTING_KEY, request7);

        // ========== 场景 8：无实际输入但输出正确 ==========
        SubmitInfoDTO submitInfo8 = new SubmitInfoDTO();
        submitInfo8.setUserId(1L);
        submitInfo8.setQuestionId(2008L);
        submitInfo8.setUserCode(
                "public class Main {\n" +
                        "    public static void main(String[] args) {\n" +
                        "        System.out.println(\"hello\");\n" +
                        "    }\n" +
                        "}"
        );
        List<TestCaseDTO> cases8 = Collections.singletonList(
                TestCaseDTO.builder().input("").expectedOutput("hello").build()
        );
        JudgeRequestDTO request8 = buildJudgeRequest(submitInfo8, cases8);
        rabbitmqUtil.sendToExchange(CommonConstants.JUDGE_EXCHANGE, CommonConstants.JAVA_ROUTING_KEY, request8);

        // ========== 场景 9：输出格式错误（多空格） ==========
        SubmitInfoDTO submitInfo9 = new SubmitInfoDTO();
        submitInfo9.setUserId(1L);
        submitInfo9.setQuestionId(2009L);
        submitInfo9.setUserCode(
                "public class Main {\n" +
                        "    public static void main(String[] args) {\n" +
                        "        System.out.println(\"1  2\");\n" +
                        "    }\n" +
                        "}"
        );
        List<TestCaseDTO> cases9 = Collections.singletonList(
                TestCaseDTO.builder().input("").expectedOutput("1 2").build()
        );
        JudgeRequestDTO request9 = buildJudgeRequest(submitInfo9, cases9);
        rabbitmqUtil.sendToExchange(CommonConstants.JUDGE_EXCHANGE, CommonConstants.JAVA_ROUTING_KEY, request9);

        // ========== 场景 10：同一题目重复提交（对比结果） ==========
        SubmitInfoDTO submitInfo10a = new SubmitInfoDTO();
        submitInfo10a.setUserId(1L);
        submitInfo10a.setQuestionId(2010L);
        submitInfo10a.setUserCode(
                "public class Main {\n" +
                        "    public static void main(String[] args) {\n" +
                        "        System.out.println(\"correct\");\n" +
                        "    }\n" +
                        "}"
        );
        SubmitInfoDTO submitInfo10b = new SubmitInfoDTO();
        submitInfo10b.setUserId(1L);
        submitInfo10b.setQuestionId(2010L);
        submitInfo10b.setUserCode(
                "public class Main {\n" +
                        "    public static void main(String[] args) {\n" +
                        "        System.out.println(\"wrong\");\n" +
                        "    }\n" +
                        "}"
        );
        List<TestCaseDTO> cases10 = Collections.singletonList(
                TestCaseDTO.builder().input("").expectedOutput("correct").build()
        );
        JudgeRequestDTO request10a = buildJudgeRequest(submitInfo10a, cases10);
        JudgeRequestDTO request10b = buildJudgeRequest(submitInfo10b, cases10);
        rabbitmqUtil.sendToExchange(CommonConstants.JUDGE_EXCHANGE, CommonConstants.JAVA_ROUTING_KEY, request10a);
        rabbitmqUtil.sendToExchange(CommonConstants.JUDGE_EXCHANGE, CommonConstants.JAVA_ROUTING_KEY, request10b);
    }

    @Nonnull
    private static SubmitInfoDTO createSubmitInfo1() {
        SubmitInfoDTO submitInfo1 = new SubmitInfoDTO();
        submitInfo1.setUserId(1L);
        submitInfo1.setQuestionId(2001L);
        submitInfo1.setExamId(3001L);
        submitInfo1.setUserCode(
                "import java.util.*;\n" +
                        "public class Main {\n" +
                        "    public static void main(String[] args) {\n" +
                        "        Scanner sc = new Scanner(System.in);\n" +
                        "        int a = sc.nextInt(), b = sc.nextInt();\n" +
                        "        System.out.println(a + b);\n" +
                        "    }\n" +
                        "}"
        );
        return submitInfo1;
    }

    private static JudgeRequestDTO buildJudgeRequest(SubmitInfoDTO submitInfo, List<TestCaseDTO> dbTestCases) {
        JudgeRequestDTO request = new JudgeRequestDTO();
        request.setSubmitId(System.currentTimeMillis());
        request.setUserId(submitInfo.getUserId());
        request.setExamId(submitInfo.getExamId());
        request.setQuestionId(submitInfo.getQuestionId());
        request.setSourceCode(submitInfo.getUserCode());
        request.setTestCases(dbTestCases);
        return request;
    }
}
