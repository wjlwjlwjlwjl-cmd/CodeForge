package com.wjl.judge.infrastructure;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.InspectExecResponse;
import com.github.dockerjava.api.model.Frame;
import com.github.dockerjava.api.model.StreamType;
import com.wjl.judge.domain.dto.ContainerExecResultDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.github.dockerjava.api.command.ExecCreateCmdResponse;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

@Component
public class DockerRunner {
    @Autowired
    private DockerClient dockerClient;

    /**
     *
     * @param containerId 容器id
     * @param command 需要执行的命令
     * @param timeoutMs 超时时间限制（时间颗粒度为毫秒）
     * @return 容器命令执行结果（包括 stderr、stdout、退出码）
     * @throws InterruptedException docker-java异常
     */
    public ContainerExecResultDTO execute(
            String containerId,
            String command,
            long timeoutMs
    ) throws InterruptedException {

         ExecCreateCmdResponse exec = dockerClient
                .execCreateCmd(containerId)
                .withAttachStdout(true)
                .withAttachStderr(true)
                .withCmd("sh", "-c", command)
                .exec();

        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        ByteArrayOutputStream stderr = new ByteArrayOutputStream();

        ResultCallback.Adapter<Frame> callback =
                new ResultCallback.Adapter<>() {
                    @Override
                    public void onNext(Frame frame) {
                        try {
                            if (frame.getStreamType() == StreamType.STDOUT) {
                                stdout.write(frame.getPayload()); //将容器标准输出内容定向到 ByteArrayOutputStream stdout 中
                            } else if (frame.getStreamType() == StreamType.STDERR) {
                                stderr.write(frame.getPayload()); //将容器标准错误内容定向到 ByteArrayOutputStream stderr 中
                            }
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    }
                };

        dockerClient.execStartCmd(exec.getId())
                .withDetach(false)
                .withTty(false)
                .exec(callback);

        boolean completed;

        try {
            completed = callback.awaitCompletion(
                    timeoutMs, TimeUnit.MILLISECONDS
            );
        } catch (InterruptedException e) {
            // 上层 finally 会清理容器
            Thread.currentThread().interrupt();
            throw e;
        }

        if (!completed) {
            // Exec 本身没有通用的单进程 stop 命令。
            // 超时后终止整个容器，确保用户程序不再继续执行。
            try {
                dockerClient.killContainerCmd(containerId).exec();
            } catch (Exception ignored) {
                // 容器可能已经退出
            }

            return new ContainerExecResultDTO(
                    false,
                    stdout.toString(StandardCharsets.UTF_8),
                    stderr.toString(StandardCharsets.UTF_8),
                    null
            );
        }

        InspectExecResponse inspect = dockerClient
                .inspectExecCmd(exec.getId())
                .exec();

        return new ContainerExecResultDTO(
                true,
                stdout.toString(StandardCharsets.UTF_8),
                stderr.toString(StandardCharsets.UTF_8),
                inspect.getExitCodeLong()
        );
    }

    /**
     * 删除容器。容器可能已被 kill，因此强制删除。
     */
    public void removeContainer(String containerId) {
        try {
            dockerClient.removeContainerCmd(containerId)
                    .withForce(true)
                    .exec();
        } catch (Exception e) {
            // 实际项目应记录清理失败日志
        }
    }
}
