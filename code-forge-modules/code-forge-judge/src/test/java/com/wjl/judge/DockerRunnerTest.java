package com.wjl.judge;

import com.wjl.constants.CommonConstants;
import com.wjl.core.utils.ColorLog;
import com.wjl.docker.util.ContainerUtil;
import com.wjl.judge.domain.dto.ContainerExecResultDTO;
import com.wjl.judge.infrastructure.DockerRunner;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Random;

@SpringBootTest
public class DockerRunnerTest {
    @Autowired
    private ContainerUtil containerUtil;
    @Autowired
    private DockerRunner dockerRunner;

    private final Random random = new Random();

    @Test
    public void testContainerExecResult() throws InterruptedException {
        String randomSuffix = String.format("%8d", random.nextInt(1_0000_0000)).trim();
        String command = "cat /etc/*release*";

        String containerId = containerUtil.createContainer("/data/" + randomSuffix, CommonConstants.JAVA_IMAGE, "java-" + randomSuffix);
        containerUtil.startContainer(containerId);
        ContainerExecResultDTO dto = dockerRunner.execute(containerId, command, 1000);
        ColorLog.info("success: {}", dto.getSuccess().toString());
        ColorLog.info("stdout: {}", dto.getStdout());
        ColorLog.info("stderr: {}", dto.getStderr());
        ColorLog.info("exit code: {}", dto.getExitCode());

        dockerRunner.removeContainer(containerId);
    }
}
