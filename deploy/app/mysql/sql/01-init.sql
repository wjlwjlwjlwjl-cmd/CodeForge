CREATE USER 'wjl'@'%' IDENTIFIED BY 'wjl@123';
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'wjl'@'%';

# 创建数据库
CREATE DATABASE IF NOT EXISTS `db_code_forge` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE DATABASE IF NOT EXISTS `frameworkjava_nacos_test` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE DATABASE IF NOT EXISTS `frameworkjava_test` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

# 授权
GRANT ALL PRIVILEGES ON db_code_forge.* TO 'wjl'@'%';
GRANT ALL PRIVILEGES ON frameworkjava_nacos_test.* TO 'wjl'@'%';
GRANT ALL PRIVILEGES ON frameworkjava_test.* TO 'wjl'@'%';
FLUSH PRIVILEGES;

USE `db_code_forge`;

# 系统管理员信息表
DROP TABLE IF EXISTS `tb_sys_user`;
CREATE TABLE `tb_sys_user` (
    `id`           bigint        unsigned NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `user_id`      bigint(20)    unsigned NOT NULL COMMENT '用户id',
    `user_account` varchar(32)   DEFAULT NULL COMMENT '用户账号',
    `password`     varchar(100)  DEFAULT NULL COMMENT '用户密码',
    `nick_name`    varchar(32)   DEFAULT NULL COMMENT '昵称',
    `create_by`    bigint(8)     NOT NULL COMMENT '创建用户',
    `create_time`  datetime      NOT NULL COMMENT '创建时间',
    `update_by`    bigint(8)     DEFAULT NULL COMMENT '更新用户',
    `update_time`  datetime      DEFAULT NULL COMMENT '更新时间',
    UNIQUE KEY `user_account` (`user_account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理端用户表';

# 初始化默认管理员
INSERT INTO tb_sys_user VALUES (0, 1, 'admin', 'admin@123', 'admin', 1, NOW(), 1, NOW());

# 题目信息表
DROP TABLE IF EXISTS `tb_question`;
CREATE TABLE `tb_question` (
    id            bigint        unsigned NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    question_id   bigint        unsigned NOT NULL COMMENT '题目id',
    title         varchar(50)   NOT NULL COMMENT '题目标题',
    difficulty    tinyint       NOT NULL COMMENT '题目难度1:简单  2：中等 3：困难',
    time_limit    int           NOT NULL COMMENT '时间限制',
    space_limit   int           NOT NULL COMMENT '空间限制',
    content       varchar(1000) NOT NULL COMMENT '题目内容',
    question_case varchar(1000) COMMENT '题目用例',
    default_code  varchar(500)  NOT NULL COMMENT '默认代码块',
    main_fuc      varchar(500)  NOT NULL COMMENT 'main函数',
    create_by     bigint        unsigned NOT NULL COMMENT '创建人',
    create_time   datetime      NOT NULL COMMENT '创建时间',
    update_by     bigint        unsigned COMMENT '更新人',
    update_time   datetime      COMMENT '更新时间',
    UNIQUE KEY `question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目信息表';

# 初始化模板题
INSERT INTO `tb_question`
    (question_id, title, difficulty, time_limit, space_limit,
     content, question_case, default_code, main_fuc,
     create_by, create_time, update_by, update_time)
VALUES
    (1001,
     'A + B Problem',
     1,
     1000,
     256,
     '输入两个整数 a 和 b，计算并输出它们的和。\n\n输入格式：一行两个整数 a, b (1 <= a,b <= 1000)。\n输出格式：一个整数，表示 a + b。',
     '输入样例：\n1 2\n\n输出样例：\n3',
     'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        System.out.println(sum(a, b));\n    }\n\n    public static int sum(int a, int b) {\n        // 请在此实现\n        return 0;\n    }\n}',
     'public static int sum(int a, int b) {\n    return a + b;\n}',
     1,
     NOW(),
     1,
     NOW());
