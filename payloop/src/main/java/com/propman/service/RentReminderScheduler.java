package com.propman.service;

import com.propman.entity.Tenant;
import com.propman.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RentReminderScheduler {

    private final TenantRepository tenantRepository;
    private final SMSService smsService;

    /**
     * Send rent reminders 3 days before due date
     * Runs daily at 9:00 AM
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void sendRentReminders() {
        log.info("Starting daily rent reminder job");
        
        try {
            LocalDate today = LocalDate.now();
            int currentDay = today.getDayOfMonth();
            int targetDay = today.plusDays(3).getDayOfMonth();
            
            // Find tenants whose rent is due in 3 days
            List<Tenant> tenantsToRemind = tenantRepository.findActiveTenantsWithDueDate(targetDay);
            
            log.info("Found {} tenants to send rent reminders", tenantsToRemind.size());
            
            int successCount = 0;
            for (Tenant tenant : tenantsToRemind) {
                try {
                    boolean success = smsService.sendRentReminder(tenant, 3);
                    if (success) {
                        successCount++;
                    }
                    
                    // Add delay to avoid rate limiting
                    Thread.sleep(200);
                } catch (Exception e) {
                    log.error("Failed to send reminder to tenant {}: {}", tenant.getId(), e.getMessage());
                }
            }
            
            log.info("Rent reminder job completed. Sent {} out of {} reminders successfully", 
                    successCount, tenantsToRemind.size());
            
        } catch (Exception e) {
            log.error("Error in rent reminder scheduler: {}", e.getMessage(), e);
        }
    }

    /**
     * Send overdue notices for tenants with overdue payments
     * Runs daily at 10:00 AM
     */
    @Scheduled(cron = "0 0 10 * * *")
    public void sendOverdueNotices() {
        log.info("Starting daily overdue notice job");
        
        try {
            LocalDate today = LocalDate.now();
            
            // Find tenants with overdue payments
            List<Tenant> overdueTenantsToday = tenantRepository.findOverdueTenantsForToday(today.getDayOfMonth());
            List<Tenant> overdueTenantsWeekly = tenantRepository.findOverdueTenantsForWeekly(today.getDayOfMonth());
            
            log.info("Found {} tenants for daily overdue notices and {} for weekly notices", 
                    overdueTenantsToday.size(), overdueTenantsWeekly.size());
            
            int successCount = 0;
            
            // Send daily overdue notices (1-7 days overdue)
            for (Tenant tenant : overdueTenantsToday) {
                try {
                    int daysOverdue = calculateDaysOverdue(tenant, today);
                    if (daysOverdue > 0 && daysOverdue <= 7) {
                        boolean success = smsService.sendOverdueNotice(tenant, daysOverdue);
                        if (success) {
                            successCount++;
                        }
                    }
                    Thread.sleep(200);
                } catch (Exception e) {
                    log.error("Failed to send overdue notice to tenant {}: {}", tenant.getId(), e.getMessage());
                }
            }
            
            // Send weekly overdue notices (8+ days overdue, only on Mondays)
            if (today.getDayOfWeek().getValue() == 1) { // Monday
                for (Tenant tenant : overdueTenantsWeekly) {
                    try {
                        int daysOverdue = calculateDaysOverdue(tenant, today);
                        if (daysOverdue > 7) {
                            boolean success = smsService.sendOverdueNotice(tenant, daysOverdue);
                            if (success) {
                                successCount++;
                            }
                        }
                        Thread.sleep(200);
                    } catch (Exception e) {
                        log.error("Failed to send weekly overdue notice to tenant {}: {}", tenant.getId(), e.getMessage());
                    }
                }
            }
            
            log.info("Overdue notice job completed. Sent {} notices successfully", successCount);
            
        } catch (Exception e) {
            log.error("Error in overdue notice scheduler: {}", e.getMessage(), e);
        }
    }

    /**
     * Calculate days overdue for a tenant
     */
    private int calculateDaysOverdue(Tenant tenant, LocalDate today) {
        LocalDate dueDate = LocalDate.of(today.getYear(), today.getMonth(), tenant.getDueDate());
        
        // If due date hasn't passed this month, check previous month
        if (dueDate.isAfter(today)) {
            dueDate = dueDate.minusMonths(1);
        }
        
        return (int) dueDate.until(today).getDays();
    }
}