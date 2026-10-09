import { STATUS_TEXT } from '../config.js';

// 判题结果展示（按 status 结构化）
// 后端 JudgeResponseDTO 字段：
//   status（枚举名，如 "ACCEPTED"）、compileResult、runTime、errMsg、
//   caseResults: [{ caseIndex, input, stdout, stderr, expectedOutput }]
// 失败用例展示「输入 input / 实际输出 stdout / 期望输出 expectedOutput」，
// 运行时错误的 stderr、编译错误的 compileResult 均按原始文本展示。
export default function JudgeResultPanel({ result, judging, error }) {
  // 提交中
  if (judging) {
    return (
      <div className="judge-panel loading">
        <div className="judge-status judging">判题中…</div>
        <div className="judge-detail">正在等待判题结果，请稍候…</div>
      </div>
    );
  }

  // 提交失败
  if (error) {
    return (
      <div className="judge-panel">
        <div className="judge-status error">提交失败</div>
        <div className="judge-detail">{error}</div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const status = result.status;
  const statusText = STATUS_TEXT[status] || status;

  return (
    <div className="judge-panel">
      <div className={`judge-status status-${status}`}>{statusText}</div>

      {status === 'ACCEPTED' && (
        <div className="judge-detail">
          <span className="run-time">
            ⚡ 运行时间 {result.runTime != null ? `${result.runTime} ms` : '—'}
          </span>
        </div>
      )}

      {status === 'COMPILE_ERROR' && (
        <div className="judge-detail">
          <pre className="judge-pre">{result.compileResult || '（无编译错误信息）'}</pre>
        </div>
      )}

      {status === 'COMPILE_TIMEOUT' && (
        <div className="judge-detail">
          <pre className="judge-pre">{result.compileResult || '编译超时'}</pre>
        </div>
      )}

      {(status === 'WRONG_ANSWER' ||
        status === 'RUNTIME_ERROR' ||
        status === 'TIME_LIMIT_EXCEEDED') && (
        <CaseResultDetail result={result} />
      )}

      {status === 'SYSTEM_ERROR' && (
        <div className="judge-detail">
          <pre className="judge-pre">{result.errMsg || '系统错误'}</pre>
        </div>
      )}
    </div>
  );
}

function CaseResultDetail({ result }) {
  const cases = result.caseResults || [];
  // 后端在发生错误时，把当前失败的用例 append 进 caseResults 后 return，
  // 因此最后一个用例即为「首个失败用例」
  const failedCase = cases[cases.length - 1];
  const isTimeout = result.status === 'TIME_LIMIT_EXCEEDED';

  if (!failedCase) {
    return (
      <div className="judge-detail">
        <pre className="judge-pre">{result.errMsg || '（无用例信息）'}</pre>
      </div>
    );
  }

  return (
    <div className="judge-detail">
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
      {/* 运行超时不展示实际输出和错误信息 */}
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
