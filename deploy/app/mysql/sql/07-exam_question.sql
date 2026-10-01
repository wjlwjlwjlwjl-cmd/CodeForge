USE `db_code_forge`;
SET NAMES utf8mb4;
INSERT INTO tb_exam_question (question_id, exam_id, create_by, create_time, update_by, update_time)
VALUES
-- exam_id=1 分配 question_id 1~10
(1, 1, 1, now(), NULL, NULL),
(2, 1, 1, now(), NULL, NULL),
(3, 1, 1, now(), NULL, NULL),
(4, 1, 1, now(), NULL, NULL),
(5, 1, 1, now(), NULL, NULL),
(6, 1, 1, now(), NULL, NULL),
(7, 1, 1, now(), NULL, NULL),
(8, 1, 1, now(), NULL, NULL),
(9, 1, 1, now(), NULL, NULL),
(10, 1, 1, now(), NULL, NULL),

-- exam_id=2 分配 question_id 11~20
(11, 2, 1, now(), NULL, NULL),
(12, 2, 1, now(), NULL, NULL),
(13, 2, 1, now(), NULL, NULL),
(14, 2, 1, now(), NULL, NULL),
(15, 2, 1, now(), NULL, NULL),
(16, 2, 1, now(), NULL, NULL),
(17, 2, 1, now(), NULL, NULL),
(18, 2, 1, now(), NULL, NULL),
(19, 2, 1, now(), NULL, NULL),
(20, 2, 1, now(), NULL, NULL),

-- exam_id=3 分配 question_id 21~30
(21, 3, 1, now(), NULL, NULL),
(22, 3, 1, now(), NULL, NULL),
(23, 3, 1, now(), NULL, NULL),
(24, 3, 1, now(), NULL, NULL),
(25, 3, 1, now(), NULL, NULL),
(26, 3, 1, now(), NULL, NULL),
(27, 3, 1, now(), NULL, NULL),
(28, 3, 1, now(), NULL, NULL),
(29, 3, 1, now(), NULL, NULL),
(30, 3, 1, now(), NULL, NULL),

-- exam_id=4 分配 question_id 31~40
(31, 4, 1, now(), NULL, NULL),
(32, 4, 1, now(), NULL, NULL),
(33, 4, 1, now(), NULL, NULL),
(34, 4, 1, now(), NULL, NULL),
(35, 4, 1, now(), NULL, NULL),
(36, 4, 1, now(), NULL, NULL),
(37, 4, 1, now(), NULL, NULL),
(38, 4, 1, now(), NULL, NULL),
(39, 4, 1, now(), NULL, NULL),
(40, 4, 1, now(), NULL, NULL),

-- exam_id=5 分配 question_id 41~50
(41, 5, 1, now(), NULL, NULL),
(42, 5, 1, now(), NULL, NULL),
(43, 5, 1, now(), NULL, NULL),
(44, 5, 1, now(), NULL, NULL),
(45, 5, 1, now(), NULL, NULL),
(46, 5, 1, now(), NULL, NULL),
(47, 5, 1, now(), NULL, NULL),
(48, 5, 1, now(), NULL, NULL),
(49, 5, 1, now(), NULL, NULL),
(50, 5, 1, now(), NULL, NULL),

-- exam_id=6 分配 question_id 51~60
(51, 6, 1, now(), NULL, NULL),
(52, 6, 1, now(), NULL, NULL),
(53, 6, 1, now(), NULL, NULL),
(54, 6, 1, now(), NULL, NULL),
(55, 6, 1, now(), NULL, NULL),
(56, 6, 1, now(), NULL, NULL),
(57, 6, 1, now(), NULL, NULL),
(58, 6, 1, now(), NULL, NULL),
(59, 6, 1, now(), NULL, NULL),
(60, 6, 1, now(), NULL, NULL),

-- exam_id=7 分配 question_id 61~70
(61, 7, 1, now(), NULL, NULL),
(62, 7, 1, now(), NULL, NULL),
(63, 7, 1, now(), NULL, NULL),
(64, 7, 1, now(), NULL, NULL),
(65, 7, 1, now(), NULL, NULL),
(66, 7, 1, now(), NULL, NULL),
(67, 7, 1, now(), NULL, NULL),
(68, 7, 1, now(), NULL, NULL),
(69, 7, 1, now(), NULL, NULL),
(70, 7, 1, now(), NULL, NULL),

-- exam_id=8 分配 question_id 71~80
(71, 8, 1, now(), NULL, NULL),
(72, 8, 1, now(), NULL, NULL),
(73, 8, 1, now(), NULL, NULL),
(74, 8, 1, now(), NULL, NULL),
(75, 8, 1, now(), NULL, NULL),
(76, 8, 1, now(), NULL, NULL),
(77, 8, 1, now(), NULL, NULL),
(78, 8, 1, now(), NULL, NULL),
(79, 8, 1, now(), NULL, NULL),
(80, 8, 1, now(), NULL, NULL),

-- exam_id=9 分配 question_id 81~90
(81, 9, 1, now(), NULL, NULL),
(82, 9, 1, now(), NULL, NULL),
(83, 9, 1, now(), NULL, NULL),
(84, 9, 1, now(), NULL, NULL),
(85, 9, 1, now(), NULL, NULL),
(86, 9, 1, now(), NULL, NULL),
(87, 9, 1, now(), NULL, NULL),
(88, 9, 1, now(), NULL, NULL),
(89, 9, 1, now(), NULL, NULL),
(90, 9, 1, now(), NULL, NULL),

-- exam_id=10 分配 question_id 91~100
(91, 10, 1, now(), NULL, NULL),
(92, 10, 1, now(), NULL, NULL),
(93, 10, 1, now(), NULL, NULL),
(94, 10, 1, now(), NULL, NULL),
(95, 10, 1, now(), NULL, NULL),
(96, 10, 1, now(), NULL, NULL),
(97, 10, 1, now(), NULL, NULL),
(98, 10, 1, now(), NULL, NULL),
(99, 10, 1, now(), NULL, NULL),
(100, 10, 1, now(), NULL, NULL);