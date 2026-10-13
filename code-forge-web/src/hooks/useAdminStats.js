import { useCallback, useEffect, useState } from 'react';
import {
  fetchAdminList,
  fetchExamTotal,
  fetchQuestionTotal,
  fetchUserList,
} from '../api/admin.js';

// 概览页统计数据
//
//   管理员数量  GET /system/b/list        → data.list.length
//   用户总数    GET /user/b/list?pageNum=1 → data.total
//   题目总数    GET /question/list?pageNum=1 → data.total
//   竞赛总数    GET /exam/list?pageNum=1     → data.total
//   黑名单数量  —— 接口不支持按状态筛选，固定返回 null（前端显示「—」）
//
// 用 allSettled：某一项失败不影响其它项，失败的显示「—」而不是编造数据。
export function useAdminStats() {
  const [stats, setStats] = useState({
    admins: null,
    users: null,
    blacklist: null,
    questions: null,
    exams: null,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [admins, users, questions, exams] = await Promise.allSettled([
      fetchAdminList().then((d) => (Array.isArray(d?.list) ? d.list.length : null)),
      fetchUserList({ pageNum: 1 }).then((d) =>
        typeof d?.total === 'number' ? d.total : null
      ),
      fetchQuestionTotal(),
      fetchExamTotal(),
    ]);
    const pick = (r) => (r.status === 'fulfilled' ? r.value : null);
    setStats({
      admins: pick(admins),
      users: pick(users),
      blacklist: null, // 接口未提供状态筛选，见上方注释
      questions: pick(questions),
      exams: pick(exams),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, reload: load };
}
