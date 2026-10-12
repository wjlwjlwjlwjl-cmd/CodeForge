-- Nacos 配置数据（命名空间 code-forge-test）
-- 说明：由当前 Nacos 外接数据库 frameworkjava_nacos_test 导出，
--      source 本文件后即可复现当前 Nacos「code-forge-test」命名空间下的全部配置。
-- 注意： 此前如果修改过nacos外接数据库名称，此处需确保名称一致

use `frameworkjava_nacos_test`;
SET NAMES utf8mb4;

-- 1. 命名空间
DELETE FROM tenant_info WHERE tenant_id = 'code-forge-test';
INSERT INTO tenant_info (kp,tenant_id,tenant_name,tenant_desc,create_source,gmt_create,gmt_modified) VALUES
    ('1','code-forge-test','code-forge-test','Test Environment','nacos',1791391505000,1791391505000);

-- 2. 配置列表（共 8 条，均属 DEFAULT_GROUP）
DELETE FROM config_info WHERE tenant_id = 'code-forge-test';
INSERT INTO config_info
    (data_id,group_id,content,md5,gmt_create,gmt_modified,src_user,src_ip,
     app_name,tenant_id,c_desc,c_use,effect,`type`,c_schema,encrypted_data_key)
VALUES
    ('share-gateway-test.yaml','DEFAULT_GROUP','spring:
  cloud:
    nacos:
      config:
        refresh-enabled: false
    gateway:
      discovery:
        locator:
          lowerCaseServiceId: true
          enabled: true
      routes:
        - id: code-forge-system
          uri: lb://code-forge-system
          predicates:
            - Path=/system/**

        - id: code-forge-user-question
          uri: lb://code-forge-friend
          predicates:
            - Path=/question/search/**

        - id: code-forge-question
          uri: lb://code-forge-system
          predicates:
            - Path=/question/**

        - id: code-forge-exam
          uri: lb://code-forge-system
          predicates:
            - Path=/exam/**

        - id: code-forge-user-b
          uri: lb://code-forge-system
          predicates:
            - Path=/user/b/**

        - id: code-forge-user-c
          uri: lb://code-forge-friend
          predicates:
            - Path=/user/**

        - id: code-forge-user-exam
          uri: lb://code-forge-friend
          predicates:
            - Path=/user/exam/**

        - id: code-forge-job
          uri: lb://code-forge-job
          predicates:
            - Path=/job/**

security:
  ignore:
    whites:
      - /system/b/login
      - /user/register
      - /user/sendCode
      - /user/login','4c3f3d47a0f5f7988adc667aa5eab61a',
     '2026-10-08 00:45:05','2026-10-09 09:04:26','nacos','172.18.0.1',
     '','code-forge-test','','',
     '','yaml','',''),
    ('share-mysql-test.yaml','DEFAULT_GROUP','spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/db_code_forge?useSSL=false&serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf8
    username: wjl
    password: wjl@123
    driver-class-name: com.mysql.cj.jdbc.Driver','d34fe9ab37cd64d8caeb2f0d53be1da8',
     '2026-10-08 00:45:05','2026-10-08 00:45:05','nacos','127.0.0.1',
     '','code-forge-test',NULL,NULL,
     NULL,'yaml',NULL,''),
    ('share-redis-test.yaml','DEFAULT_GROUP','spring:
    cache:
        type: redis
    data:
        redis:
            host: 127.0.0.1
            port: 6379
            password: wjl@123','25bacd0a5d601870d3abdf0318ea0f05',
     '2026-10-08 00:45:05','2026-10-08 00:45:05','nacos','127.0.0.1',
     '','code-forge-test',NULL,NULL,
     NULL,'yaml',NULL,''),
    ('share-email-test.yaml','DEFAULT_GROUP','email:
    host: smtp.qq.com
    port: 587
    username: {email address}
    password: {email smtp password}
    connection-timeout: 10000
    timeout: 10000
    write-timeout: 10000
    subject: login-code','5f460ae3c6cbb86d632edd576e067d73',
     '2026-10-08 00:45:05','2026-10-08 15:05:45','nacos','172.18.0.1',
     '','code-forge-test','','',
     '','yaml','',''),
    ('share-es-test.yaml','DEFAULT_GROUP','spring:
  elasticsearch:
    uris: http://localhost:9200
    username: elastic
    password: wjl@123','25bacd0a5d601870d3abdf0318ea0f05',
     '2026-10-08 00:45:05','2026-10-08 00:45:05','nacos','127.0.0.1',
     '','code-forge-test',NULL,NULL,
     NULL,'yaml',NULL,''),
    ('share-oss-test.yaml','DEFAULT_GROUP','aliyun:
  oss:
    endpoint: https://oss-cn-shanghai.aliyuncs.com
    access-key-id: {aliyun access id}
    access-key-secret: {aliyun access secret}
    bucket-name: code-forge','36abc3916d3b2554a9a688091a83017f',
     '2026-10-08 00:45:05','2026-10-08 15:06:35','nacos','172.18.0.1',
     '','code-forge-test','','',
     '','yaml','',''),
    ('share-docker-test.yaml','DEFAULT_GROUP','oj:
  docker:
    host: tcp://127.0.0.1:2375
    timeout: 30s','25bacd0a5d601870d3abdf0318ea0f05',
     '2026-10-08 00:45:05','2026-10-08 00:45:05','nacos','127.0.0.1',
     '','code-forge-test',NULL,NULL,
     NULL,'yaml',NULL,''),
    ('share-rabbitmq-test.yaml','DEFAULT_GROUP','spring:
  rabbitmq:
    host: 127.0.0.1
    port: 5672
    username: wjl
    password: wjl@123
    virtual-host: /
    listener:
      simple:
        acknowledge-mode: none ','79ed9f1276ed32a5f379d3e41ad09554',
     '2026-10-08 00:45:05','2026-10-10 22:30:46','nacos','172.18.0.1',
     '','code-forge-test','','',
     '','yaml','','');
