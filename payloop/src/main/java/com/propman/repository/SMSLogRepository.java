package com.propman.repository;

import com.propman.entity.SMSLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SMSLogRepository extends JpaRepository<SMSLog, Long> {
    
    Page<SMSLog> findByLandlordId(Long landlordId, Pageable pageable);
    
    Page<SMSLog> findByLandlordIdAndSmsType(Long landlordId, SMSLog.SMSType smsType, Pageable pageable);
    
    Page<SMSLog> findByLandlordIdAndStatus(Long landlordId, SMSLog.SMSStatus status, Pageable pageable);
    
    Page<SMSLog> findByLandlordIdAndSmsTypeAndStatus(Long landlordId, SMSLog.SMSType smsType, SMSLog.SMSStatus status, Pageable pageable);
    
    List<SMSLog> findByTenantId(Long tenantId);
    
    @Query("SELECT COUNT(s) FROM SMSLog s WHERE s.landlord.id = :landlordId AND s.status = 'SENT' AND s.sentAt >= :startDate")
    long countSentSMSByLandlordSince(@Param("landlordId") Long landlordId, @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT SUM(s.cost) FROM SMSLog s WHERE s.landlord.id = :landlordId AND s.status = 'SENT' AND s.sentAt >= :startDate")
    Double getTotalCostByLandlordSince(@Param("landlordId") Long landlordId, @Param("startDate") LocalDateTime startDate);
}