import { useCallback, useEffect, useState } from 'react';
import {
  fetchAdminList,
  fetchExamTotal,
  fetchQuestionTotal,
  fetchUserList,
} from '../api/admin.js';

// 概览页数据
//
//   管理员数量  GET /system/b/list        → data.list.length
//   用户总数    GET /user/b/list?pageNum=1 → data.total
//   题目总数    GET /question/list?pageNum=1 → data.total
//   竞赛总数    GET /exam/list?pageNum=1     → data.total
//   黑名单数量  —— 接口不支持按状态筛选，固定返回 null（前端显示「—」）
//
// 另外把 /system/b/list 的原始列表（SysUserVO[]）也返回出去，
// 概览的「其他管理员」区块要用 —— 这样一次请求同时喂统计和列表，不用拉两遍。
//
// 用 allSettled：某一项失败不影响其它项，失败的显示「—」而不是编造数据。
export function useAdminStats() {
  // /system/b/list 的原始列表（SysUserVO[]）
  const [admins, setAdmins] = useState([]);
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
    const [adminRes, users, questions, exams] = await Promise.allSettled([
      fetchAdminList().then((d) => (Array.isArray(d?.list) ? d.list : null)),
      fetchUserList({ pageNum: 1 }).then((d) =>
        typeof d?.total === 'number' ? d.total : null
      ),
      fetchQuestionTotal(),
      fetchExamTotal(),
    ]);
    const pick = (r) => (r.status === 'fulfilled' ? r.value : null);
    const adminList = pick(adminRes);
    setAdmins(adminList || []);
    setStats({
      admins: adminList ? adminList.length : null,
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

  return { stats, admins, loading, reload: load };
}
