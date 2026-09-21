# 1. 初始化nacos配置数据
# 注意： 此前如果修改过nacos外接数据库名称，此处需确保名称一致

use `frameworkjava_nacos_test`;
INSERT INTO config_info (data_id,group_id,content,md5,gmt_create,gmt_modified,src_user,src_ip,app_name,tenant_id,c_desc,c_use,effect,`type`,c_schema,encrypted_data_key) VALUES

('share-email-test.yaml','DEFAULT_GROUP','email:
    host: smtp.qq.com
    port: 587
    username: {paste your email here}
    password: {paste your smtp code here}
    connection-timeout: 10000
    timeout: 10000
    write-timeout: 10000
    subject: login-code',md5('email:
    host: smtp.qq.com
    port: 587
    username: {paste your email here}
    password: {paste your smtp code here}
    connection-timeout: 10000
    timeout: 10000
    write-timeout: 10000
    subject: login-code'),now(),now(),'nacos','172.19.0.1','Common Redis Configuration','frameworkjava-test','','','','yaml','',''),

('share-wispcode-test.yaml','DEFAULT_GROUP','spring:
  application:
    name: wispcode
  ai:
    dashscope:
      api-key: {paste your api-key here}
      chat:
        options:
          model: deepseek-v4-pro-0813
          temperature: 0.7
    # -------- embedding --------
    openai:
      base-url: http://192.168.160.133:8090/v1
      api-key: dummy-tei
      chat:
        enabled: false
    # -------- Milvus --------
    vectorstore:
      milvus:
        enabled: true
        client:
          host: 192.168.160.133
          port: 19530
        collection-name: RAG
        embedding-dimension: 1024
        initialize-schema: true
        index-type: HNSW
        metric-type: COSINE

management:
  health:
    redis:
      enabled: false

app:
  preview:
    container-name: wispcode-userapp-preview
    host: 192.168.160.133
docker:
  host: tcp://192.168.160.133:2376
  cert: /workspace/cert
chat:
  memory:
    maxLen: 5
    ttl: 24

gitee:
  user-code:
    repo: wispcode-gitee-repo
    branch: master
    owner: wangs-joyful-home
  api-base-url: https://gitee.com/api/v5/
  access-token: {paste your gitee access-token here}

code:
  host: 192.168.160.133
  port: 8080',md5('spring:
  application:
    name: wispcode
  ai:
    dashscope:
      api-key: {paste your api-key here}
      chat:
        options:
          model: deepseek-v4-pro-0813
          temperature: 0.7
    # -------- embedding --------
    openai:
      base-url: http://192.168.160.133:8090/v1
      api-key: dummy-tei
      chat:
        enabled: false
    # -------- Milvus --------
    vectorstore:
      milvus:
        enabled: true
        client:
          host: 192.168.160.133
          port: 19530
        collection-name: RAG
        embedding-dimension: 1024
        initialize-schema: true
        index-type: HNSW
        metric-type: COSINE

management:
  health:
    redis:
      enabled: false

app:
  preview:
    container-name: wispcode-userapp-preview
    host: 192.168.160.133
docker:
  host: tcp://192.168.160.133:2376
  cert: /workspace/cert
chat:
  memory:
    maxLen: 5
    ttl: 24

gitee:
  user-code:
    repo: wispcode-gitee-repo
    branch: master
    owner: wangs-joyful-home
  api-base-url: https://gitee.com/api/v5/
  access-token: {paste your gitee access-token here}

code:
  host: 192.168.160.133
  port: 8080'),now(),now(),'nacos','112.46.64.96','wisp-code configuration','frameworkjava-test',NULL,NULL,NULL,'yaml',NULL,''),

('share-common-test.yaml','DEFAULT_GROUP','feign:
  okhttp:
    enabled: true
  httpclient:
    enabled: false
  client:
    config:
      default:
        connectTimeout: 10000
        readTimeout: 10000
  compression:
    request:
      enabled: true
    response:
      enabled: true
',md5('feign:
  okhttp:
    enabled: true
  httpclient:
    enabled: false
  client:
    config:
      default:
        connectTimeout: 10000
        readTimeout: 10000
  compression:
    request:
      enabled: true
    response:
      enabled: true
'),now(),now(),'nacos','112.46.64.96','common configuration','frameworkjava-test','','','','yaml','',''),

('share-redis-test.yaml','DEFAULT_GROUP','spring:
  cache:
    type: redis
  data:
    redis:
      host: frameworkjava-redis
      port: 6379
      password: bite@123
  redis:
    host: frameworkjava-redis
    port: 6379
    password: bite@123
',md5('spring:
  cache:
    type: redis
  data:
    redis:
      host: frameworkjava-redis
      port: 6379
      password: bite@123
  redis:
    host: frameworkjava-redis
    port: 6379
    password: bite@123
'),now(),now(),'nacos','172.19.0.1','Common Redis Configuration','frameworkjava-test','','','','yaml','',''),

('share-mysql-test.yaml','DEFAULT_GROUP','spring:
  datasource:
    url: jdbc:mysql://192.168.160.133:3306/wispcode?useSSL=false&autoReconnect=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&serverTimezone=GMT%2B8
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: bitedev
    password: bite@123
    type: com.zaxxer.hikari.HikariDataSource
    hikari:
      pool-name: HikariCP
      minimum-idle: 5
      idle-timeout: 600000
      maximum-pool-size: 10
      auto-commit: true
      max-lifetime: 1800000
      connection-timeout: 30000
      connection-test-query: SELECT 1
mybatis-plus:
    typeAliasesPackage: com.bitejiuyeke.**.domain
    mapperLocations: classpath*:mapper/**.xml
    configuration:
      log-impl: org.apache.ibatis.logging.stdout.StdOutImpl',md5('spring:
  datasource:
    url: jdbc:mysql://192.168.160.133:3306/wispcode?useSSL=false&autoReconnect=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&serverTimezone=GMT%2B8
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: bitedev
    password: bite@123
    type: com.zaxxer.hikari.HikariDataSource
    hikari:
      pool-name: HikariCP
      minimum-idle: 5
      idle-timeout: 600000
      maximum-pool-size: 10
      auto-commit: true
      max-lifetime: 1800000
      connection-timeout: 30000
      connection-test-query: SELECT 1
mybatis-plus:
    typeAliasesPackage: com.bitejiuyeke.**.domain
    mapperLocations: classpath*:mapper/**.xml
    configuration:
      log-impl: org.apache.ibatis.logging.stdout.StdOutImpl'),now(),now(),'nacos','172.18.0.1','Common MySQL Configuration','frameworkjava-test','','','','yaml','',''),

('nexus-gateway-test.yaml','DEFAULT_GROUP','spring:
  cloud:
    gateway:
      discovery:
        locator:
          lowerCaseServiceId: true
          enabled: true
      routes:
        - id: wispcode
          uri: lb://wispcode
          predicates:
            - Path=/wisp/**
        - id: bite-admin
          uri: lb://bite-admin
          predicates:
            - Path=/admin/**

security:
  ignore:
    whites:
      - /wisp/user/**',md5('spring:
  cloud:
    gateway:
      discovery:
        locator:
          lowerCaseServiceId: true
          enabled: true
      routes:
        - id: wispcode
          uri: lb://wispcode
          predicates:
            - Path=/wisp/**
        - id: bite-admin
          uri: lb://bite-admin
          predicates:
            - Path=/admin/**

security:
  ignore:
    whites:
      - /wisp/user/**'),now(),now(),'nacos','112.46.64.96','Gateway','frameworkjava-test','','','','yaml','','');

INSERT INTO config_info (data_id,group_id,content,md5,gmt_create,gmt_modified,src_user,src_ip,app_name,tenant_id,c_desc,c_use,effect,`type`,c_schema,encrypted_data_key) VALUES
    ('share-caffeine-test.yaml','DEFAULT_GROUP','caffeine:
  build:
    initial-capacity: 128
    maximum-size: 1024
    expire: 60',md5('caffeine:
  build:
    initial-capacity: 128
    maximum-size: 1024
    expire: 60'),now(),now(),'nacos','112.46.64.96','Local Cache Configuration','frameworkjava-test',NULL,NULL,NULL,'yaml',NULL,'');

INSERT INTO tenant_info (kp,tenant_id,tenant_name,tenant_desc,create_source,gmt_create,gmt_modified) VALUES
    ('1','frameworkjava-test','frameworkjava-test','Test Environment','nacos',unix_timestamp()*1000,unix_timestamp()*1000);