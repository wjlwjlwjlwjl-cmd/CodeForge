package com.wjl.job.service;

import com.wjl.domain.constants.CommonConstants;
import com.wjl.rabbitmq.utils.RabbitmqUtil;
import com.wjl.security.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JobService {
    @Autowired
    private TokenService tokenService;
    @Autowired
    private RabbitmqUtil rabbitmqUtil;

    public JudgeResponseDTO handleSubmit(String token, JudgeRequestDTO judgeRequestDTO) {
        //LoginUserDTO loginUserDTO = tokenService.getCLoginUser(token);
        //String userId = loginUserDTO.getUserId();
        String userId = "1"; //这里测试中先固定下来
        judgeRequestDTO.setUserId(Long.valueOf(userId));

        //发送判题消息到判题请求队列
        rabbitmqUtil.sendToExchange(CommonConstants.JUDGE_EXCHANGE, CommonConstants.JAVA_ROUTING_KEY, judgeRequestDTO);
        return null;
    }

    public void testJudge() {
        JudgeResponseDTO judgeResponseDTO = null;
        JudgeRequestDTO judgeRequestDTO = null;

        judgeRequestDTO = buildCompileErrorRequest();
        judgeResponseDTO = handleSubmit(null, judgeRequestDTO);
        //printInfo(judgeResponseDTO);

        judgeRequestDTO = buildCompileTimeoutRequest();
        judgeResponseDTO = handleSubmit(null, judgeRequestDTO);
        //printInfo(judgeResponseDTO);

        judgeRequestDTO = buildBasicRequest();
        judgeResponseDTO = handleSubmit(null, judgeRequestDTO);
        //printInfo(judgeResponseDTO);

        judgeRequestDTO = buildWrongAnswerRequest();
        judgeResponseDTO = handleSubmit(null, judgeRequestDTO);
        //printInfo(judgeResponseDTO);

        judgeRequestDTO = buildRuntimeErrorRequest();
        judgeResponseDTO = handleSubmit(null, judgeRequestDTO);
        //printInfo(judgeResponseDTO);

        judgeRequestDTO = buildTimeLimitRequest();
        judgeResponseDTO = handleSubmit(null, judgeRequestDTO);
        //printInfo(judgeResponseDTO);

        judgeRequestDTO = buildPartialFailRequest();
        judgeResponseDTO = handleSubmit(null, judgeRequestDTO);
        //printInfo(judgeResponseDTO);

        judgeRequestDTO = buildWhitespaceRequest();
        judgeResponseDTO = handleSubmit(null, judgeRequestDTO);
        //printInfo(judgeResponseDTO);

        judgeRequestDTO = buildEmptyInputRequest();
        judgeResponseDTO = handleSubmit(null, judgeRequestDTO);
        //printInfo(judgeResponseDTO);

        judgeRequestDTO = buildLargeOutputRequest();
        judgeResponseDTO = handleSubmit(null, judgeRequestDTO);
        //printInfo(judgeResponseDTO);
    }

    /////// 运行部分用例 ////////
    // 正确运行
    private JudgeRequestDTO buildBasicRequest() {
        JudgeRequestDTO req = new JudgeRequestDTO();
        req.setSubmitId(300001L);
        req.setSourceCode("""
            import java.util.Scanner;

            public class Main {
                public static void main(String[] args) {
                    Scanner sc = new Scanner(System.in);
                    int a = sc.nextInt();
                    int b = sc.nextInt();
                    System.out.println(a + b);
                }
            }
            """);
        req.setTestCases(List.of(
                buildCase("1 2", "3"),
                buildCase("10 20", "30"),
                buildCase("-5 5", "0")
        ));
        return req;
    }

    //运行错误
    private JudgeRequestDTO buildWrongAnswerRequest() {
        JudgeRequestDTO req = new JudgeRequestDTO();
        req.setSubmitId(300002L);
        req.setSourceCode("""
            import java.util.Scanner;

            public class Main {
                public static void main(String[] args) {
                    Scanner sc = new Scanner(System.in);
                    int a = sc.nextInt();
                    int b = sc.nextInt();
                    System.out.println(a - b);   // 故意写成减法
                }
            }
            """);
        req.setTestCases(List.of(
                buildCase("1 2", "3")   // 期望 3，实际 -1
        ));
        return req;
    }

    //运行时异常
    private JudgeRequestDTO buildRuntimeErrorRequest() {
        JudgeRequestDTO req = new JudgeRequestDTO();
        req.setSubmitId(300003L);
        req.setSourceCode("""
            import java.util.Scanner;

            public class Main {
                public static void main(String[] args) {
                    Scanner sc = new Scanner(System.in);
                    int a = sc.nextInt();
                    int b = sc.nextInt();
                    System.out.println(a / b);   // b=0 时抛 ArithmeticException
                }
            }
            """);
        req.setTestCases(List.of(
                buildCase("1 0", "0")   // 除零，抛异常，退出码非 0
        ));
        return req;
    }

    //运行超时
    private JudgeRequestDTO buildTimeLimitRequest() {
        JudgeRequestDTO req = new JudgeRequestDTO();
        req.setSubmitId(300004L);
        req.setSourceCode("""
            public class Main {
                public static void main(String[] args) {
                    while (true) {
                        // 死循环，永远不会结束
                    }
                }
            }
            """);
        req.setTestCases(List.of(
                buildCase("", "anything")
        ));
        return req;
    }

    //部分用例不通过
    private JudgeRequestDTO buildPartialFailRequest() {
        JudgeRequestDTO req = new JudgeRequestDTO();
        req.setSubmitId(300005L);
        req.setSourceCode("""
            import java.util.Scanner;

            public class Main {
                public static void main(String[] args) {
                    Scanner sc = new Scanner(System.in);
                    int a = sc.nextInt();
                    int b = sc.nextInt();
                    System.out.println(a + b);
                }
            }
            """);
        req.setTestCases(List.of(
                buildCase("1 2", "3"),      // 过
                buildCase("10 20", "30"),   // 过
                buildCase("3 4", "8")       // 错，期望 7 写成 8
        ));
        return req;
    }

    //空白字符
    private JudgeRequestDTO buildWhitespaceRequest() {
        JudgeRequestDTO req = new JudgeRequestDTO();
        req.setSubmitId(300006L);
        req.setSourceCode("""
            public class Main {
                public static void main(String[] args) {
                    System.out.println("hello   ");   // 尾部多余空格
                    System.out.println();             // 多余空行
                }
            }
            """);
        req.setTestCases(List.of(
                buildCase("", "hello")
        ));
        return req;
    }

    //输入用例为空
    private JudgeRequestDTO buildEmptyInputRequest() {
        JudgeRequestDTO req = new JudgeRequestDTO();
        req.setSubmitId(300007L);
        req.setSourceCode("""
            public class Main {
                public static void main(String[] args) {
                    System.out.println("no input");
                }
            }
            """);
        req.setTestCases(List.of(
                buildCase("", "no input")
        ));
        return req;
    }

    //大量输出
    private JudgeRequestDTO buildLargeOutputRequest() {
        JudgeRequestDTO req = new JudgeRequestDTO();
        req.setSubmitId(300008L);
        req.setSourceCode("""
            public class Main {
                public static void main(String[] args) {
                    for (int i = 0; i < 100000; i++) {
                        System.out.println(i);
                    }
                }
            }
            """);
        req.setTestCases(List.of(
                buildCase("", "0")   // 期望输出对不上，但重点是别 OOM
        ));
        return req;
    }

    //编译错误用例
    private JudgeRequestDTO buildCompileErrorRequest() {
        String submitId = "438924";

        JudgeRequestDTO request = new JudgeRequestDTO();
        request.setSubmitId(Long.valueOf(submitId));
        request.setSourceCode("""
            public class Main {
                public static void main(String[] args) {
                    int x = 1
                    System.out.println(x);
                }
            }
            """);
        request.setTestCases(List.of(buildTestCase("", "1")));
        return request;
    }

    //编译超时用例
    private JudgeRequestDTO buildCompileTimeoutRequest() {
        String submitId = "839129";

        JudgeRequestDTO request = new JudgeRequestDTO();
        request.setSubmitId(Long.valueOf(submitId));
        request.setSourceCode("""
            public class Main {
                public static void main(String[] args) {
                    System.out.println("hi");
                }
            }
            """);
        request.setTestCases(List.of(buildTestCase("", "hi")));
        return request;
    }

    private static TestCaseDTO buildTestCase(String input, String expectedOutput) {
        TestCaseDTO tc = new TestCaseDTO();
        tc.setInput(input);
        tc.setExpectedOutput(expectedOutput);
        return tc;
    }

    /*private void printInfo(JudgeResponseDTO dto){
        if(dto == null){
            return;
        }
        ColorLog.info("submitId: {}", dto.getSubmitId());
        ColorLog.info("status: {}", dto.getStatus());
        ColorLog.info("compileResult: {}", dto.getCompileResult());
        List<CaseResultDTO> cases = dto.getCaseResults();
        for (CaseResultDTO caseResult : cases) {
            ColorLog.info("caseResult: {}", caseResult);
        }
        System.out.println();
        System.out.println();
    }*/

    private TestCaseDTO buildCase(String input, String expected) {
        TestCaseDTO tc = new TestCaseDTO();
        tc.setInput(input);
        tc.setExpectedOutput(expected);
        return tc;
    }
}
