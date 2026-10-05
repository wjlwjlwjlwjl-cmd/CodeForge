package com.wjl.judge;

import com.wjl.constants.CommonConstants;
import com.wjl.core.utils.ColorLog;
import com.wjl.judge.domain.dto.CaseResultDTO;
import com.wjl.judge.domain.dto.JudgeRequestDTO;
import com.wjl.judge.domain.dto.JudgeResponseDTO;
import com.wjl.judge.domain.dto.TestCaseDTO;
import com.wjl.judge.enums.LanguageConfigurations;
import com.wjl.judge.service.JudgeService;
import com.wjl.rabbitmq.utils.RabbitmqUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Random;

@SpringBootTest(
        properties = {
                "nacos.username=nacos",
                "nacos.password=nacos"
        }
)
public class JudgeTest {
    @Autowired
    private JudgeService judgeService;
    private final Random random = new Random();
    @Autowired
    private RabbitmqUtil rabbitmqUtil;

    @Test
    public void testPublish(){
        String msg = "Hello World";
        rabbitmqUtil.sendToExchange(CommonConstants.EXCHANGE_NAME, CommonConstants.JAVA_ROUTING_KEY, msg);
    }

    @Test
    public void testJudge() {
        JudgeResponseDTO judgeResponseDTO = null;
        JudgeRequestDTO judgeRequestDTO = null;

        ColorLog.info("验证编译错误");
        judgeRequestDTO = buildCompileErrorRequest();
        judgeResponseDTO = judgeService.judge(judgeRequestDTO, LanguageConfigurations.JAVA_PROFILE.getLanguageProfile());
        printInfo(judgeResponseDTO, judgeRequestDTO.getSubmitId());

        ColorLog.info("验证编译超时");
        judgeRequestDTO = buildCompileTimeoutRequest();
        judgeResponseDTO = judgeService.judge(judgeRequestDTO, LanguageConfigurations.JAVA_PROFILE.getLanguageProfile());
        printInfo(judgeResponseDTO, judgeRequestDTO.getSubmitId());

        ColorLog.info("验证运行通过");
        judgeRequestDTO = buildBasicRequest();
        judgeResponseDTO = judgeService.judge(judgeRequestDTO, LanguageConfigurations.JAVA_PROFILE.getLanguageProfile());
        printInfo(judgeResponseDTO, judgeRequestDTO.getSubmitId());

        ColorLog.info("验证用例答案不匹配");
        judgeRequestDTO = buildWrongAnswerRequest();
        judgeResponseDTO = judgeService.judge(judgeRequestDTO, LanguageConfigurations.JAVA_PROFILE.getLanguageProfile());
        printInfo(judgeResponseDTO, judgeRequestDTO.getSubmitId());

        ColorLog.info("验证运行时错误");
        judgeRequestDTO = buildRuntimeErrorRequest();
        judgeResponseDTO = judgeService.judge(judgeRequestDTO, LanguageConfigurations.JAVA_PROFILE.getLanguageProfile());
        printInfo(judgeResponseDTO, judgeRequestDTO.getSubmitId());

        ColorLog.info("验证超时错误");
        judgeRequestDTO = buildTimeLimitRequest();
        judgeResponseDTO = judgeService.judge(judgeRequestDTO, LanguageConfigurations.JAVA_PROFILE.getLanguageProfile());
        printInfo(judgeResponseDTO, judgeRequestDTO.getSubmitId());

        ColorLog.info("验证部分答案错误");
        judgeRequestDTO = buildPartialFailRequest();
        judgeResponseDTO = judgeService.judge(judgeRequestDTO, LanguageConfigurations.JAVA_PROFILE.getLanguageProfile());
        printInfo(judgeResponseDTO, judgeRequestDTO.getSubmitId());

        ColorLog.info("验证io含空格");
        judgeRequestDTO = buildWhitespaceRequest();
        judgeResponseDTO = judgeService.judge(judgeRequestDTO, LanguageConfigurations.JAVA_PROFILE.getLanguageProfile());
        printInfo(judgeResponseDTO, judgeRequestDTO.getSubmitId());

        ColorLog.info("验证输入为空");
        judgeRequestDTO = buildEmptyInputRequest();
        judgeResponseDTO = judgeService.judge(judgeRequestDTO, LanguageConfigurations.JAVA_PROFILE.getLanguageProfile());
        printInfo(judgeResponseDTO, judgeRequestDTO.getSubmitId());

        ColorLog.info("验证恶意输出");
        judgeRequestDTO = buildLargeOutputRequest();
        judgeResponseDTO = judgeService.judge(judgeRequestDTO, LanguageConfigurations.JAVA_PROFILE.getLanguageProfile());
        printInfo(judgeResponseDTO, judgeRequestDTO.getSubmitId());
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
        String submitId = String.format("%06d", random.nextInt(100_0000));

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
        String submitId = String.format("%06d", random.nextInt(100_0000));

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

    private void printInfo(JudgeResponseDTO dto, Long submitId){
        ColorLog.info("submitId: {}", submitId);
        ColorLog.info("status: {}", dto.getStatus());
        ColorLog.info("compileResult: {}", dto.getCompileResult());
        List<CaseResultDTO> cases = dto.getCaseResults();
        for (CaseResultDTO caseResult : cases) {
            ColorLog.info("caseResult: {}", caseResult);
        }
        System.out.println();
        System.out.println();
    }

    private TestCaseDTO buildCase(String input, String expected) {
        TestCaseDTO tc = new TestCaseDTO();
        tc.setInput(input);
        tc.setExpectedOutput(expected);
        return tc;
    }
}
