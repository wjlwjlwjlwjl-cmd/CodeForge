import { useCallback, useEffect, useState } from 'react';
import {
  ensureMyExams,
  getMyExamState,
  markMyExamSigned,
  subscribeMyExams,
} from '../api/myExamStore.js';

// 我的竞赛（已报名）——数据来自 GET /user/exam/list/mine
//
//   const { isSigned, rows, loading, refresh, markSigned } = useMyExams({ load: true });
//
// load: true 时挂载后自动拉取（首页 / 竞赛抽屉用）；
// 否则只订阅（例如只想读当前状态的地方）。
export function useMyExams({ load = false } = {}) {
  const [state, setState] = useState(getMyExamState);

  useEffect(() => subscribeMyExams(setState), []);

  useEffect(() => {
    if (load) ensureMyExams();
  }, [load]);

  const isSigned = useCallback(
    (examId) => state.ids.includes(String(examId)),
    [state.ids]
  );

  const refresh = useCallback(() => ensureMyExams({ force: true }), []);

  const markSigned = useCallback((examId) => markMyExamSigned(examId), []);

  return {
    ids: state.ids,
    rows: state.rows,
    loading: state.loading,
    loaded: state.loaded,
    error: state.error,
    isSigned,
    refresh,
    markSigned,
  };
}
