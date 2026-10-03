-- 1. 初始化nacos配置数据
-- 注意： 此前如果修改过nacos外接数据库名称，此处需确保名称一致

use `frameworkjava_nacos_test`;
SET NAMES utf8mb4;
INSERT INTO config_info (data_id,group_id,content,md5,gmt_create,gmt_modified,src_user,src_ip,app_name,tenant_id,c_desc,c_use,effect,`type`,c_schema,encrypted_data_key) VALUES
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

security:
  ignore:
    whites:
      - /system/b/login
      - /user/register
      - /user/sendCode
      - /user/login','baf5a2de1c31f744f66eeb535966316d',NOW(),NOW(),'nacos','127.0.0.1','','code-forge-test',NULL,NULL,NULL,'yaml',NULL,''),

    ('share-mysql-test.yaml','DEFAULT_GROUP','spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/db_code_forge?useSSL=false&serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf8
    username: wjl
    password: wjl@123
    driver-class-name: com.mysql.cj.jdbc.Driver','d34fe9ab37cd64d8caeb2f0d53be1da8',NOW(),NOW(),'nacos','127.0.0.1','','code-forge-test',NULL,NULL,NULL,'yaml',NULL,''),

    ('share-redis-test.yaml','DEFAULT_GROUP','spring:
    cache:
        type: redis
    data:
        redis:
            host: 127.0.0.1
            port: 6379
            password: wjl@123','25bacd0a5d601870d3abdf0318ea0f05',NOW(),NOW(),'nacos','127.0.0.1','','code-forge-test',NULL,NULL,NULL,'yaml',NULL,''),

    ('share-email-test.yaml','DEFAULT_GROUP','email:
    host: smtp.qq.com
    port: 587
    username: {email}
    password: {smtp password}
    connection-timeout: 10000
    timeout: 10000
    write-timeout: 10000
    subject: login-code','da48c3d6c98d22fd8ecdb3c8b51bfdfd',NOW(),NOW(),'nacos','127.0.0.1','','code-forge-test',NULL,NULL,NULL,'yaml',NULL,''),

    ('share-es-test.yaml','DEFAULT_GROUP','spring:
  elasticsearch:
    uris: http://localhost:9200
    username: elastic
    password: wjl@123','25bacd0a5d601870d3abdf0318ea0f05',NOW(),NOW(),'nacos','127.0.0.1','','code-forge-test',NULL,NULL,NULL,'yaml',NULL,'');

INSERT INTO tenant_info (kp,tenant_id,tenant_name,tenant_desc,create_source,gmt_create,gmt_modified) VALUES
    ('1','code-forge-test','code-forge-test','Test Environment','nacos',unix_timestamp()*1000,unix_timestamp()*1000);
