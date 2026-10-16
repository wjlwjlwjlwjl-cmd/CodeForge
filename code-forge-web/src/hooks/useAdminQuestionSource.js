import { useCallback } from 'react';
import { fetchQuestionPage, searchQuestions } from '../api/admin.js';

// 题目数据源（题目管理页 / 为竞赛添加题目弹窗共用，保证检索行为完全一致）
//
//   keyword 非空            → GET /question/search/filter?keyword=&difficulty=&pageNum=
//   只有 difficulty 没有关键字 → 接口的 keyword 是 @NotBlank，查不了，
//                              和 C 端一样翻 /question/list 后在本地筛
//   两者都没有               → GET /question/list?pageNum=
//
// 本地筛选时不给 total / pages：筛出来的条数和后端页数没有对应关系，
// 让通用列表退回「本页是否满页」判断还有没有下一页。
const SCAN_PAGE_SIZE = 10; // 前端分页每页条数（与后端 PAGE_SIZE 一致）
const MAX_SCAN_PAGES = 30; // 本地筛选时最多往后扫多少页，避免极端情况空转

async function fetchByDifficulty(difficulty, cursorRef) {
  const picked = [];
  while (picked.length < SCAN_PAGE_SIZE && cursorRef.current < MAX_SCAN_PAGES) {
    cursorRef.current += 1;
    const d = await fetchQuestionPage(cursorRef.current);
    const list = Array.isArray(d?.list) ? d.list : [];
    for (const q of list) {
      if (Number(q.difficulty) === Number(difficulty)) picked.push(q);
    }
    const pageSize = Number(d?.pageSize) > 0 ? Number(d.pageSize) : list.length;
    if (list.length < pageSize) break; // 后端没有更多数据了
  }
  return { list: picked, pageSize: SCAN_PAGE_SIZE };
}

// 返回 fetchPage(pageNum)，直接交给 useAdminPagedList 使用
export function useAdminQuestionSource({ keyword = '', difficulty = null } = {}, cursorRef) {
  return useCallback(
    (pageNum) => {
      const kw = String(keyword || '').trim();
      if (!kw && difficulty != null) {
        // 新一轮（pageNum=1）时把扫描游标归零
        if (pageNum === 1) cursorRef.current = 0;
        return fetchByDifficulty(difficulty, cursorRef);
      }
      if (kw) {
        return searchQuestions({ keyword: kw, difficulty, pageNum });
      }
      return fetchQuestionPage(pageNum);
    },
    [keyword, difficulty, cursorRef]
  );
}
