USE `db_code_forge`;
SET NAMES utf8mb4;
-- 负责明确题目对于竞赛的所属关系

-- ============ W1：10-12 ~ 10-18 ============
-- 竞赛 11：入门周·算术与输入输出（1,2,4,28,33,36,37,38,39,45）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(1,1,1,NOW(),NULL,NULL),(2,11,1,NOW(),NULL,NULL),(4,11,1,NOW(),NULL,NULL),
(28,1,1,NOW(),NULL,NULL),(33,11,1,NOW(),NULL,NULL),(36,11,1,NOW(),NULL,NULL),
(37,1,1,NOW(),NULL,NULL),(38,11,1,NOW(),NULL,NULL),(39,11,1,NOW(),NULL,NULL),
(45,1,1,NOW(),NULL,NULL);

-- 竞赛 12：入门周·整数性质判断（3,29,30,31,32,40,42,43,54,74）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(3,2,1,NOW(),NULL,NULL),(29,12,1,NOW(),NULL,NULL),(30,12,1,NOW(),NULL,NULL),
(31,2,1,NOW(),NULL,NULL),(32,12,1,NOW(),NULL,NULL),(40,12,1,NOW(),NULL,NULL),
(42,2,1,NOW(),NULL,NULL),(43,12,1,NOW(),NULL,NULL),(54,12,1,NOW(),NULL,NULL),
(74,2,1,NOW(),NULL,NULL);

-- ============ W2：10-19 ~ 10-25 ============
-- 竞赛 13：循环与数列专题（5,6,9,10,22,23,24,25,26,27,41,44）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(5,3,1,NOW(),NULL,NULL),(6,13,1,NOW(),NULL,NULL),(9,13,1,NOW(),NULL,NULL),
(10,3,1,NOW(),NULL,NULL),(22,13,1,NOW(),NULL,NULL),(23,13,1,NOW(),NULL,NULL),
(24,3,1,NOW(),NULL,NULL),(25,13,1,NOW(),NULL,NULL),(26,13,1,NOW(),NULL,NULL),
(27,3,1,NOW(),NULL,NULL),(41,13,1,NOW(),NULL,NULL),(44,13,1,NOW(),NULL,NULL);

-- 竞赛 14：阶乘与组合数入门（46,47,48,49,50,51,52,53,55,56,57）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(46,4,1,NOW(),NULL,NULL),(47,14,1,NOW(),NULL,NULL),(48,14,1,NOW(),NULL,NULL),
(49,4,1,NOW(),NULL,NULL),(50,14,1,NOW(),NULL,NULL),(51,14,1,NOW(),NULL,NULL),
(52,4,1,NOW(),NULL,NULL),(53,14,1,NOW(),NULL,NULL),(55,14,1,NOW(),NULL,NULL),
(56,4,1,NOW(),NULL,NULL),(57,14,1,NOW(),NULL,NULL);

-- ============ W3：10-26 ~ 11-01 ============
-- 竞赛 15：数字位运算与数位处理（11,12,34,35,77,78,86,98,99）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(11,5,1,NOW(),NULL,NULL),(12,15,1,NOW(),NULL,NULL),(34,15,1,NOW(),NULL,NULL),
(35,5,1,NOW(),NULL,NULL),(77,15,1,NOW(),NULL,NULL),(78,15,1,NOW(),NULL,NULL),
(86,5,1,NOW(),NULL,NULL),(98,15,1,NOW(),NULL,NULL),(99,15,1,NOW(),NULL,NULL);

-- 竞赛 16：一维数组遍历与统计（7,13,14,15,16,58,59,62,63,64）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(7,6,1,NOW(),NULL,NULL),(13,16,1,NOW(),NULL,NULL),(14,16,1,NOW(),NULL,NULL),
(15,6,1,NOW(),NULL,NULL),(16,16,1,NOW(),NULL,NULL),(58,16,1,NOW(),NULL,NULL),
(59,6,1,NOW(),NULL,NULL),(62,16,1,NOW(),NULL,NULL),(63,16,1,NOW(),NULL,NULL),
(64,6,1,NOW(),NULL,NULL);

-- ============ W4：11-02 ~ 11-08 ============
-- 竞赛 17：数组查找与计数（65,66,67,68,69,70,71,72,73）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(65,7,1,NOW(),NULL,NULL),(66,17,1,NOW(),NULL,NULL),(67,17,1,NOW(),NULL,NULL),
(68,7,1,NOW(),NULL,NULL),(69,17,1,NOW(),NULL,NULL),(70,17,1,NOW(),NULL,NULL),
(71,7,1,NOW(),NULL,NULL),(72,17,1,NOW(),NULL,NULL),(73,17,1,NOW(),NULL,NULL);

-- 竞赛 18：数组排序与极值（79,80,81,82,83,84,85,87,88,89）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(79,8,1,NOW(),NULL,NULL),(80,18,1,NOW(),NULL,NULL),(81,18,1,NOW(),NULL,NULL),
(82,8,1,NOW(),NULL,NULL),(83,18,1,NOW(),NULL,NULL),(84,18,1,NOW(),NULL,NULL),
(85,8,1,NOW(),NULL,NULL),(87,18,1,NOW(),NULL,NULL),(88,18,1,NOW(),NULL,NULL),
(89,8,1,NOW(),NULL,NULL);

-- ============ W5：11-09 ~ 11-15 ============
-- 竞赛 19：数组去重与集合运算（90,91,92,93,94,95,96,97）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(90,9,1,NOW(),NULL,NULL),(91,19,1,NOW(),NULL,NULL),(92,19,1,NOW(),NULL,NULL),
(93,9,1,NOW(),NULL,NULL),(94,19,1,NOW(),NULL,NULL),(95,19,1,NOW(),NULL,NULL),
(96,9,1,NOW(),NULL,NULL),(97,19,1,NOW(),NULL,NULL);

-- 竞赛 20：字符串基础操作（8,17,18,19,20,21,100,101,102）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(8,10,1,NOW(),NULL,NULL),(17,20,1,NOW(),NULL,NULL),(18,20,1,NOW(),NULL,NULL),
(19,10,1,NOW(),NULL,NULL),(20,20,1,NOW(),NULL,NULL),(21,20,1,NOW(),NULL,NULL),
(100,10,1,NOW(),NULL,NULL),(101,20,1,NOW(),NULL,NULL),(102,20,1,NOW(),NULL,NULL);

-- ============ W6：11-16 ~ 11-22 ============
-- 竞赛 21：字符串判断与统计（103,104,105,106,107,1,2,3,4）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(103,11,1,NOW(),NULL,NULL),(104,21,1,NOW(),NULL,NULL),(105,21,1,NOW(),NULL,NULL),
(106,11,1,NOW(),NULL,NULL),(107,21,1,NOW(),NULL,NULL),(1,21,1,NOW(),NULL,NULL),
(2,11,1,NOW(),NULL,NULL),(3,21,1,NOW(),NULL,NULL),(4,21,1,NOW(),NULL,NULL);

-- 竞赛 22：字符串压缩与提取（5,6,7,8,9,10,11,12,13）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(5,12,1,NOW(),NULL,NULL),(6,22,1,NOW(),NULL,NULL),(7,22,1,NOW(),NULL,NULL),
(8,12,1,NOW(),NULL,NULL),(9,22,1,NOW(),NULL,NULL),(10,22,1,NOW(),NULL,NULL),
(11,12,1,NOW(),NULL,NULL),(12,22,1,NOW(),NULL,NULL),(13,22,1,NOW(),NULL,NULL);

-- ============ W7：11-23 ~ 11-29 ============
-- 竞赛 23：进制转换与位运算（14,15,16,17,18,19,20,21,22）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(14,13,1,NOW(),NULL,NULL),(15,23,1,NOW(),NULL,NULL),(16,23,1,NOW(),NULL,NULL),
(17,13,1,NOW(),NULL,NULL),(18,23,1,NOW(),NULL,NULL),(19,23,1,NOW(),NULL,NULL),
(20,13,1,NOW(),NULL,NULL),(21,23,1,NOW(),NULL,NULL),(22,23,1,NOW(),NULL,NULL);

-- 竞赛 24：数学与几何计算（23,24,25,26,27,28,29,30,31）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(23,14,1,NOW(),NULL,NULL),(24,24,1,NOW(),NULL,NULL),(25,24,1,NOW(),NULL,NULL),
(26,14,1,NOW(),NULL,NULL),(27,24,1,NOW(),NULL,NULL),(28,24,1,NOW(),NULL,NULL),
(29,14,1,NOW(),NULL,NULL),(30,24,1,NOW(),NULL,NULL),(31,24,1,NOW(),NULL,NULL);

-- ============ W8：11-30 ~ 12-06 ============
-- 竞赛 25：日期与条件分支综合（32,33,34,35,36,37,38,39,40）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(32,15,1,NOW(),NULL,NULL),(33,25,1,NOW(),NULL,NULL),(34,25,1,NOW(),NULL,NULL),
(35,15,1,NOW(),NULL,NULL),(36,25,1,NOW(),NULL,NULL),(37,25,1,NOW(),NULL,NULL),
(38,15,1,NOW(),NULL,NULL),(39,25,1,NOW(),NULL,NULL),(40,25,1,NOW(),NULL,NULL);

-- 竞赛 26：双指针与数组原地操作（41,42,43,44,45,46,47,48,49）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(41,16,1,NOW(),NULL,NULL),(42,26,1,NOW(),NULL,NULL),(43,26,1,NOW(),NULL,NULL),
(44,16,1,NOW(),NULL,NULL),(45,26,1,NOW(),NULL,NULL),(46,26,1,NOW(),NULL,NULL),
(47,16,1,NOW(),NULL,NULL),(48,26,1,NOW(),NULL,NULL),(49,26,1,NOW(),NULL,NULL);

-- ============ W9：12-07 ~ 12-13 ============
-- 竞赛 27：哈希表与计数技巧（50,51,52,53,54,55,56,57,58）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(50,17,1,NOW(),NULL,NULL),(51,27,1,NOW(),NULL,NULL),(52,27,1,NOW(),NULL,NULL),
(53,17,1,NOW(),NULL,NULL),(54,27,1,NOW(),NULL,NULL),(55,27,1,NOW(),NULL,NULL),
(56,17,1,NOW(),NULL,NULL),(57,27,1,NOW(),NULL,NULL),(58,27,1,NOW(),NULL,NULL);

-- 竞赛 28：动态规划入门（59,60,61,62,63,64,65,66,67）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(59,18,1,NOW(),NULL,NULL),(60,28,1,NOW(),NULL,NULL),(61,28,1,NOW(),NULL,NULL),
(62,18,1,NOW(),NULL,NULL),(63,28,1,NOW(),NULL,NULL),(64,28,1,NOW(),NULL,NULL),
(65,18,1,NOW(),NULL,NULL),(66,28,1,NOW(),NULL,NULL),(67,28,1,NOW(),NULL,NULL);

-- ============ W10：12-14 ~ 12-20 ============
-- 竞赛 29：栈与队列经典应用（68,69,70,71,72,73,74,75,76）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(68,19,1,NOW(),NULL,NULL),(69,29,1,NOW(),NULL,NULL),(70,29,1,NOW(),NULL,NULL),
(71,19,1,NOW(),NULL,NULL),(72,29,1,NOW(),NULL,NULL),(73,29,1,NOW(),NULL,NULL),
(74,19,1,NOW(),NULL,NULL),(75,29,1,NOW(),NULL,NULL),(76,29,1,NOW(),NULL,NULL);

-- 竞赛 30：链表与指针思想（77,78,79,80,81,82,83,84,85）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(77,20,1,NOW(),NULL,NULL),(78,30,1,NOW(),NULL,NULL),(79,30,1,NOW(),NULL,NULL),
(80,20,1,NOW(),NULL,NULL),(81,30,1,NOW(),NULL,NULL),(82,30,1,NOW(),NULL,NULL),
(83,20,1,NOW(),NULL,NULL),(84,30,1,NOW(),NULL,NULL),(85,30,1,NOW(),NULL,NULL);

-- ============ W11：12-21 ~ 12-27 ============
-- 竞赛 31：字符串高频面试题（86,87,88,89,90,91,92,93,94）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(86,21,1,NOW(),NULL,NULL),(87,31,1,NOW(),NULL,NULL),(88,31,1,NOW(),NULL,NULL),
(89,21,1,NOW(),NULL,NULL),(90,31,1,NOW(),NULL,NULL),(91,31,1,NOW(),NULL,NULL),
(92,21,1,NOW(),NULL,NULL),(93,31,1,NOW(),NULL,NULL),(94,31,1,NOW(),NULL,NULL);

-- 竞赛 32：数组高频面试题（95,96,97,98,99,100,101,102,103）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(95,22,1,NOW(),NULL,NULL),(96,32,1,NOW(),NULL,NULL),(97,32,1,NOW(),NULL,NULL),
(98,22,1,NOW(),NULL,NULL),(99,32,1,NOW(),NULL,NULL),(100,32,1,NOW(),NULL,NULL),
(101,22,1,NOW(),NULL,NULL),(102,32,1,NOW(),NULL,NULL),(103,32,1,NOW(),NULL,NULL);

-- ============ W12：12-28 ~ 12-31 ============
-- 竞赛 33：算法综合挑战（上）（104,105,106,107,1,2,3,4,5）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(104,23,1,NOW(),NULL,NULL),(105,33,1,NOW(),NULL,NULL),(106,33,1,NOW(),NULL,NULL),
(107,23,1,NOW(),NULL,NULL),(1,33,1,NOW(),NULL,NULL),(2,33,1,NOW(),NULL,NULL),
(3,23,1,NOW(),NULL,NULL),(4,33,1,NOW(),NULL,NULL),(5,33,1,NOW(),NULL,NULL);

-- 竞赛 34：算法综合挑战（下）（6,7,8,9,10,11,12,13,14）9 题
-- 注意：竞赛 34 与竞赛 33 在 12-30 有 1 天重叠，因此两者题目必须互斥。
-- 上面竞赛 33 用了 {104,105,106,107,1,2,3,4,5}，这里用 {6,7,8,9,10,11,12,13,14}，无交集。
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(6,24,1,NOW(),NULL,NULL),(7,34,1,NOW(),NULL,NULL),(8,34,1,NOW(),NULL,NULL),
(9,24,1,NOW(),NULL,NULL),(10,34,1,NOW(),NULL,NULL),(11,34,1,NOW(),NULL,NULL),
(12,24,1,NOW(),NULL,NULL),(13,34,1,NOW(),NULL,NULL),(14,34,1,NOW(),NULL,NULL);