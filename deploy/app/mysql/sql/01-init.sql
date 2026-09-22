CREATE USER 'wjl'@'%' IDENTIFIED BY 'wjl@123';
grant replication slave, replication client on *.* to 'wjl'@'%';

# 创建数据库
CREATE database if NOT EXISTS `db_code_forge` default character set utf8mb4 collate utf8mb4_general_ci;
CREATE database if NOT EXISTS `frameworkjava_nacos_test` default character set utf8mb4 collate utf8mb4_general_ci;
CREATE database if NOT EXISTS `frameworkjava_test` default character set utf8mb4 collate utf8mb4_general_ci;

# 授权
GRANT ALL PRIVILEGES ON db_code_forge.* TO  'wjl'@'%';
GRANT ALL PRIVILEGES ON frameworkjava_nacos_test.* TO  'wjl'@'%';
GRANT ALL PRIVILEGES ON frameworkjava_test.* TO  'wjl'@'%';
FLUSH PRIVILEGES;

USE `db_code_forge`;
# 系统管理员信息表
DROP TABLE IF EXISTS `tb_sys_user`;
CREATE TABLE `tb_sys_user` (
                           `id` bigint unsigned NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
                           `user_id` bigint(20) unsigned NOT NULL COMMENT '用户id',
                           `user_account` varchar(32) DEFAULT NULL COMMENT '用户账号',
                           `password` varchar(100) DEFAULT NULL COMMENT '用户密码',
                           `nick_name` varchar(32) DEFAULT NULL COMMENT '昵称',
                           `create_by` bigint(8) NOT NULL COMMENT '创建用户',
                           `create_time` datetime NOT NULL COMMENT '创建时间',
                           `update_by` bigint(8) DEFAULT NULL COMMENT '更新用户',
                           `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                           UNIQUE KEY `user_account` (`user_account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理端用户表';
# 初始化默认管理员
INSERT INTO tb_sys_user VALUES (0, 1, 'admin', 'admin@123', 'admin', 1, NOW(), 1, NOW());

# 题目信息表
DROP TABLE IF EXISTS `tb_question`;
create table `tb_question`(
                          id bigint unsigned NOT NULL PRIMARY KEY AUTO_INCREMENT COMMENT '主键id',
                          question_id bigint unsigned NOT NULL comment '题目id',
                          title varchar(50) not null  comment '题目标题',
                          difficulty tinyint not null comment '题目难度1:简单  2：中等 3：困难',
                          time_limit int not null comment '时间限制',
                          space_limit int not null comment '空间限制',
                          content varchar(1000) not null comment '题目内容',
                          question_case varchar(1000)  comment '题目用例',
                          default_code varchar(500) not null comment '默认代码块',
                          main_fuc varchar(500) not null comment 'main函数',
                          create_by    bigint unsigned not null  comment '创建人',
                          create_time  datetime not null comment '创建时间',
                          update_by    bigint unsigned  comment '更新人',
                          update_time  datetime comment '更新时间',
                          UNIQUE KEY `question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目信息表';