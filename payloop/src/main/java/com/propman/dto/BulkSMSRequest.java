package com.propman.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;

import java.util.List;

@Data
public class BulkSMSRequest {
    
    @NotEmpty(message = "Tenant IDs cannot be empty")
    private List<Long> tenantIds;
    
    @Min(value = 1, message = "Days before must be at least 1")
    @Max(value = 30, message = "Days before cannot exceed 30")
    private int daysBefore = 3;
}