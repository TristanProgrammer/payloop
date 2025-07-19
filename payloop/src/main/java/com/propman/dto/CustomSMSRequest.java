package com.propman.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CustomSMSRequest {
    
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^(\\+254|0)[17]\\d{8}$", message = "Invalid Kenyan phone number format")
    private String phone;
    
    @NotBlank(message = "Message is required")
    @Size(max = 1000, message = "Message cannot exceed 1000 characters")
    private String message;
    
    private Long tenantId;
    private Long landlordId;
}