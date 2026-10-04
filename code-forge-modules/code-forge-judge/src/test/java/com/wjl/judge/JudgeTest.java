package com.wjl.judge;

import com.wjl.core.utils.ColorLog;
import com.wjl.judge.domain.dto.JudgeRequestDTO;
import com.wjl.judge.domain.dto.JudgeResponseDTO;
import com.wjl.judge.domain.dto.TestCaseDTO;
import com.wjl.judge.service.JudgeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Random;
import java.util.UUID;

@SpringBootTest
public class JudgeTest {
    @Autowired
    private JudgeService judgeService;
    private final Random random = new Random();

    @Test
    public void testJudge() {
        JudgeResponseDTO judgeResponseDTO = null;
        JudgeRequestDTO judgeRequestDTO = null;

        judgeRequestDTO = buildValidRequest();
        judgeResponseDTO = judgeService.judge(judgeRequestDTO);
        printInfo(judgeResponseDTO);

        judgeRequestDTO = buildCompileErrorRequest();
        judgeResponseDTO = judgeService.judge(judgeRequestDTO);
        printInfo(judgeResponseDTO);
    }

    //编译正常用例
    private JudgeRequestDTO buildValidRequest() {
        String submitId = String.format("%06d", random.nextInt(100_0000));

        JudgeRequestDTO request = new JudgeRequestDTO();
        request.setSubmitId(Long.valueOf(submitId));
        request.setSourceCode("""
            public class Main {
                public static void main(String[] args) {
                    System.out.println("Hello OJ");
                }
            }
            """);
        request.setTestCases(List.of(
                buildTestCase("", "Hello OJ")
        ));
        return request;
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

    private void printInfo(JudgeResponseDTO dto){
        ColorLog.info("===================");
        ColorLog.info("status: {}", dto.getStatus());
        ColorLog.info("compileResult: {}", dto.getCompileResult());
    }
}
