import { STATUS_TEXT, PROGRAM_TYPES, PROGRAM_LANG } from '../config.js';
import { useSubmitDetail } from '../hooks/useSubmitDetail.js';
import { formatDateTime, formatRuntime } from '../utils/format.js';
import CodeBlock from './CodeBlock.jsx';

// 判题状态 → 颜色类型
function statusKind(status) {
  if (status === 'ACCEPTED') return 'success';
  if (status === 'TIME_LIMIT_EXCEEDED') return 'warning';
  return 'error';
}

// 判题结果页（展示在左侧详情栏）：借鉴提交详情
//   判题结果（标题）、语言、运行时间、提交日期、提交代码
//   另附编译错误 / 失败用例信息
export default function JudgeResultView({
  result,
  submitError,
  monacoTheme,
  editorFontSize,
}) {
  // WS 结果里没有语言与提交日期，用提交详情补全（submitId 由结果带回）
  const { data: detail } = useSubmitDetail(result?.submitId);

  // 提交失败
  if (submitError && !result) {
    return (
      <div className="submit-detail">
        <div className="detail-header">
          <h2 className="detail-status status-error">提交失败</h2>
          <div className="detail-time">{submitError}</div>
        </div>
      </div>
    );
  }

  if (!result) {
    return <div className="panel-center">暂无判题结果</div>;
  }

  const status = result.status;
  const kind = statusKind(status);
  const language = PROGRAM_TYPES[detail?.programType] ?? 'Java';
  const monacoLang = PROGRAM_LANG[detail?.programType] ?? 'java';
  // 与「提交详情」一致：优先用提交记录里的用户代码；
  // WS 结果附带的是拼装后的完整源码（含 main），仅作兵底
  const code = detail?.userCode ?? result.userCode ?? '';

  return (
    <div className="submit-detail">
      <div className="detail-header">
        <h2 className={`detail-status status-${kind}`}>
          {STATUS_TEXT[status] || status}
        </h2>
        <div className="detail-time">{formatDateTime(detail?.createTime)}</div>
        <div className="detail-meta">
          <span className="detail-meta-item">
            <span className="detail-label">语言</span>
            <span className="detail-value">{language}</span>
          </span>
          <span className="detail-meta-item">
            <span className="detail-label">运行时间</span>
            <span className="detail-value">{formatRuntime(result.runTime)}</span>
          </span>
        </div>
      </div>

      {/* 编译错误 / 失败用例信息 */}
      <ResultDetails result={result} />

      {/* 提交代码：只读 + 高亮，圆角块，高度随代码撑开 */}
      <div className="detail-code-block">
        <CodeBlock
          code={code}
          language={monacoLang}
          theme={monacoTheme}
          fontSize={editorFontSize}
        />
      </div>
    </div>
  );
}

// 按 status 展示编译错误 / 失败用例 / 系统错误
function ResultDetails({ result }) {
  const status = result.status;

  if (status === 'COMPILE_ERROR' || status === 'COMPILE_TIMEOUT') {
    return (
      <div className="result-details">
        <span className="detail-label">
          {status === 'COMPILE_TIMEOUT' ? '编译超时' : '编译错误'}
        </span>
        <pre className="judge-pre">{result.compileResult || '（无编译错误信息）'}</pre>
      </div>
    );
  }

  if (
    status === 'WRONG_ANSWER' ||
    status === 'RUNTIME_ERROR' ||
    status === 'TIME_LIMIT_EXCEEDED'
  ) {
    return <CaseDetails result={result} />;
  }

  if (status === 'SYSTEM_ERROR') {
    return (
      <div className="result-details">
        <span className="detail-label">系统错误</span>
        <pre className="judge-pre">{result.errMsg || '系统错误'}</pre>
      </div>
    );
  }

  return null;
}

// 失败用例：输入 / 期望输出 / 实际输出 / 错误信息（超时不展示后两者）
function CaseDetails({ result }) {
  const cases = result.caseResults || [];
  // 后端在出错时把当前失败用例 append 进 caseResults，最后一个即首个失败用例
  const failedCase = cases[cases.length - 1];
  const isTimeout = result.status === 'TIME_LIMIT_EXCEEDED';

  if (!failedCase) {
    return (
      <div className="result-details">
        <pre className="judge-pre">{result.errMsg || '（无用例信息）'}</pre>
      </div>
    );
  }

  return (
    <div className="result-details">
      <div className="case-line">
        <span className="case-index">用例{failedCase.caseIndex}</span>
      </div>
      {failedCase.input != null && (
        <div className="case-line">
          <span className="case-label">输入</span>
          <pre className="judge-pre">{failedCase.input}</pre>
        </div>
      )}
      {failedCase.expectedOutput != null && (
        <div className="case-line">
          <span className="case-label">期望输出</span>
          <pre className="judge-pre">{failedCase.expectedOutput}</pre>
        </div>
      )}
      {!isTimeout && failedCase.stdout != null && (
        <div className="case-line">
          <span className="case-label">实际输出</span>
          <pre className="judge-pre">{failedCase.stdout}</pre>
        </div>
      )}
      {!isTimeout && failedCase.stderr != null && (
        <div className="case-line">
          <span className="case-label">错误信息</span>
          <pre className="judge-pre">{failedCase.stderr}</pre>
        </div>
      )}
    </div>
  );
}