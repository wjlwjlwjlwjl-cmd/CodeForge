# 1. 初始化nacos配置数据
# 注意： 此前如果修改过nacos外接数据库名称，此处需确保名称一致

use `frameworkjava_nacos_test`;
# INSERT INTO config_info (data_id,group_id,content,md5,gmt_create,gmt_modified,src_user,src_ip,app_name,tenant_id,c_desc,c_use,effect,`type`,c_schema,encrypted_data_key) VALUES

INSERT INTO tenant_info (kp,tenant_id,tenant_name,tenant_desc,create_source,gmt_create,gmt_modified) VALUES
    ('1','code-forge-test','code-forge-test','Test Environment','nacos',unix_timestamp()*1000,unix_timestamp()*1000);
