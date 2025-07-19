package com.propman.service;

import com.africastalking.SmsService;
import com.africastalking.sms.Recipient;
import com.propman.entity.Landlord;
import com.propman.entity.Property;
import com.propman.entity.SMSLog;
import com.propman.entity.Tenant;
import com.propman.repository.SMSLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SMSServiceTest {

    @Mock
    private SmsService africasTalkingSmsService;

    @Mock
    private SMSLogRepository smsLogRepository;

    @InjectMocks
    private SMSService smsService;

    private Tenant testTenant;
    private Property testProperty;
    private Landlord testLandlord;

    @BeforeEach
    void setUp() {
        // Set up test data
        testLandlord = new Landlord();
        testLandlord.setId(1L);
        testLandlord.setBusinessName("Test Properties");
        testLandlord.setOwnerName("John Doe");
        testLandlord.setPhone("+254712345678");
        testLandlord.setEmail("john@test.com");

        testProperty = new Property();
        testProperty.setId(1L);
        testProperty.setName("Test Apartments");
        testProperty.setLocation("Nairobi");
        testProperty.setLandlord(testLandlord);

        testTenant = new Tenant();
        testTenant.setId(1L);
        testTenant.setName("Jane Smith");
        testTenant.setPhone("+254722123456");
        testTenant.setEmail("jane@test.com");
        testTenant.setRentAmount(new BigDecimal("30000"));
        testTenant.setDueDate(5);
        testTenant.setUnitNumber("A1");
        testTenant.setProperty(testProperty);
        testTenant.setLandlord(testLandlord);
        testTenant.setStatus(Tenant.TenantStatus.ACTIVE);

        // Set up configuration values
        ReflectionTestUtils.setField(smsService, "senderName", "PropMan");
        ReflectionTestUtils.setField(smsService, "mpesaPaybill", "696385");
        ReflectionTestUtils.setField(smsService, "mpesaPhone", "0705441549");
    }

    @Test
    void testSendRentReminder_Success() throws Exception {
        // Arrange
        Recipient mockRecipient = new Recipient();
        mockRecipient.status = "Success";
        mockRecipient.messageId = "ATXid_123456";
        mockRecipient.cost = "KES 1.0000";

        when(africasTalkingSmsService.send(anyString(), any(String[].class), anyString()))
                .thenReturn(Collections.singletonList(mockRecipient));
        when(smsLogRepository.save(any(SMSLog.class))).thenReturn(new SMSLog());

        // Act
        boolean result = smsService.sendRentReminder(testTenant, 3);

        // Assert
        assertTrue(result);
        verify(africasTalkingSmsService).send(anyString(), any(String[].class), eq("PropMan"));
        verify(smsLogRepository).save(any(SMSLog.class));
    }

    @Test
    void testSendRentReminder_Failure() throws Exception {
        // Arrange
        Recipient mockRecipient = new Recipient();
        mockRecipient.status = "Failed";
        mockRecipient.messageId = null;

        when(africasTalkingSmsService.send(anyString(), any(String[].class), anyString()))
                .thenReturn(Collections.singletonList(mockRecipient));
        when(smsLogRepository.save(any(SMSLog.class))).thenReturn(new SMSLog());

        // Act
        boolean result = smsService.sendRentReminder(testTenant, 3);

        // Assert
        assertFalse(result);
        verify(smsLogRepository).save(any(SMSLog.class));
    }

    @Test
    void testSendOverdueNotice_Success() throws Exception {
        // Arrange
        Recipient mockRecipient = new Recipient();
        mockRecipient.status = "Success";
        mockRecipient.messageId = "ATXid_789012";

        when(africasTalkingSmsService.send(anyString(), any(String[].class), anyString()))
                .thenReturn(Collections.singletonList(mockRecipient));
        when(smsLogRepository.save(any(SMSLog.class))).thenReturn(new SMSLog());

        // Act
        boolean result = smsService.sendOverdueNotice(testTenant, 5);

        // Assert
        assertTrue(result);
        verify(africasTalkingSmsService).send(anyString(), any(String[].class), eq("PropMan"));
        verify(smsLogRepository).save(any(SMSLog.class));
    }

    @Test
    void testSendPaymentConfirmation_Success() throws Exception {
        // Arrange
        Recipient mockRecipient = new Recipient();
        mockRecipient.status = "Success";
        mockRecipient.messageId = "ATXid_345678";

        when(africasTalkingSmsService.send(anyString(), any(String[].class), anyString()))
                .thenReturn(Collections.singletonList(mockRecipient));
        when(smsLogRepository.save(any(SMSLog.class))).thenReturn(new SMSLog());

        // Act
        boolean result = smsService.sendPaymentConfirmation(testTenant, new BigDecimal("30000"));

        // Assert
        assertTrue(result);
        verify(africasTalkingSmsService).send(anyString(), any(String[].class), eq("PropMan"));
        verify(smsLogRepository).save(any(SMSLog.class));
    }

    @Test
    void testSendWelcomeMessage_Success() throws Exception {
        // Arrange
        Recipient mockRecipient = new Recipient();
        mockRecipient.status = "Success";
        mockRecipient.messageId = "ATXid_901234";

        when(africasTalkingSmsService.send(anyString(), any(String[].class), anyString()))
                .thenReturn(Collections.singletonList(mockRecipient));
        when(smsLogRepository.save(any(SMSLog.class))).thenReturn(new SMSLog());

        // Act
        boolean result = smsService.sendWelcomeMessage(testTenant);

        // Assert
        assertTrue(result);
        verify(africasTalkingSmsService).send(anyString(), any(String[].class), eq("PropMan"));
        verify(smsLogRepository).save(any(SMSLog.class));
    }
}