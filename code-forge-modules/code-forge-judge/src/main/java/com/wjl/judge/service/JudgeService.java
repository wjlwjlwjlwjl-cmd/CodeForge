package com.wjl.judge.service;

import com.wjl.constants.CommonConstants;
import com.wjl.core.enums.ResultCode;
import com.wjl.core.utils.ColorLog;
import com.wjl.docker.util.ContainerUtil;
import com.wjl.exception.ServiceException;
import com.wjl.judge.domain.dto.ContainerExecResultDTO;
import com.wjl.judge.domain.dto.JudgeRequestDTO;
import com.wjl.judge.domain.dto.JudgeResponseDTO;
import com.wjl.judge.domain.dto.TestCaseDTO;
import com.wjl.judge.enums.JudgeStatus;
import com.wjl.judge.infrastructure.DockerRunner;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class JudgeService {
    @Autowired
    private ContainerUtil containerUtil;
    @Autowired
    private DockerRunner dockerRunner;

    public JudgeResponseDTO judge(JudgeRequestDTO dto) {
        validate(dto);

        JudgeResponseDTO judgeResponseDTO = new JudgeResponseDTO();

        String sourceCode = dto.getSourceCode();
        List<TestCaseDTO> testCases = dto.getTestCases();
        Long submitId = dto.getSubmitId();

        String hostDir = String.format(CommonConstants.HOST_DIR, submitId);
        String containerDir = String.format(CommonConstants.CONTAINER_DIR, submitId);
        String containerName = String.format(CommonConstants.CONTAINER_NAME, submitId);
        String compileCmd = String.format(CommonConstants.JAVA_COMPILE_TEMPLATE, submitId, submitId);
        String execCmd = String.format(CommonConstants.JAVA_RUNTIME_TEMPLATE, submitId);

        //将源代码写入目录
        Path hostDirPath = Paths.get(hostDir);
        Path sourceFilePath = hostDirPath.resolve(CommonConstants.SOURCE_CODE);


        String containerId = null;
        try{
            //创建容器，启动容器，运行命令，收集结果
            containerId = containerUtil.createContainer(hostDir, containerDir, CommonConstants.JAVA_IMAGE, containerName);
            if(!containerUtil.startContainer(containerId)){
                throw new ServiceException(ResultCode.ERROR.getCode(), ResultCode.ERROR.getMsg());
            }

            ContainerExecResultDTO containerExecResultDTO = dockerRunner.execute(containerId, compileCmd, CommonConstants.COMPILE_TIMEOUT_MS);

            if(!containerExecResultDTO.getSuccess()){
                judgeResponseDTO.setStatus(JudgeStatus.COMPILE_TIMEOUT);
                judgeResponseDTO.setCompileResult(JudgeStatus.COMPILE_TIMEOUT.getMsg());
                return judgeResponseDTO;
            }
            //判断是否成功编译
            Long exitCode = containerExecResultDTO.getExitCode();
            if(exitCode == null || exitCode != 0){
                //编译错误
                String errMsg = containerExecResultDTO.getStderr();
                judgeResponseDTO.setStatus(JudgeStatus.COMPILE_ERROR);
                judgeResponseDTO.setCompileResult(errMsg);
            }

            //编译成功，开始执行运行逻辑
        }
        catch(InterruptedException e){
            ColorLog.error("容器 {} 错误: {}", containerId, e.getMessage());
            throw new ServiceException(ResultCode.ERROR.getCode(), ResultCode.ERROR.getMsg());
        }
        finally {
            //无论结果如何，都在判题逻辑结束之后，删除容器
            //dockerRunner.removeContainer(containerId);
        }

        judgeResponseDTO.setStatus(JudgeStatus.ACCEPTED);
        return judgeResponseDTO;
    }

    //对stdout进行处理
    private String normalize(String output) {
        return output.replace("\r\n", "\n")
                .replace('\r', '\n')
                .strip();
    }

    // 对判题请求进行检查
    private void validate(JudgeRequestDTO request) {
        if (request == null
                || request.getSourceCode() == null
                || request.getTestCases() == null
                || request.getTestCases().isEmpty()) {
            throw new ServiceException(ResultCode.FAILED_PARAMS_VALIDATE.getCode(), ResultCode.FAILED_PARAMS_VALIDATE.getMsg());
        }

        if (request.getTestCases().size() > 100) {
            throw new ServiceException(ResultCode.FAILED_PARAMS_VALIDATE.getCode(), ResultCode.FAILED_PARAMS_VALIDATE.getMsg());
        }

        if (request.getTestCases().stream().anyMatch(
                testCase -> testCase == null
                        || testCase.getInput() == null
                        || testCase.getExpectedOutput() == null)) {
            throw new ServiceException(ResultCode.FAILED_PARAMS_VALIDATE.getCode(), ResultCode.FAILED_PARAMS_VALIDATE.getMsg());
        }
    }
}
