CREATE database if NOT EXISTS `db_code_forge` default character set utf8mb4 collate utf8mb4_general_ci;

CREATE USER 'wjl'@'%' IDENTIFIED BY 'wjl@123';
grant replication slave, replication client on *.* to 'wjl'@'%';

GRANT ALL PRIVILEGES ON db_code_forge.* TO  'wjl'@'%';

# 创建 Nacos 外接数据库
CREATE database if NOT EXISTS `frameworkjava_nacos_test` default character set utf8mb4 collate utf8mb4_general_ci;
CREATE database if NOT EXISTS `frameworkjava_test` default character set utf8mb4 collate utf8mb4_general_ci;

GRANT ALL PRIVILEGES ON frameworkjava_nacos_test.* TO  'wjl'@'%';
GRANT ALL PRIVILEGES ON frameworkjava_test.* TO  'wjl'@'%';

FLUSH PRIVILEGES;