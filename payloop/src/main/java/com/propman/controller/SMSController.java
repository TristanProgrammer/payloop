package com.propman.controller;

import com.propman.dto.BulkSMSRequest;
import com.propman.dto.CustomSMSRequest;
import com.propman.dto.SMSResponse;
import com.propman.entity.Landlord;
import com.propman.entity.SMSLog;
import com.propman.entity.Tenant;
import com.propman.repository.LandlordRepository;
import com.propman.repository.SMSLogRepository;
import com.propman.repository.TenantRepository;
import com.propman.service.SMSService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/sms")
@RequiredArgsConstructor
@Slf4j
public class SMSController {

    private final SMSService smsService;
    private final TenantRepository tenantRepository;
    private final LandlordRepository landlordRepository;
    private final SMSLogRepository smsLogRepository;

    /**
     * Send rent reminder to specific tenant
     */
    @PostMapping("/rent-reminder/{tenantId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LANDLORD')")
    public ResponseEntity<SMSResponse> sendRentReminder(@PathVariable Long tenantId,
                                                       @RequestParam(defaultValue = "3") int daysBefore) {
        try {
            Optional<Tenant> tenantOpt = tenantRepository.findById(tenantId);
            if (tenantOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new SMSResponse(false, "Tenant not found", null));
            }

            Tenant tenant = tenantOpt.get();
            boolean success = smsService.sendRentReminder(tenant, daysBefore);
            
            String message = success ? "Rent reminder sent successfully" : "Failed to send rent reminder";
            return ResponseEntity.ok(new SMSResponse(success, message, null));
            
        } catch (Exception e) {
            log.error("Error sending rent reminder: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new SMSResponse(false, "Internal server error", null));
        }
    }

    /**
     * Send overdue notice to specific tenant
     */
    @PostMapping("/overdue-notice/{tenantId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LANDLORD')")
    public ResponseEntity<SMSResponse> sendOverdueNotice(@PathVariable Long tenantId,
                                                        @RequestParam int daysOverdue) {
        try {
            Optional<Tenant> tenantOpt = tenantRepository.findById(tenantId);
            if (tenantOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new SMSResponse(false, "Tenant not found", null));
            }

            Tenant tenant = tenantOpt.get();
            boolean success = smsService.sendOverdueNotice(tenant, daysOverdue);
            
            String message = success ? "Overdue notice sent successfully" : "Failed to send overdue notice";
            return ResponseEntity.ok(new SMSResponse(success, message, null));
            
        } catch (Exception e) {
            log.error("Error sending overdue notice: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new SMSResponse(false, "Internal server error", null));
        }
    }

    /**
     * Send payment confirmation to tenant
     */
    @PostMapping("/payment-confirmation/{tenantId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LANDLORD')")
    public ResponseEntity<SMSResponse> sendPaymentConfirmation(@PathVariable Long tenantId,
                                                              @RequestParam BigDecimal amount) {
        try {
            Optional<Tenant> tenantOpt = tenantRepository.findById(tenantId);
            if (tenantOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new SMSResponse(false, "Tenant not found", null));
            }

            Tenant tenant = tenantOpt.get();
            boolean success = smsService.sendPaymentConfirmation(tenant, amount);
            
            // Also notify landlord
            smsService.notifyLandlordOfPayment(tenant, amount);
            
            String message = success ? "Payment confirmation sent successfully" : "Failed to send payment confirmation";
            return ResponseEntity.ok(new SMSResponse(success, message, null));
            
        } catch (Exception e) {
            log.error("Error sending payment confirmation: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new SMSResponse(false, "Internal server error", null));
        }
    }

    /**
     * Send welcome message to new tenant
     */
    @PostMapping("/welcome/{tenantId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LANDLORD')")
    public ResponseEntity<SMSResponse> sendWelcomeMessage(@PathVariable Long tenantId) {
        try {
            Optional<Tenant> tenantOpt = tenantRepository.findById(tenantId);
            if (tenantOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new SMSResponse(false, "Tenant not found", null));
            }

            Tenant tenant = tenantOpt.get();
            boolean success = smsService.sendWelcomeMessage(tenant);
            
            String message = success ? "Welcome message sent successfully" : "Failed to send welcome message";
            return ResponseEntity.ok(new SMSResponse(success, message, null));
            
        } catch (Exception e) {
            log.error("Error sending welcome message: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new SMSResponse(false, "Internal server error", null));
        }
    }

    /**
     * Send bulk rent reminders
     */
    @PostMapping("/bulk-rent-reminders")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LANDLORD')")
    public ResponseEntity<SMSResponse> sendBulkRentReminders(@Valid @RequestBody BulkSMSRequest request) {
        try {
            List<Tenant> tenants = tenantRepository.findAllById(request.getTenantIds());
            if (tenants.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new SMSResponse(false, "No valid tenants found", null));
            }

            List<Boolean> results = smsService.sendBulkRentReminders(tenants, request.getDaysBefore());
            long successCount = results.stream().mapToLong(success -> success ? 1 : 0).sum();
            
            String message = String.format("Sent %d out of %d rent reminders successfully", 
                    successCount, results.size());
            return ResponseEntity.ok(new SMSResponse(true, message, 
                    String.format("Success rate: %.1f%%", (double) successCount / results.size() * 100)));
            
        } catch (Exception e) {
            log.error("Error sending bulk rent reminders: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new SMSResponse(false, "Internal server error", null));
        }
    }

    /**
     * Send custom SMS
     */
    @PostMapping("/custom")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LANDLORD')")
    public ResponseEntity<SMSResponse> sendCustomSMS(@Valid @RequestBody CustomSMSRequest request) {
        try {
            Tenant tenant = null;
            Landlord landlord = null;
            
            if (request.getTenantId() != null) {
                tenant = tenantRepository.findById(request.getTenantId()).orElse(null);
            }
            
            if (request.getLandlordId() != null) {
                landlord = landlordRepository.findById(request.getLandlordId()).orElse(null);
            }
            
            boolean success = smsService.sendCustomSMS(request.getPhone(), request.getMessage(), tenant, landlord);
            
            String message = success ? "Custom SMS sent successfully" : "Failed to send custom SMS";
            return ResponseEntity.ok(new SMSResponse(success, message, null));
            
        } catch (Exception e) {
            log.error("Error sending custom SMS: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(new SMSResponse(false, "Internal server error", null));
        }
    }

    /**
     * Get SMS logs with pagination
     */
    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LANDLORD')")
    public ResponseEntity<Page<SMSLog>> getSMSLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "sentAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) Long landlordId,
            @RequestParam(required = false) SMSLog.SMSType smsType,
            @RequestParam(required = false) SMSLog.SMSStatus status) {
        
        try {
            Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<SMSLog> logs;
            
            if (landlordId != null) {
                if (smsType != null && status != null) {
                    logs = smsLogRepository.findByLandlordIdAndSmsTypeAndStatus(landlordId, smsType, status, pageable);
                } else if (smsType != null) {
                    logs = smsLogRepository.findByLandlordIdAndSmsType(landlordId, smsType, pageable);
                } else if (status != null) {
                    logs = smsLogRepository.findByLandlordIdAndStatus(landlordId, status, pageable);
                } else {
                    logs = smsLogRepository.findByLandlordId(landlordId, pageable);
                }
            } else {
                logs = smsLogRepository.findAll(pageable);
            }
            
            return ResponseEntity.ok(logs);
            
        } catch (Exception e) {
            log.error("Error retrieving SMS logs: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get SMS statistics for a landlord
     */
    @GetMapping("/stats/{landlordId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LANDLORD')")
    public ResponseEntity<?> getSMSStats(@PathVariable Long landlordId) {
        try {
            // This would typically be implemented with custom repository methods
            // For brevity, returning a simple response
            return ResponseEntity.ok().body("SMS statistics endpoint - implement based on requirements");
            
        } catch (Exception e) {
            log.error("Error retrieving SMS stats: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}