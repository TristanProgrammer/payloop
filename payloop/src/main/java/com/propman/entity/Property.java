package com.propman.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "properties")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Property {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Property name is required")
    @Size(max = 100, message = "Name cannot exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String name;
    
    @NotBlank(message = "Location is required")
    @Size(max = 200, message = "Location cannot exceed 200 characters")
    @Column(nullable = false, length = 200)
    private String location;
    
    @NotNull(message = "Total units is required")
    @Min(value = 1, message = "Total units must be at least 1")
    @Column(nullable = false)
    private Integer totalUnits;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PropertyType propertyType;
    
    @Column(precision = 12, scale = 2)
    private BigDecimal monthlyRevenue = BigDecimal.ZERO;
    
    @Column(precision = 12, scale = 2)
    private BigDecimal outstandingPayments = BigDecimal.ZERO;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "landlord_id", nullable = false)
    private Landlord landlord;
    
    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Tenant> tenants;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    public enum PropertyType {
        APARTMENT, HOUSE, COMMERCIAL
    }
    
    // Helper method to get occupied units count
    public int getOccupiedUnits() {
        return tenants != null ? (int) tenants.stream()
                .filter(tenant -> tenant.getStatus() == Tenant.TenantStatus.ACTIVE)
                .count() : 0;
    }
    
    // Helper method to get occupancy rate
    public double getOccupancyRate() {
        return totalUnits > 0 ? (double) getOccupiedUnits() / totalUnits * 100 : 0;
    }
}