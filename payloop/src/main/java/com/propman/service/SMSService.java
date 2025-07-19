package com.propman.service;

import com.africastalking.SmsService;
import com.africastalking.sms.Recipient;
import com.propman.entity.Landlord;
import com.propman.entity.SMSLog;
import com.propman.entity.Tenant;
import com.propman.repository.SMSLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SMSService {

    private final SmsService africasTalkingSmsService;
    private final SMSLogRepository smsLogRepository;

    @Value("${sms.sender.name:PropMan}")
    private String senderName;

    @Value("${sms.mpesa.paybill:696385}")
    private String mpesaPaybill;

    @Value("${sms.mpesa.phone:0705441549}")
    private String mpesaPhone;

    /**
     * Send rent reminder SMS to tenant
     */
    public boolean sendRentReminder(Tenant tenant, int daysBefore) {
        try {
            String message = buildRentReminderMessage(tenant, daysBefore);
            return sendSMS(tenant.getFormattedPhone(), message, SMSLog.SMSType.RENT_REMINDER, tenant, tenant.getLandlord());
        } catch (Exception e) {
            log.error("Failed to send rent reminder to tenant {}: {}", tenant.getId(), e.getMessage());
            return false;
        }
    }

    /**
     * Send overdue payment notice to tenant
     */
    public boolean sendOverdueNotice(Tenant tenant, int daysOverdue) {
        try {
            String message = buildOverdueNoticeMessage(tenant, daysOverdue);
            return sendSMS(tenant.getFormattedPhone(), message, SMSLog.SMSType.OVERDUE_NOTICE, tenant, tenant.getLandlord());
        } catch (Exception e) {
            log.error("Failed to send overdue notice to tenant {}: {}", tenant.getId(), e.getMessage());
            return false;
        }
    }

    /**
     * Send payment confirmation to tenant
     */
    public boolean sendPaymentConfirmation(Tenant tenant, BigDecimal amount) {
        try {
            String message = buildPaymentConfirmationMessage(tenant, amount);
            return sendSMS(tenant.getFormattedPhone(), message, SMSLog.SMSType.PAYMENT_CONFIRMATION, tenant, tenant.getLandlord());
        } catch (Exception e) {
            log.error("Failed to send payment confirmation to tenant {}: {}", tenant.getId(), e.getMessage());
            return false;
        }
    }

    /**
     * Send welcome message to new tenant
     */
    public boolean sendWelcomeMessage(Tenant tenant) {
        try {
            String message = buildWelcomeMessage(tenant);
            return sendSMS(tenant.getFormattedPhone(), message, SMSLog.SMSType.WELCOME_MESSAGE, tenant, tenant.getLandlord());
        } catch (Exception e) {
            log.error("Failed to send welcome message to tenant {}: {}", tenant.getId(), e.getMessage());
            return false;
        }
    }

    /**
     * Notify landlord of payment received
     */
    public boolean notifyLandlordOfPayment(Tenant tenant, BigDecimal amount) {
        try {
            String message = buildLandlordPaymentNotification(tenant, amount);
            return sendSMS(tenant.getLandlord().getPhone(), message, SMSLog.SMSType.PAYMENT_CONFIRMATION, tenant, tenant.getLandlord());
        } catch (Exception e) {
            log.error("Failed to notify landlord {} of payment: {}", tenant.getLandlord().getId(), e.getMessage());
            return false;
        }
    }

    /**
     * Send bulk SMS to multiple tenants
     */
    public List<Boolean> sendBulkRentReminders(List<Tenant> tenants, int daysBefore) {
        List<Boolean> results = new ArrayList<>();
        
        for (Tenant tenant : tenants) {
            boolean success = sendRentReminder(tenant, daysBefore);
            results.add(success);
            
            // Add small delay to avoid rate limiting
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        
        return results;
    }

    /**
     * Send custom SMS
     */
    public boolean sendCustomSMS(String phone, String message, Tenant tenant, Landlord landlord) {
        return sendSMS(phone, message, SMSLog.SMSType.CUSTOM, tenant, landlord);
    }

    /**
     * Core SMS sending method
     */
    private boolean sendSMS(String phone, String message, SMSLog.SMSType smsType, Tenant tenant, Landlord landlord) {
        SMSLog smsLog = new SMSLog();
        smsLog.setRecipientPhone(phone);
        smsLog.setRecipientName(tenant != null ? tenant.getName() : "Unknown");
        smsLog.setMessage(message);
        smsLog.setSmsType(smsType);
        smsLog.setTenant(tenant);
        smsLog.setLandlord(landlord);
        smsLog.setStatus(SMSLog.SMSStatus.PENDING);

        try {
            // Send SMS using Africa's Talking
            List<Recipient> recipients = africasTalkingSmsService.send(message, new String[]{phone}, senderName);
            
            if (!recipients.isEmpty()) {
                Recipient recipient = recipients.get(0);
                
                if ("Success".equalsIgnoreCase(recipient.status)) {
                    smsLog.setStatus(SMSLog.SMSStatus.SENT);
                    smsLog.setMessageId(recipient.messageId);
                    smsLog.setCost(recipient.cost != null ? new BigDecimal(recipient.cost) : calculateSMSCost(message));
                    
                    log.info("SMS sent successfully to {}: {}", phone, recipient.messageId);
                } else {
                    smsLog.setStatus(SMSLog.SMSStatus.FAILED);
                    smsLog.setErrorMessage(recipient.status);
                    smsLog.setCost(BigDecimal.ZERO);
                    
                    log.error("SMS failed to send to {}: {}", phone, recipient.status);
                }
            } else {
                smsLog.setStatus(SMSLog.SMSStatus.FAILED);
                smsLog.setErrorMessage("No recipients returned from Africa's Talking");
                smsLog.setCost(BigDecimal.ZERO);
            }

        } catch (Exception e) {
            smsLog.setStatus(SMSLog.SMSStatus.FAILED);
            smsLog.setErrorMessage(e.getMessage());
            smsLog.setCost(BigDecimal.ZERO);
            
            log.error("Exception while sending SMS to {}: {}", phone, e.getMessage(), e);
        }

        // Save SMS log
        smsLogRepository.save(smsLog);
        
        return smsLog.getStatus() == SMSLog.SMSStatus.SENT;
    }

    /**
     * Build rent reminder message
     */
    private String buildRentReminderMessage(Tenant tenant, int daysBefore) {
        String dueDate = LocalDate.now().plusDays(daysBefore).format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        
        return String.format(
            "Hi %s, your rent of KES %s for %s Unit %s is due on %s. " +
            "Pay via M-Pesa: Paybill %s or Send to %s. Thank you.",
            tenant.getName(),
            formatAmount(tenant.getRentAmount()),
            tenant.getProperty().getName(),
            tenant.getUnitNumber(),
            dueDate,
            mpesaPaybill,
            mpesaPhone
        );
    }

    /**
     * Build overdue notice message
     */
    private String buildOverdueNoticeMessage(Tenant tenant, int daysOverdue) {
        return String.format(
            "Hi %s, your rent of KES %s for %s Unit %s is %d days overdue. " +
            "Please settle immediately to avoid penalties. Contact: %s",
            tenant.getName(),
            formatAmount(tenant.getRentAmount()),
            tenant.getProperty().getName(),
            tenant.getUnitNumber(),
            daysOverdue,
            mpesaPhone
        );
    }

    /**
     * Build payment confirmation message
     */
    private String buildPaymentConfirmationMessage(Tenant tenant, BigDecimal amount) {
        return String.format(
            "Hi %s, we confirm receipt of KES %s rent payment for %s Unit %s. " +
            "Thank you for your prompt payment.",
            tenant.getName(),
            formatAmount(amount),
            tenant.getProperty().getName(),
            tenant.getUnitNumber()
        );
    }

    /**
     * Build welcome message for new tenant
     */
    private String buildWelcomeMessage(Tenant tenant) {
        return String.format(
            "Welcome to %s, %s! Your rent of KES %s is due on the %s of each month. " +
            "Pay via M-Pesa: Paybill %s or Send to %s. Contact us for any assistance.",
            tenant.getProperty().getName(),
            tenant.getName(),
            formatAmount(tenant.getRentAmount()),
            getOrdinalNumber(tenant.getDueDate()),
            mpesaPaybill,
            mpesaPhone
        );
    }

    /**
     * Build landlord payment notification
     */
    private String buildLandlordPaymentNotification(Tenant tenant, BigDecimal amount) {
        return String.format(
            "Payment Alert: %s (Unit %s, %s) has paid KES %s. " +
            "Transaction recorded in your PropMan account.",
            tenant.getName(),
            tenant.getUnitNumber(),
            tenant.getProperty().getName(),
            formatAmount(amount)
        );
    }

    /**
     * Calculate SMS cost based on message length
     */
    private BigDecimal calculateSMSCost(String message) {
        int length = message.length();
        if (length <= 160) {
            return new BigDecimal("1.00");
        } else if (length <= 320) {
            return new BigDecimal("2.00");
        } else {
            return new BigDecimal("3.00");
        }
    }

    /**
     * Format amount with thousand separators
     */
    private String formatAmount(BigDecimal amount) {
        return String.format("%,.0f", amount);
    }

    /**
     * Get ordinal number (1st, 2nd, 3rd, etc.)
     */
    private String getOrdinalNumber(int number) {
        if (number >= 11 && number <= 13) {
            return number + "th";
        }
        switch (number % 10) {
            case 1: return number + "st";
            case 2: return number + "nd";
            case 3: return number + "rd";
            default: return number + "th";
        }
    }
}