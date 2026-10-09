package com.wjl.judge.service;

import com.wjl.domain.constants.CommonConstants;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.ColorLog;
import com.wjl.docker.util.ContainerUtil;
import com.wjl.domain.domain.dto.CaseResultDTO;
import com.wjl.domain.domain.dto.JudgeRequestDTO;
import com.wjl.domain.domain.dto.JudgeResponseDTO;
import com.wjl.domain.domain.dto.TestCaseDTO;
import com.wjl.judge.domain.dto.ContainerExecResultDTO;
import com.wjl.judge.domain.language.LanguageProfile;
import com.wjl.domain.enums.JudgeStatus;
import com.wjl.judge.infrastructure.DockerRunner;
import com.wjl.rabbitmq.utils.RabbitmqUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Component
public class JudgeService {
    @Autowired
    private ContainerUtil containerUtil;
    @Autowired
    private DockerRunner dockerRunner;
    @Autowired
    private RabbitmqUtil rabbitmqUtil;

    public JudgeResponseDTO judge(JudgeRequestDTO dto, LanguageProfile languageProfile) {
        JudgeResponseDTO judgeResponseDTO = new JudgeResponseDTO();
        String checkRet = validate(dto);
        if(checkRet != null){
            judgeResponseDTO.setErrMsg(checkRet);
            return judgeResponseDTO;
        }

        String image = languageProfile.getImage();
        String hostDirTemplate = languageProfile.getHostDir();
        String containerDirTemplate = languageProfile.getContainerDir();
        String containerNameTemplate = languageProfile.getContainerName();
        String sourceFileName = languageProfile.getSourceFileName();
        String compileTemplate = languageProfile.getCompileTemplate();
        String runtimeTemplate = languageProfile.getRuntimeTemplate();
        long compileTimeoutMs = languageProfile.getCompileTimeoutMs();
        long runTimeoutMs = languageProfile.getRunTimeoutMs();
        long runOverheadMs = languageProfile.getRunOverheadMs();

        List<CaseResultDTO> cases = new ArrayList<>();
        judgeResponseDTO.setCaseResults(cases);
        judgeResponseDTO.setSubmitId(dto.getSubmitId());
        judgeResponseDTO.setUserCode(dto.getSourceCode());
        judgeResponseDTO.setUserId(dto.getUserId());
        judgeResponseDTO.setQuestionId(dto.getQuestionId());

        String sourceCode = dto.getSourceCode();
        List<TestCaseDTO> testCases = dto.getTestCases();
        Long submitId = dto.getSubmitId();

        String hostDir = String.format(hostDirTemplate, submitId);
        String containerDir = String.format(containerDirTemplate, submitId);
        String containerName = String.format(containerNameTemplate, submitId);
        String compileCmd = String.format(compileTemplate, submitId);
        String execCmd = String.format(runtimeTemplate, submitId);
        long totalTimeLimit = runTimeoutMs + runOverheadMs;

        //将源代码写入目录
        Path hostDirPath = Paths.get(hostDir);
        Path sourceFilePath = hostDirPath.resolve(sourceFileName);
        try{
            Files.createDirectories(sourceFilePath.getParent());
            Files.writeString(sourceFilePath, sourceCode, StandardCharsets.UTF_8);
        }
        catch(IOException e){
            ColorLog.error("源代码写入目录失败{}",  e.getMessage());
            judgeResponseDTO.setErrMsg(ResultCode.ERROR.getMsg());
            return judgeResponseDTO;
        }

        String containerId = null;
        long startTime = 0L;
        try{
            //创建容器，启动容器，运行命令，收集结果
            containerId = containerUtil.createContainer(hostDir, containerDir, image, containerName);
            if(!containerUtil.startContainer(containerId)){
                judgeResponseDTO.setErrMsg(ResultCode.ERROR.getMsg());
                return judgeResponseDTO;
            }

            ContainerExecResultDTO containerExecResultDTO = dockerRunner.execute(containerId, compileCmd, compileTimeoutMs);

            //编译超时错误
            if(!containerExecResultDTO.getSuccess()){
                judgeResponseDTO.setStatus(JudgeStatus.COMPILE_TIMEOUT);
                judgeResponseDTO.setCompileResult(JudgeStatus.COMPILE_TIMEOUT.getMsg());
                rabbitmqUtil.sendToExchange(CommonConstants.RESULT_EXCHANGE, CommonConstants.RESULT_ROUTING_KEY, judgeResponseDTO);
                return judgeResponseDTO;
            }

            //编译错误
            Long exitCode = containerExecResultDTO.getExitCode();
            if(exitCode == null || exitCode != 0){
                String errMsg = containerExecResultDTO.getStderr();
                judgeResponseDTO.setStatus(JudgeStatus.COMPILE_ERROR);
                judgeResponseDTO.setCompileResult(errMsg);
                rabbitmqUtil.sendToExchange(CommonConstants.RESULT_EXCHANGE, CommonConstants.RESULT_ROUTING_KEY, judgeResponseDTO);
                return judgeResponseDTO;
            }

            //编译成功，开始执行运行逻辑
            startTime = System.currentTimeMillis();
            for(int i = 0; i < testCases.size(); i++){
                CaseResultDTO caseResult = new CaseResultDTO();
                caseResult.setCaseIndex(i + 1);

                TestCaseDTO testCaseDTO = testCases.get(i);
                String input = testCaseDTO.getInput();
                String expectedOutput = normalize(testCaseDTO.getExpectedOutput());
                caseResult.setExpectedOutput(expectedOutput);
                caseResult.setInput(input);

                Path inputPath = hostDirPath.resolve("input.txt");
                try{
                    Files.writeString(inputPath, input, StandardCharsets.UTF_8);
                }
                catch(IOException e){
                    ColorLog.error("容器{}，输入测试用例 {} 到文件失败：{}", containerId, input, e.getMessage());
                    judgeResponseDTO.setErrMsg(ResultCode.ERROR.getMsg());
                    return judgeResponseDTO;
                }

                containerExecResultDTO = dockerRunner.execute(containerId, execCmd, totalTimeLimit);

                String output = containerExecResultDTO.getStdout();
                String outputHandled = normalize(output);
                if(outputHandled.length() > 1000){
                    outputHandled = outputHandled.substring(0, 1000) + "...";
                }

                //运行超时
                if(!containerExecResultDTO.getSuccess()){
                    caseResult.setStderr(containerExecResultDTO.getStderr());
                    cases.add(caseResult);

                    judgeResponseDTO.setStatus(JudgeStatus.TIME_LIMIT_EXCEEDED);
                    judgeResponseDTO.setCaseResults(cases);
                    rabbitmqUtil.sendToExchange(CommonConstants.RESULT_EXCHANGE, CommonConstants.RESULT_ROUTING_KEY, judgeResponseDTO);
                    return judgeResponseDTO;
                }

                //运行时异常
                if(!containerExecResultDTO.getExitCode().equals(exitCode)){
                    caseResult.setStderr(containerExecResultDTO.getStderr());
                    cases.add(caseResult);

                    judgeResponseDTO.setStatus(JudgeStatus.RUNTIME_ERROR);
                    judgeResponseDTO.setCaseResults(cases);
                    rabbitmqUtil.sendToExchange(CommonConstants.RESULT_EXCHANGE, CommonConstants.RESULT_ROUTING_KEY, judgeResponseDTO);
                    return judgeResponseDTO;
                }

                boolean ret = expectedOutput.equals(outputHandled);

                //结果错误
                if(!ret){
                    caseResult.setStdout(outputHandled);
                    cases.add(caseResult);

                    judgeResponseDTO.setStatus(JudgeStatus.WRONG_ANSWER);
                    judgeResponseDTO.setCaseResults(cases);
                    rabbitmqUtil.sendToExchange(CommonConstants.RESULT_EXCHANGE, CommonConstants.RESULT_ROUTING_KEY, judgeResponseDTO);
                    return judgeResponseDTO;
                }

                //运行正常，用例通过，进行下一个测试
                caseResult.setStdout(outputHandled);
                cases.add(caseResult);
            }
            judgeResponseDTO.setCaseResults(cases);
        }
        catch(InterruptedException e){
            ColorLog.error("容器 {} 错误: {}", containerId, e.getMessage());
            judgeResponseDTO.setErrMsg(ResultCode.ERROR.getMsg());
            return judgeResponseDTO;
        }
        finally {
            //无论结果如何，都在判题逻辑结束之后，删除容器
            if(containerId != null){
                dockerRunner.removeContainer(containerId);
            }
        }

        long endTime = System.currentTimeMillis();

        judgeResponseDTO.setStatus(JudgeStatus.ACCEPTED);
        judgeResponseDTO.setRunTime((int)(endTime - startTime));

        rabbitmqUtil.sendToExchange(CommonConstants.RESULT_EXCHANGE, CommonConstants.RESULT_ROUTING_KEY, judgeResponseDTO);

        return judgeResponseDTO;
    }

    //对stdout进行处理
    private String normalize(String output) {
        return output.replace("\r\n", "\n")
                .replace('\r', '\n')
                .strip();
    }

    // 对判题请求进行检查
    private String validate(JudgeRequestDTO request) {
        if (request == null
                || request.getSourceCode() == null
                || request.getTestCases() == null
                || request.getTestCases().isEmpty()) {
            return ResultCode.FAILED_PARAMS_VALIDATE.getMsg();
        }

        if (request.getTestCases().size() > 100) {
            return ResultCode.FAILED_PARAMS_VALIDATE.getMsg();
        }

        if (request.getTestCases().stream().anyMatch(
                testCase -> testCase == null
                        || testCase.getInput() == null
                        || testCase.getExpectedOutput() == null)) {
            return ResultCode.FAILED_PARAMS_VALIDATE.getMsg();
        }
        return null;
    }
}
