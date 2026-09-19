CREATE database if NOT EXISTS `db_code_forge` default character set utf8mb4 collate utf8mb4_general_ci;

CREATE USER 'wjl'@'%' IDENTIFIED BY 'wjl@123';
grant replication slave, replication client on *.* to 'wjl'@'%';

GRANT ALL PRIVILEGES ON db_code_forge.* TO  'wjl'@'%';

FLUSH PRIVILEGES;