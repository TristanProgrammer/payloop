package com.propman.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "landlords")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Landlord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Business name is required")
    @Size(max = 100, message = "Business name cannot exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String businessName;
    
    @NotBlank(message = "Owner name is required")
    @Size(max = 100, message = "Owner name cannot exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String ownerName;
    
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^(\\+254|0)[17]\\d{8}$", message = "Invalid Kenyan phone number format")
    @Column(nullable = false, unique = true, length = 15)
    private String phone;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    @Column(nullable = false, unique = true, length = 100)
    private String email;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionPlan subscriptionPlan = SubscriptionPlan.TRIAL;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionStatus subscriptionStatus = SubscriptionStatus.ACTIVE;
    
    @OneToMany(mappedBy = "landlord", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Property> properties;
    
    @OneToMany(mappedBy = "landlord", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Tenant> tenants;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    public enum SubscriptionPlan {
        TRIAL, STARTER, GROWTH, ENTERPRISE
    }
    
    public enum SubscriptionStatus {
        ACTIVE, SUSPENDED, CANCELLED
    }
}