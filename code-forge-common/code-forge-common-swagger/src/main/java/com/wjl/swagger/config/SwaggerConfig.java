package com.wjl.swagger.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

/**
 * 使用说明
 * @Tag 给接口分组
 * @Operation 接口操作
 * @Parameters 指定参数描述注解 @Parameter 数组
 * @Parameter 描述输入参数，in 参数位置，包括 query、path、header、cookie 中的一种
 * @ApiResponse 描述响应结果
 * @Schema 描述数据模型的属性
 * 
 * SwaggerConfig
 */
@Configuration 
public class SwaggerConfig {
    // 配置Knife4j
    @Bean 
    public OpenAPI openAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Code Forge Common Swagger")
                .version("v1.0")
                .description("系统接口文档")
            );
    }
}
