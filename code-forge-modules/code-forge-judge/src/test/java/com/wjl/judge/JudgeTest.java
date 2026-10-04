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

@SpringBootTest
public class JudgeTest {
    @Autowired
    private JudgeService judgeService;

    @Test
    public void testJudge() {
        JudgeResponseDTO judgeResponseDTO = null;

        JudgeRequestDTO judgeRequestDTO = buildValidRequest();
        judgeResponseDTO = judgeService.judge(judgeRequestDTO);
        printInfo(judgeResponseDTO);

    }

    private JudgeRequestDTO buildValidRequest() {
        JudgeRequestDTO request = new JudgeRequestDTO();
        request.setSubmitId(100234L);
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
