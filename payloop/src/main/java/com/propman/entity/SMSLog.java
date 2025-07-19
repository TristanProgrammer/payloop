package com.propman.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sms_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SMSLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 15)
    private String recipientPhone;
    
    @Column(nullable = false, length = 100)
    private String recipientName;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SMSType smsType;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SMSStatus status;
    
    @Column(length = 100)
    private String messageId; // Africa's Talking message ID
    
    @Column(precision = 8, scale = 2)
    private BigDecimal cost;
    
    @Column(columnDefinition = "TEXT")
    private String errorMessage;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "landlord_id")
    private Landlord landlord;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime sentAt;
    
    public enum SMSType {
        RENT_REMINDER, OVERDUE_NOTICE, PAYMENT_CONFIRMATION, WELCOME_MESSAGE, CUSTOM
    }
    
    public enum SMSStatus {
        SENT, DELIVERED, FAILED, PENDING
    }
}