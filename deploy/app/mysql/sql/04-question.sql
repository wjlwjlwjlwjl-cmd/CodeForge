# 题目数据初始化（数据来源: tmps.json）
# 依赖 01-init.sql 已创建库 db_code_forge 与表 tb_question
# 说明: 字符串内 \n 为 MySQL 换行转义（默认 sql_mode，未开启 NO_BACKSLASH_ESCAPES）；正文中的单引号已转义为 ''
SET NAMES utf8mb4;
USE `db_code_forge`;

# 可重复执行：先清掉这批样例题（question_id 1~10，不影响 01-init.sql 的模板题 1001）

INSERT INTO `tb_question`
    (id, title, difficulty, time_limit, space_limit,
     content, question_case, default_code, main_fuc,
     create_by, create_time, update_by, update_time)
VALUES
    -- 1. 两数之和 (简单)
    (1, '1. 两数之和 (Two Sum)', 1, 1000, 256,
     '给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值的那两个整数，并返回它们的数组下标。\n每种输入只会对应一个答案，且数组中同一个元素不能使用两遍。',
     '输入样例：\n2 7 11 15, target = 9\n输出样例：\n[0, 1]',
     'public int[] twoSum(int[] nums, int target) {\n    // TODO 在此实现\n    return new int[0];\n}',
     'public int[] twoSum(int[] nums, int target) {\n    java.util.Map<Integer, Integer> m = new java.util.HashMap<>();\n    for (int i = 0; i < nums.length; i++) {\n        Integer j = m.get(target - nums[i]);\n        if (j != null) return new int[]{j, i};\n        m.put(nums[i], i);\n    }\n    return new int[0];\n}',
     1, NOW(), 1, NOW()),
    -- 20. 有效的括号 (简单)
    (2, '20. 有效的括号 (Valid Parentheses)', 1, 1000, 128,
     '给定一个只包括 ''(''，'')''，''{''，''}''，''[''，'']'' 的字符串 s，判断字符串是否有效。\n有效字符串需满足：左括号必须用相同类型的右括号以正确的顺序闭合，且每个右括号都有对应的相同类型左括号。',
     '输入样例：\n()[]{}\n输出样例：\ntrue',
     'public boolean isValid(String s) {\n    // TODO\n    return false;\n}',
     'public boolean isValid(String s) {\n    java.util.Deque<Character> st = new java.util.ArrayDeque<>();\n    for (char c : s.toCharArray()) {\n        if (c == ''('') st.push(''))'');\n        else if (c == ''['') st.push('']'');\n        else if (c == ''{'' st.push(''}'');\n        else if (st.isEmpty() || st.pop() != c) return false;\n    }\n    return st.isEmpty();\n}',
     1, NOW(), 1, NOW()),
    -- 70. 爬楼梯 (简单)
    (3, '70. 爬楼梯 (Climbing Stairs)', 1, 1000, 128,
     '假设你正在爬楼梯，需要 n 阶你才能到达楼顶。\n每次你可以爬 1 或 2 个台阶。请问你有多少种不同的方法可以爬到楼顶？',
     '输入样例：\nn = 3\n输出样例：\n3',
     'public int climbStairs(int n) {\n    // TODO\n    return 0;\n}',
     'public int climbStairs(int n) {\n    int a = 1, b = 1;\n    for (int i = 2; i <= n; i++) {\n        int c = a + b; a = b; b = c;\n    }\n    return b;\n}',
     1, NOW(), 1, NOW()),
    -- 3. 无重复字符的最长子串 (中等)
    (4, '3. 无重复字符的最长子串', 2, 2000, 256,
     '给定一个字符串 s，请你找出其中不含有重复字符的最长子串的长度。\n子串要求连续，区别于子序列。',
     '输入样例：\nabcabcbb\n输出样例：\n3',
     'public int lengthOfLongestSubstring(String s) {\n    // TODO\n    return 0;\n}',
     'public int lengthOfLongestSubstring(String s) {\n    java.util.Map<Character, Integer> last = new java.util.HashMap<>();\n    int res = 0, i = 0;\n    for (int j = 0; j < s.length(); j++) {\n        char c = s.charAt(j);\n        if (last.containsKey(c) && last.get(c) >= i) i = last.get(c) + 1;\n        last.put(c, j);\n        res = Math.max(res, j - i + 1);\n    }\n    return res;\n}',
     1, NOW(), 1, NOW()),
    -- 15. 三数之和 (中等)
    (5, '15. 三数之和 (3Sum)', 2, 3000, 256,
     '给你一个整数数组 nums，判断是否存在三元组 [nums[i], nums[j], nums[k]] 满足 i、j、k 互不相同，且三个数之和为 0。\n请你返回所有和为 0 且不重复的三元组（答案中不可以包含重复的三元组）。',
     '输入样例：\n-1 0 1 2 -1 -4\n输出样例：\n[-1 -1 2] [-1 0 1]',
     'public java.util.List<java.util.List<Integer>> threeSum(int[] nums) {\n    // TODO\n    return new java.util.ArrayList<>();\n}',
     'public java.util.List<java.util.List<Integer>> threeSum(int[] n){java.util.Arrays.sort(n);var r=new java.util.ArrayList<java.util.List<Integer>>();for(int i=0;i<n.length-2;i++){if(i>0&&n[i]==n[i-1])continue;int l=i+1,h=n.length-1;while(l<h){int s=n[i]+n[l]+n[h];if(s==0){r.add(java.util.Arrays.asList(n[i],n[l],n[h]));while(l<h&&n[l]==n[++l]);while(l<h&&n[h]==n[--h]);}else if(s<0)l++;else h--;}}return r;}',
     1, NOW(), 1, NOW()),
    -- 200. 岛屿数量 (中等)
    (6, '200. 岛屿数量 (Number of Islands)', 2, 2000, 512,
     '给你一个由 ''1''（陆地）和 ''0''（水）组成的二维网格，请你计算网格中岛屿的数量。\n岛屿由水平或竖直方向上相邻的陆地连接形成，且该网格的四条边均被水包围。',
     '输入样例：\n11000\n10011\n00011\n00000\n11000\n输出样例：\n3',
     'public int numIslands(char[][] grid) {\n    // TODO\n    return 0;\n}',
     'public int numIslands(char[][] grid) {\n    int c = 0;\n    for (int i = 0; i < grid.length; i++)\n        for (int j = 0; j < grid[0].length; j++)\n            if (grid[i][j] == ''1'') { dfs(grid, i, j); c++; }\n    return c;\n}\nprivate void dfs(char[][] g, int i, int j) {\n    if (i < 0 || j < 0 || i >= g.length || j >= g[0].length || g[i][j] != ''1'') return;\n    g[i][j] = ''0'';\n    dfs(g, i+1, j); dfs(g, i-1, j); dfs(g, i, j+1); dfs(g, i, j-1);\n}',
     1, NOW(), 1, NOW()),
    -- 46. 全排列 (中等)
    (7, '46. 全排列 (Permutations)', 2, 2000, 256,
     '给定一个不含重复数字的数组 nums，返回其所有可能的全排列。你可以按任意顺序返回答案。',
     '输入样例：\n1 2 3\n输出样例：\n[1 2 3] [1 3 2] [2 1 3] [2 3 1] [3 1 2] [3 2 1]',
     'public java.util.List<java.util.List<Integer>> permute(int[] nums) {\n    // TODO\n    return new java.util.ArrayList<>();\n}',
     'public java.util.List<java.util.List<Integer>> permute(int[] n){var r=new java.util.ArrayList<java.util.List<Integer>>();bt(n,0,r);return r;}\nprivate void bt(int[] n,int f,java.util.List<java.util.List<Integer>> r){if(f==n.length){var p=new java.util.ArrayList<Integer>();for(int x:n)p.add(x);r.add(p);return;}\nfor(int i=f;i<n.length;i++){int t=n[f];n[f]=n[i];n[i]=t;bt(n,f+1,r);t=n[f];n[f]=n[i];n[i]=t;}}',
     1, NOW(), 1, NOW()),
    -- 4. 寻找两个正序数组的中位数 (困难)
    (8, '4. 寻找两个正序数组的中位数', 3, 2000, 256,
     '给定两个大小分别为 m 和 n 的正序（从小到大）数组 nums1 和 nums2。请你找出并返回这两个正序数组的中位数。\n要求算法的时间复杂度应该为 O(log (m+n))。',
     '输入样例：\nnums1 = [1, 3], nums2 = [2]\n输出样例：\n2.0',
     'public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n    // TODO\n    return 0.0;\n}',
     'public double findMedianSortedArrays(int[] a,int[] b){int m=a.length,n=b.length;if(m>n)return findMedianSortedArrays(b,a);\nint l=0,h=m,k=(m+n+1)/2;while(l<=h){int i=(l+h)/2,j=k-i;\nint al=i==0?Integer.MIN_VALUE:a[i-1],ar=i==m?Integer.MAX_VALUE:a[i],bl=j==0?Integer.MIN_VALUE:b[j-1],br=j==n?Integer.MAX_VALUE:b[j];\nif(al<=br&&bl<=ar){if((m+n)%2==1)return Math.max(al,bl);return(Math.max(al,bl)+Math.min(ar,br))/2.0;}\nelse if(al>br)h=i-1;else l=i+1;}return 0.0;}',
     1, NOW(), 1, NOW()),
    -- 42. 接雨水 (困难)
    (9, '42. 接雨水 (Trapping Rain Water)', 3, 2000, 256,
     '给定 n 个非负整数表示每个宽度为 1 的柱子的高度图，计算按此排列的柱子，下雨之后能接多少雨水。',
     '输入样例：\n0 1 0 2 1 0 1 3 2 1 2 1\n输出样例：\n6',
     'public int trap(int[] height) {\n    // TODO\n    return 0;\n}',
     'public int trap(int[] h) {\n    int l = 0, r = h.length - 1, leftMax = 0, rightMax = 0, res = 0;\n    while (l < r) {\n        leftMax = Math.max(leftMax, h[l]);\n        rightMax = Math.max(rightMax, h[r]);\n        if (h[l] < h[r]) res += leftMax - h[l++];\n        else res += rightMax - h[r--];\n    }\n    return res;\n}',
     1, NOW(), 1, NOW()),
    -- 23. 合并 K 个升序链表 (困难)
    (10, '23. 合并 K 个升序链表', 3, 2000, 512,
     '给你一个链表数组，每个链表都已经按升序排列。请你将所有链表合并到一个升序链表中，返回合并后的链表。\n其中 ListNode 的定义为：class ListNode { int val; ListNode next; }',
     '输入样例：\n[1->4->5, 1->3->4, 2->6]\n输出样例：\n1->1->2->3->4->4->5->6',
     'public ListNode mergeKLists(ListNode[] lists) {\n    // TODO\n    return null;\n}',
     'public ListNode mergeKLists(ListNode[] lists) {\n    java.util.PriorityQueue<ListNode> pq = new java.util.PriorityQueue<>((x, y) -> x.val - y.val);\n    for (ListNode n : lists) if (n != null) pq.offer(n);\n    ListNode dummy = new ListNode(0), cur = dummy;\n    while (!pq.isEmpty()) {\n        ListNode n = pq.poll(); cur.next = n;\n        if (n.next != null) pq.offer(n.next);\n        cur = cur.next;\n    }\n    return dummy.next;\n}',
     1, NOW(), 1, NOW());
