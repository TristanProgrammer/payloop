package com.propman.repository;

import com.propman.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long> {
    
    List<Tenant> findByLandlordId(Long landlordId);
    
    List<Tenant> findByPropertyId(Long propertyId);
    
    @Query("SELECT t FROM Tenant t WHERE t.status = 'ACTIVE' AND t.dueDate = :dueDate")
    List<Tenant> findActiveTenantsWithDueDate(@Param("dueDate") int dueDate);
    
    @Query("SELECT t FROM Tenant t WHERE t.status = 'DEFAULTER' AND t.dueDate = :dueDate")
    List<Tenant> findOverdueTenantsForToday(@Param("dueDate") int dueDate);
    
    @Query("SELECT t FROM Tenant t WHERE t.status = 'DEFAULTER' AND t.dueDate <= :dueDate")
    List<Tenant> findOverdueTenantsForWeekly(@Param("dueDate") int dueDate);
    
    @Query("SELECT t FROM Tenant t WHERE t.landlord.id = :landlordId AND t.status = 'ACTIVE'")
    List<Tenant> findActiveTenantsByLandlordId(@Param("landlordId") Long landlordId);
    
    @Query("SELECT t FROM Tenant t WHERE t.landlord.id = :landlordId AND t.status = 'DEFAULTER'")
    List<Tenant> findDefaulterTenantsByLandlordId(@Param("landlordId") Long landlordId);
}