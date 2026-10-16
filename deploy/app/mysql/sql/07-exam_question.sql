USE `db_code_forge`;
SET NAMES utf8mb4;
-- 负责明确题目对于竞赛的所属关系

-- 竞赛 1：入门周·算术与输入输出（4 题：1,28,37,45）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(1,1,1,NOW(),NULL,NULL),(28,1,1,NOW(),NULL,NULL),(37,1,1,NOW(),NULL,NULL),
(45,1,1,NOW(),NULL,NULL);

-- 竞赛 2：入门周·整数性质判断（4 题：3,31,42,74）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(3,2,1,NOW(),NULL,NULL),(31,2,1,NOW(),NULL,NULL),(42,2,1,NOW(),NULL,NULL),
(74,2,1,NOW(),NULL,NULL);

-- 竞赛 3：循环与数列专题（4 题：5,10,24,27）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(5,3,1,NOW(),NULL,NULL),(10,3,1,NOW(),NULL,NULL),(24,3,1,NOW(),NULL,NULL),
(27,3,1,NOW(),NULL,NULL);

-- 竞赛 4：阶乘与组合数入门（4 题：46,49,52,56）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(46,4,1,NOW(),NULL,NULL),(49,4,1,NOW(),NULL,NULL),(52,4,1,NOW(),NULL,NULL),
(56,4,1,NOW(),NULL,NULL);

-- 竞赛 5：数字位运算与数位处理（3 题：11,35,86）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(11,5,1,NOW(),NULL,NULL),(35,5,1,NOW(),NULL,NULL),(86,5,1,NOW(),NULL,NULL);

-- 竞赛 6：一维数组遍历与统计（4 题：7,15,59,64）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(7,6,1,NOW(),NULL,NULL),(15,6,1,NOW(),NULL,NULL),(59,6,1,NOW(),NULL,NULL),
(64,6,1,NOW(),NULL,NULL);

-- 竞赛 7：数组查找与计数（3 题：65,68,71）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(65,7,1,NOW(),NULL,NULL),(68,7,1,NOW(),NULL,NULL),(71,7,1,NOW(),NULL,NULL);

-- 竞赛 8：数组排序与极值（4 题：79,82,85,89）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(79,8,1,NOW(),NULL,NULL),(82,8,1,NOW(),NULL,NULL),(85,8,1,NOW(),NULL,NULL),
(89,8,1,NOW(),NULL,NULL);

-- 竞赛 9：数组去重与集合运算（3 题：90,93,96）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(90,9,1,NOW(),NULL,NULL),(93,9,1,NOW(),NULL,NULL),(96,9,1,NOW(),NULL,NULL);

-- 竞赛 10：字符串基础操作（3 题：8,19,100）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(8,10,1,NOW(),NULL,NULL),(19,10,1,NOW(),NULL,NULL),(100,10,1,NOW(),NULL,NULL);

-- 竞赛 11：字符串判断与统计（9 题：2,2,4,33,36,38,39,103,106）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(2,11,1,NOW(),NULL,NULL),(2,11,1,NOW(),NULL,NULL),(4,11,1,NOW(),NULL,NULL),
(33,11,1,NOW(),NULL,NULL),(36,11,1,NOW(),NULL,NULL),(38,11,1,NOW(),NULL,NULL),
(39,11,1,NOW(),NULL,NULL),(103,11,1,NOW(),NULL,NULL),(106,11,1,NOW(),NULL,NULL);

-- 竞赛 12：字符串压缩与提取（9 题：5,8,11,29,30,32,40,43,54）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(5,12,1,NOW(),NULL,NULL),(8,12,1,NOW(),NULL,NULL),(11,12,1,NOW(),NULL,NULL),
(29,12,1,NOW(),NULL,NULL),(30,12,1,NOW(),NULL,NULL),(32,12,1,NOW(),NULL,NULL),
(40,12,1,NOW(),NULL,NULL),(43,12,1,NOW(),NULL,NULL),(54,12,1,NOW(),NULL,NULL);

-- 竞赛 13：进制转换与位运算（11 题：6,9,14,17,20,22,23,25,26,41,44）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(6,13,1,NOW(),NULL,NULL),(9,13,1,NOW(),NULL,NULL),(14,13,1,NOW(),NULL,NULL),
(17,13,1,NOW(),NULL,NULL),(20,13,1,NOW(),NULL,NULL),(22,13,1,NOW(),NULL,NULL),
(23,13,1,NOW(),NULL,NULL),(25,13,1,NOW(),NULL,NULL),(26,13,1,NOW(),NULL,NULL),
(41,13,1,NOW(),NULL,NULL),(44,13,1,NOW(),NULL,NULL);

-- 竞赛 14：数学与几何计算（10 题：23,26,29,47,48,50,51,53,55,57）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(23,14,1,NOW(),NULL,NULL),(26,14,1,NOW(),NULL,NULL),(29,14,1,NOW(),NULL,NULL),
(47,14,1,NOW(),NULL,NULL),(48,14,1,NOW(),NULL,NULL),(50,14,1,NOW(),NULL,NULL),
(51,14,1,NOW(),NULL,NULL),(53,14,1,NOW(),NULL,NULL),(55,14,1,NOW(),NULL,NULL),
(57,14,1,NOW(),NULL,NULL);

-- 竞赛 15：日期与条件分支综合（9 题：12,32,34,35,38,77,78,98,99）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(12,15,1,NOW(),NULL,NULL),(32,15,1,NOW(),NULL,NULL),(34,15,1,NOW(),NULL,NULL),
(35,15,1,NOW(),NULL,NULL),(38,15,1,NOW(),NULL,NULL),(77,15,1,NOW(),NULL,NULL),
(78,15,1,NOW(),NULL,NULL),(98,15,1,NOW(),NULL,NULL),(99,15,1,NOW(),NULL,NULL);

-- 竞赛 16：双指针与数组原地操作（9 题：13,14,16,41,44,47,58,62,63）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(13,16,1,NOW(),NULL,NULL),(14,16,1,NOW(),NULL,NULL),(16,16,1,NOW(),NULL,NULL),
(41,16,1,NOW(),NULL,NULL),(44,16,1,NOW(),NULL,NULL),(47,16,1,NOW(),NULL,NULL),
(58,16,1,NOW(),NULL,NULL),(62,16,1,NOW(),NULL,NULL),(63,16,1,NOW(),NULL,NULL);

-- 竞赛 17：哈希表与计数技巧（9 题：50,53,56,66,67,69,70,72,73）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(50,17,1,NOW(),NULL,NULL),(53,17,1,NOW(),NULL,NULL),(56,17,1,NOW(),NULL,NULL),
(66,17,1,NOW(),NULL,NULL),(67,17,1,NOW(),NULL,NULL),(69,17,1,NOW(),NULL,NULL),
(70,17,1,NOW(),NULL,NULL),(72,17,1,NOW(),NULL,NULL),(73,17,1,NOW(),NULL,NULL);

-- 竞赛 18：动态规划入门（9 题：59,62,65,80,81,83,84,87,88）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(59,18,1,NOW(),NULL,NULL),(62,18,1,NOW(),NULL,NULL),(65,18,1,NOW(),NULL,NULL),
(80,18,1,NOW(),NULL,NULL),(81,18,1,NOW(),NULL,NULL),(83,18,1,NOW(),NULL,NULL),
(84,18,1,NOW(),NULL,NULL),(87,18,1,NOW(),NULL,NULL),(88,18,1,NOW(),NULL,NULL);

-- 竞赛 19：栈与队列经典应用（8 题：68,71,74,91,92,94,95,97）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(68,19,1,NOW(),NULL,NULL),(71,19,1,NOW(),NULL,NULL),(74,19,1,NOW(),NULL,NULL),
(91,19,1,NOW(),NULL,NULL),(92,19,1,NOW(),NULL,NULL),(94,19,1,NOW(),NULL,NULL),
(95,19,1,NOW(),NULL,NULL),(97,19,1,NOW(),NULL,NULL);

-- 竞赛 20：链表与指针思想（9 题：17,18,20,21,77,80,83,101,102）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(17,20,1,NOW(),NULL,NULL),(18,20,1,NOW(),NULL,NULL),(20,20,1,NOW(),NULL,NULL),
(21,20,1,NOW(),NULL,NULL),(77,20,1,NOW(),NULL,NULL),(80,20,1,NOW(),NULL,NULL),
(83,20,1,NOW(),NULL,NULL),(101,20,1,NOW(),NULL,NULL),(102,20,1,NOW(),NULL,NULL);

-- 竞赛 21：字符串高频面试题（9 题：1,3,4,86,89,92,104,105,107）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(1,21,1,NOW(),NULL,NULL),(3,21,1,NOW(),NULL,NULL),(4,21,1,NOW(),NULL,NULL),
(86,21,1,NOW(),NULL,NULL),(89,21,1,NOW(),NULL,NULL),(92,21,1,NOW(),NULL,NULL),
(104,21,1,NOW(),NULL,NULL),(105,21,1,NOW(),NULL,NULL),(107,21,1,NOW(),NULL,NULL);

-- 竞赛 22：数组高频面试题（9 题：6,7,9,10,12,13,95,98,101）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(6,22,1,NOW(),NULL,NULL),(7,22,1,NOW(),NULL,NULL),(9,22,1,NOW(),NULL,NULL),
(10,22,1,NOW(),NULL,NULL),(12,22,1,NOW(),NULL,NULL),(13,22,1,NOW(),NULL,NULL),
(95,22,1,NOW(),NULL,NULL),(98,22,1,NOW(),NULL,NULL),(101,22,1,NOW(),NULL,NULL);

-- 竞赛 23：算法综合挑战（上）（9 题：3,15,16,18,19,21,22,104,107）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(3,23,1,NOW(),NULL,NULL),(15,23,1,NOW(),NULL,NULL),(16,23,1,NOW(),NULL,NULL),
(18,23,1,NOW(),NULL,NULL),(19,23,1,NOW(),NULL,NULL),(21,23,1,NOW(),NULL,NULL),
(22,23,1,NOW(),NULL,NULL),(104,23,1,NOW(),NULL,NULL),(107,23,1,NOW(),NULL,NULL);

-- 竞赛 24：算法综合挑战（下）（9 题：6,9,12,24,25,27,28,30,31）
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time) VALUES
(6,24,1,NOW(),NULL,NULL),(9,24,1,NOW(),NULL,NULL),(12,24,1,NOW(),NULL,NULL),
(24,24,1,NOW(),NULL,NULL),(25,24,1,NOW(),NULL,NULL),(27,24,1,NOW(),NULL,NULL),
(28,24,1,NOW(),NULL,NULL),(30,24,1,NOW(),NULL,NULL),(31,24,1,NOW(),NULL,NULL);
