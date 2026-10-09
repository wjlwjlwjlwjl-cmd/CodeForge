import { useCallback, useEffect, useRef, useState } from 'react';
import { submitJudge } from '../api/submit.js';
import { subscribeJudge, unsubscribeJudge } from '../api/judgeSocket.js';

// 提交判题 + 订阅结果
// 返回：
//   - result: 当前题目最新的判题结果（JudgeResponseDTO 对象，null 表示尚无结果）
//   - judging: 是否正在判题中
//   - submitError: 提交过程中的错误
//   - submit(code): 发起提交
export function useJudge(questionId) {
  const [result, setResult] = useState(null);
  const [judging, setJudging] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // 用 ref 保存当前 questionId，避免在 onMessage 闭包中拿到旧值
  const questionIdRef = useRef(questionId);
  useEffect(() => {
    questionIdRef.current = questionId;
  }, [questionId]);

  // 订阅 WS，按 questionId 路由结果
  useEffect(() => {
    const onMessage = (msg) => {
      // 只处理与当前题目匹配的结果（后端字段 questionId 为数字）
      if (questionIdRef.current != null && msg?.questionId != null) {
        if (String(msg.questionId) === String(questionIdRef.current)) {
          setResult(msg);
          setJudging(false);
        }
      }
    };

    subscribeJudge(onMessage);
    return () => unsubscribeJudge(onMessage);
  }, []);

  const submit = useCallback(
    async (userCode) => {
      if (questionId == null) return;

      // 先确保 WS 已建连（惰性），再发 HTTP 提交
      // subscribeJudge 内部会复用已有连接
      subscribeJudge(null);

      setJudging(true);
      setSubmitError(null);

      try {
        await submitJudge({
          questionId,
          examId: null,
          userCode,
        });
        // 提交成功后，等待 WS 推送结果；onMessage 里会置 judging=false
      } catch (e) {
        setJudging(false);
        setSubmitError(e.message || '提交失败');
      }
    },
    [questionId]
  );

  return { result, judging, submitError, submit };
}
