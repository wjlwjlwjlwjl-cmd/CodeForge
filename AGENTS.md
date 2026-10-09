# 项目：OJ 题目详情 + 代码提交测试页

## 技术栈
- React 18 + Vite
- Monaco Editor (@monaco-editor/react)，VS Code 内核
- 布局：LeetCode 默认布局（左侧题目描述 + 右侧代码编辑器）
- 样式：内联 style 或 CSS Module，不引入 Tailwind / Bootstrap
- 主题：暗色 / 亮色两套，可切换

## 接口约定

### 1. 获取题目详情
- 方法：GET
- 路径：`{ip}:18080/question/detail/{id}`
- 说明：`ip` 从前端当前页面的 hostname 取，端口固定 18080
- 路径参数：`id` = 题目 ID
- 返回：包含 `title`、`content`、`questionCase`、`defaultCode` 等字段

### 2. 提交判题
- 方法：POST
- 路径：`{ip}:18080/job/java/submit`
- 请求体：
  ```json
  {
    "questionId": 786,
    "examId": null,
    "userCode": "class Solution { ... }"
  }
  ```
- `questionId` 必填，`examId` 可为 null，`userCode` 必填

### 3. WebSocket 接收判题结果
- 端点：`ws://{ip}:18082/ws/judge?token=<固定 token>`
- token（测试用，写死）：
  `eyJhbGciOiJIUzUxMiJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJ0eXBlIjoiQyIsInVzZXJfYWNjb3VudCI6IjI1MzAwMTIwMTIyQG0uZnVkYW4uZWR1LmNuIiwiZW1haWwiOiIyNTMwMDEyMDEyMkBtLmZ1ZGFuLmVkdS5jbiIsInVzZXJuYW1lIjoid3dqamxsIn0.04ouYCwh_3c-a7QiAQriNW76Nn3VWqFstjhbuaiMrxTRqayLQ3zxASdJAAuB5EoexGK5cXjQp8jnLUvqIs_J_Q`
- 时机：点击「提交」时先建立 WebSocket 连接，再发 HTTP 提交请求
- 推送内容：判题结果 JSON，含 `status`、`compileResult`、`caseResults`、`runTime` 等字段

## 判题结果展示规则
根据 `status` 字段决定左侧面板展示内容：
- ACCEPTED "通过",
- WRONG_ANSWER "解答错误",
- COMPILE_ERROR "编译错误",
- COMPILE_TIMEOUT "编译超时",
- TIME_LIMIT_EXCEEDED "运行超时",
- RUNTIME_ERROR "运行时错误",
- SYSTEM_ERROR "系统错误";

## 不要做的事
- 不要加路由
- 不要加状态管理库
- 不要做用户登录
- 不要做题目列表页
- 不要引入 UI 组件库