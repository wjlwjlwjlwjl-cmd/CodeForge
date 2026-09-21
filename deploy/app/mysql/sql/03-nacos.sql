# 创建 Nacos 外接数据库
CREATE database if NOT EXISTS `frameworkjava_nacos_test` default character set utf8mb4 collate utf8mb4_general_ci;
CREATE database if NOT EXISTS `frameworkjava_test` default character set utf8mb4 collate utf8mb4_general_ci;

GRANT ALL PRIVILEGES ON frameworkjava_nacos_test.* TO  'wjl'@'%';
GRANT ALL PRIVILEGES ON frameworkjava_test.* TO  'wjl'@'%';

SET NAMES utf8mb4;
/******************************************/
/*   表名称 = config_info                  */
/******************************************/

use `frameworkjava_nacos_test`;
CREATE TABLE `config_info`
(
    `id`                 bigint(20)   NOT NULL AUTO_INCREMENT COMMENT 'id',
    `data_id`            varchar(255) NOT NULL COMMENT 'data_id',
    `group_id`           varchar(128)          DEFAULT NULL COMMENT 'group_id',
    `content`            longtext     NOT NULL COMMENT 'content',
    `md5`                varchar(32)           DEFAULT NULL COMMENT 'md5',
    `gmt_create`         datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `gmt_modified`       datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '修改时间',
    `src_user`           text COMMENT 'source user',
    `src_ip`             varchar(50)           DEFAULT NULL COMMENT 'source ip',
    `app_name`           varchar(128)          DEFAULT NULL COMMENT 'app_name',
    `tenant_id`          varchar(128)          DEFAULT '' COMMENT '租户字段',
    `c_desc`             varchar(256)          DEFAULT NULL COMMENT 'configuration description',
    `c_use`              varchar(64)           DEFAULT NULL COMMENT 'configuration usage',
    `effect`             varchar(64)           DEFAULT NULL COMMENT '配置生效的描述',
    `type`               varchar(64)           DEFAULT NULL COMMENT '配置的类型',
    `c_schema`           text COMMENT '配置的模式',
    `encrypted_data_key` text         NOT NULL COMMENT '密钥',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_configinfo_datagrouptenant` (`data_id`, `group_id`, `tenant_id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8
  COLLATE = utf8_bin COMMENT ='config_info';

CREATE TABLE `users`
(
    `username` varchar(50)  NOT NULL PRIMARY KEY COMMENT 'username',
    `password` varchar(500) NOT NULL COMMENT 'password',
    `enabled`  boolean      NOT NULL COMMENT 'enabled'
);

CREATE TABLE `roles`
(
    `username` varchar(50) NOT NULL COMMENT 'username',
    `role`     varchar(50) NOT NULL COMMENT 'role',
    UNIQUE INDEX `idx_user_role` (`username` ASC, `role` ASC) USING BTREE
);

CREATE TABLE `permissions`
(
    `role`     varchar(50)  NOT NULL COMMENT 'role',
    `resource` varchar(128) NOT NULL COMMENT 'resource',
    `action`   varchar(8)   NOT NULL COMMENT 'action',
    UNIQUE INDEX `uk_role_permission` (`role`, `resource`, `action`) USING BTREE
);

INSERT INTO users (username, password, enabled)
VALUES ('nacos', '$2a$10$9IcbyRmE9Tulsa1baGrdNeQ4YiHiU9mRgyhuB.LwnntSb9JVPKLSi', TRUE);

INSERT INTO roles (username, role)
VALUES ('nacos', 'ROLE_ADMIN');

commit;