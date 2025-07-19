package com.propman.config;

import com.africastalking.AfricasTalking;
import com.africastalking.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class AfricasTalkingConfig {

    @Value("${africas.talking.api.key}")
    private String apiKey;

    @Value("${africas.talking.username}")
    private String username;

    @Value("${africas.talking.environment:sandbox}")
    private String environment;

    @Bean
    public SmsService smsService() {
        try {
            // Initialize Africa's Talking
            if ("production".equalsIgnoreCase(environment)) {
                AfricasTalking.initialize(username, apiKey);
            } else {
                AfricasTalking.initialize(username, apiKey, AfricasTalking.ENVIRONMENT_SANDBOX);
            }
            
            log.info("Africa's Talking SMS Service initialized successfully for environment: {}", environment);
            return AfricasTalking.getService(AfricasTalking.SERVICE_SMS);
        } catch (Exception e) {
            log.error("Failed to initialize Africa's Talking SMS Service", e);
            throw new RuntimeException("SMS Service initialization failed", e);
        }
    }
}