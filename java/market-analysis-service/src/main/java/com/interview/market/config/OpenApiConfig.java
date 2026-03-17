package com.interview.market.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI marketAnalysisOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Market Analysis Service API")
                        .description("APIs for market overview, what-if prediction, and export features")
                        .version("v1")
                        .contact(new Contact()
                                .name("Interview Project")
                                .url("https://example.local"))
                        .license(new License()
                                .name("Internal Use")
                                .url("https://example.local/license")));
    }
}
