package com.propman.repository;

import com.propman.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {
    
    List<Property> findByLandlordId(Long landlordId);
    
    @Query("SELECT p FROM Property p WHERE p.landlord.id = :landlordId ORDER BY p.createdAt DESC")
    List<Property> findByLandlordIdOrderByCreatedAtDesc(@Param("landlordId") Long landlordId);
}