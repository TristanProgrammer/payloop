package com.propman.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenants")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tenant {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Tenant name is required")
    @Size(max = 100, message = "Name cannot exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String name;
    
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^(\\+254|0)[17]\\d{8}$", message = "Invalid Kenyan phone number format")
    @Column(nullable = false, unique = true, length = 15)
    private String phone;
    
    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    @Column(length = 100)
    private String email;
    
    @NotNull(message = "Rent amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Rent amount must be greater than 0")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal rentAmount;
    
    @NotNull(message = "Due date is required")
    @Min(value = 1, message = "Due date must be between 1 and 31")
    @Max(value = 31, message = "Due date must be between 1 and 31")
    @Column(nullable = false)
    private Integer dueDate;
    
    @NotNull(message = "Move-in date is required")
    @Column(nullable = false)
    private LocalDate moveInDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TenantStatus status = TenantStatus.ACTIVE;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal outstandingAmount = BigDecimal.ZERO;
    
    private LocalDate lastPaymentDate;
    
    @NotBlank(message = "Unit number is required")
    @Size(max = 10, message = "Unit number cannot exceed 10 characters")
    @Column(nullable = false, length = 10)
    private String unitNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "landlord_id", nullable = false)
    private Landlord landlord;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    public enum TenantStatus {
        ACTIVE, INACTIVE, SUSPENDED, DEFAULTER
    }
    
    // Helper method to get formatted phone number
    public String getFormattedPhone() {
        if (phone == null) return null;
        
        String cleaned = phone.replaceAll("\\D", "");
        if (cleaned.startsWith("254")) {
            return "+" + cleaned;
        } else if (cleaned.startsWith("0")) {
            return "+254" + cleaned.substring(1);
        } else if (cleaned.length() == 9) {
            return "+254" + cleaned;
        }
        return phone.startsWith("+") ? phone : "+" + phone;
    }
}