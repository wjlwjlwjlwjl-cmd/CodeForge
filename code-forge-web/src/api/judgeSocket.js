import { getJudgeWsUrl } from '../config.js';

// WebSocket 长连接封装
// 语义（与后端一致）：
//   - 惰性建连：首次调用 ensureConnected() 时创建，之后复用同一个连接
//   - 收到判题结果（JudgeResponseDTO）后保持连接，不主动关闭
// 后端推送的 JudgeResponseDTO 字段：
//   { submitId, userId, examId, questionId, status, compileResult,
//     caseResults: [{ caseIndex, stdout, stderr, expectedOutput }],
//     runTime, userCode, errMsg }

let ws = null;
// 消息订阅者集合，每个 onMessage(msg) 收到已解析为对象的判题结果
const listeners = new Set();

function ensureConnected({ onMessage }) {
  if (onMessage) {
    listeners.add(onMessage);
  }

  // 已有连接（或正在建立），直接复用
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return ws;
  }

  ws = new WebSocket(getJudgeWsUrl());

  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch (e) {
      // 非 JSON 消息（如 pong），忽略
      return;
    }
    listeners.forEach((fn) => fn(msg));
  };

  ws.onclose = () => {
    // 连接断开后置空，下次提交会重新建连
    ws = null;
  };

  ws.onerror = () => {
    // 保留 onclose 处理清理
  };

  return ws;
}

export function subscribeJudge(onMessage) {
  return ensureConnected({ onMessage });
}

export function unsubscribeJudge(onMessage) {
  listeners.delete(onMessage);
}
