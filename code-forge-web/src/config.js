// 全局配置：端口、鉴权、接口常量
// 说明：后端接口的实际定义已对照源码核实（见下注释），与 AGENTS.md 略有出入，以源码为准。

// IP 取自当前页面 hostname，端口固定：
//   - 网关（题目详情 + 提交判题）= 18080
//   - WebSocket（判题结果推送）= 18082
export const HOST = window.location.hostname;

export const API_GATEWAY_PORT = 18080;
export const WS_PORT = 18082;

// 统一响应包裹：code === SUCCESS_CODE 视为成功
export const SUCCESS_CODE = 1000;

// 鉴权 JWT（测试用，前端写死）
// 同时用于：
//   1. GET /question/detail 的 Authorization 请求头（经网关 AuthFilter 鉴权）
//   2. POST /job/java/submit 的 Authorization 请求头（JobController @RequestHeader）
//   3. WS 握手 token（ws://.../ws/judge?token=...，AuthHandshakeInterceptor 从 param 取）
export const TOKEN =
  'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJ0eXBlIjoiQyIsInVzZXJfYWNjb3VudCI6IjI1MzAwMTIwMTIyQG0uZnVkYW4uZWR1LmNuIiwiZW1haWwiOiIyNTMwMDEyMDEyMkBtLmZ1ZGFuLmVkdS5jbiIsInVzZXJuYW1lIjoid3dqamxsIn0.04ouYCwh_3c-a7QiAQriNW76Nn3VWqFstjhbuaiMrxTRqayLQ3zxASdJAAuB5EoexGK5cXjQp8jnLUvqIs_J_Q';

// 接口路径
// 注意：题目详情是 query 参数 ?id=，不是路径参数 /{id}
export const getQuestionDetailUrl = (id) =>
  `http://${HOST}:${API_GATEWAY_PORT}/question/detail?id=${id}`;

export const getSubmitUrl = () =>
  `http://${HOST}:${API_GATEWAY_PORT}/job/java/submit`;

export const getJudgeWsUrl = () =>
  `ws://${HOST}:${WS_PORT}/ws/judge?token=${TOKEN}`;

// 判题语言：目前后端仅支持 java
export const LANGUAGES = [
  { value: 'java', label: 'Java', enabled: true },
  { value: 'cpp', label: 'C++', enabled: false },
  { value: 'python', label: 'Python', enabled: false },
];

// 判题状态 → 中文文案（枚举名与后端 JudgeStatus 一致）
export const STATUS_TEXT = {
  ACCEPTED: '通过',
  WRONG_ANSWER: '解答错误',
  COMPILE_ERROR: '编译错误',
  COMPILE_TIMEOUT: '编译超时',
  TIME_LIMIT_EXCEEDED: '运行超时',
  RUNTIME_ERROR: '运行时错误',
  SYSTEM_ERROR: '系统错误',
};
