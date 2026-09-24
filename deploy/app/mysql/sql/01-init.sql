CREATE USER 'wjl'@'%' IDENTIFIED BY 'wjl@123';
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'wjl'@'%';

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `db_code_forge` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE DATABASE IF NOT EXISTS `frameworkjava_nacos_test` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE DATABASE IF NOT EXISTS `frameworkjava_test` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- 授权
GRANT ALL PRIVILEGES ON db_code_forge.* TO 'wjl'@'%';
GRANT ALL PRIVILEGES ON frameworkjava_nacos_test.* TO 'wjl'@'%';
GRANT ALL PRIVILEGES ON frameworkjava_test.* TO 'wjl'@'%';
FLUSH PRIVILEGES;

USE `db_code_forge`;

-- 系统管理员信息表
DROP TABLE IF EXISTS `tb_sys_user`;
CREATE TABLE `tb_sys_user` (
    `id`           bigint        unsigned NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
    `user_id`      bigint(20)    unsigned NOT NULL COMMENT '用户id' UNIQUE KEY,
    `user_account` varchar(32)   DEFAULT NULL COMMENT '用户账号',
    `password`     varchar(100)  DEFAULT NULL COMMENT '用户密码',
    `nick_name`    varchar(32)   DEFAULT NULL COMMENT '昵称',
    `create_by`    bigint(8)     NOT NULL COMMENT '创建用户',
    `create_time`  datetime      NOT NULL COMMENT '创建时间',
    `update_by`    bigint(8)     DEFAULT NULL COMMENT '更新用户',
    `update_time`  datetime      DEFAULT NULL COMMENT '更新时间',
    UNIQUE KEY `user_account` (`user_account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理端用户表';

-- 初始化默认管理员
INSERT INTO tb_sys_user VALUES (0, 1, 'admin', 'admin@123', 'admin', 1, NOW(), 1, NOW());

-- 题目信息表
DROP TABLE IF EXISTS `tb_question`;
CREATE TABLE `tb_question` (
    id            bigint        unsigned NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
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
    update_time   datetime      COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目信息表' AUTO_INCREMENT=10000000;

-- 竞赛信息表
CREATE TABLE tb_exam (
    exam_id bigint UNSIGNED AUTO_INCREMENT comment '竞赛id（主键）',
    title varchar(50) NOT NULL comment '竞赛标题',
    start_time datetime NOT NULL comment '竞赛开始时间',
    end_time datetime NOT NULL comment '竞赛结束时间',
    status tinyint NOT NULL default '0' comment '是否发布 0：未发布  1：已发布',
    create_by bigint UNSIGNED NOT NULL comment '创建人',
    create_time datetime NOT NULL comment '创建时间',
    update_by bigint UNSIGNED comment '更新人',
    update_time datetime comment '更新时间',
    PRIMARY KEY (exam_id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='竞赛信息表' AUTO_INCREMENT 20000000;

-- 竞赛题目表
CREATE TABLE tb_exam_question (
    exam_question_id bigint UNSIGNED AUTO_INCREMENT comment '竞赛题目关系id（主键）',
    question_id bigint UNSIGNED NOT NULL comment '题目id（题目表主键）',
    exam_id bigint UNSIGNED NOT NULL comment '竞赛id（竞赛表主键）',
    create_by bigint UNSIGNED NOT NULL comment '创建人',
    create_time datetime NOT NULL comment '创建时间',
    update_by bigint UNSIGNED comment '更新人',
    update_time datetime comment '更新时间',
    PRIMARY KEY (exam_question_id)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='竞赛题目表' AUTO_INCREMENT 30000000;