import { useCallback, useEffect, useRef, useState } from 'react';
import { submitJudge } from '../api/submit.js';
import { subscribeJudge, unsubscribeJudge } from '../api/judgeSocket.js';
import { handleApiError, goToLogin } from '../config.js';

// 提交判题 + 订阅结果
// 返回：
//   - result: 当前题目最新的判题结果（JudgeResponseDTO 对象，null 表示尚无结果）
//   - judging: 是否正在判题中
//   - submitError: 提交过程中的错误
//   - pendingCode: 正在判题的这份代码（用于「运行中」时先展示代码）
//   - submit(code): 发起提交
//
// examId：只有从「竞赛题目列表」点进来的答题页才会传，
// 提交时随请求一起发给后端，后端据此算作竞赛答题（计入竞赛排名）；
// 传 null 表示普通刷题提交（题库 / 上一题下一题 / 首页等入口一律为 null）。
export function useJudge(questionId, examId = null) {
  const [result, setResult] = useState(null);
  const [judging, setJudging] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  // 本次提交的代码：等待 WS 结果期间先展示出来
  const [pendingCode, setPendingCode] = useState('');

  // 用 ref 保存当前 questionId，避免在 onMessage 闭包中拿到旧值
  const questionIdRef = useRef(questionId);
  useEffect(() => {
    questionIdRef.current = questionId;
  }, [questionId]);

  // 切换题目时，清空上一题的判题结果
  useEffect(() => {
    setResult(null);
    setJudging(false);
    setSubmitError(null);
    setPendingCode('');
  }, [questionId]);

  // 订阅 WS，按 questionId 路由结果
  // 仅在非登录页（questionId 存在）时建连：未登录时建连会抛错
  useEffect(() => {
    if (questionId == null) return undefined;

    const onMessage = (msg) => {
      // 只处理与当前题目匹配的结果（后端字段 questionId 为数字）
      if (questionIdRef.current != null && msg?.questionId != null) {
        if (String(msg.questionId) === String(questionIdRef.current)) {
          setResult(msg);
          setJudging(false);
        }
      }
    };

    try {
      subscribeJudge(onMessage);
    } catch (e) {
      // 未登录：交给外层（App）统一重定向到登录页，这里不抛错
      return undefined;
    }
    return () => unsubscribeJudge(onMessage);
  }, [questionId]);

  const submit = useCallback(
    async (userCode) => {
      if (questionId == null) return;

      // 先确保 WS 已建连（惰性），再发 HTTP 提交
      // subscribeJudge 内部会复用已有连接
      try {
        subscribeJudge(null);
      } catch (e) {
        // 未登录：跳转登录页
        goToLogin();
        return;
      }

      // 开始新一次判题：清掉上一次的结果，
      // 否则左侧会继续显示上一轮结果、看不到「运行中」等待态
      setJudging(true);
      setResult(null);
      setSubmitError(null);
      setPendingCode(userCode || '');

      try {
        await submitJudge({
          questionId,
          // 竞赛答题：仅在竞赛题目列表进入的页面才会是具体值
          examId: examId == null ? null : Number(examId),
          userCode,
        });
        // 提交成功后，等待 WS 推送结果；onMessage 里会置 judging=false
      } catch (e) {
        setJudging(false);
        // 被拉黑（网关 403 + 3104）/ 未登录 / 登录过期：统一从这里踢回登录页，
        // handleApiError 返回 null 表示已经发起跳转，不用再设置错误文案
        const msg = handleApiError(e, '提交失败');
        if (msg === null) return;
        setSubmitError(msg);
      }
    },
    [questionId, examId]
  );

  return { result, judging, submitError, pendingCode, submit, examId };
}
