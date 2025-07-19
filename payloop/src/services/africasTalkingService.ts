// Africa's Talking SMS Service for Rent Reminders
export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
  recipients?: number;
}

// Africa's Talking API configuration using your sandbox credentials
const AT_CONFIG = {
  apiKey: 'atsk_ffd5e7269057fedcc6bf0d52e7a1f5e30ddcc4f7e2542278ee5e708ffbf6b85567ebad6a',
  username: 'sandbox',
  baseUrl: 'https://api.sandbox.africastalking.com/version1/messaging'
};

// Format phone number for Africa's Talking (must include country code)
export const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different Kenyan phone number formats
  if (cleaned.startsWith('254')) {
    // Already in international format
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    // Local format starting with 0 (e.g., 0712345678)
    return `+254${cleaned.substring(1)}`;
  } else if (cleaned.length === 9) {
    // Without country code or leading 0 (e.g., 712345678)
    return `+254${cleaned}`;
  }
  
  // Default: assume it's a valid international number
  return phone.startsWith('+') ? phone : `+${phone}`;
};

// Calculate SMS cost (Africa's Talking pricing for Kenya)
export const calculateSMSCost = (messageLength: number): number => {
  // Standard SMS (160 chars) = KES 1.00
  // Long SMS (161-320 chars) = KES 2.00
  // Extra long SMS (321+ chars) = KES 3.00
  
  if (messageLength <= 160) {
    return 1.00;
  } else if (messageLength <= 320) {
    return 2.00;
  } else {
    return 3.00;
  }
};

// Core SMS sending function using Africa's Talking API
export const sendRentReminderSMS = async (to: string, message: string): Promise<SMSResponse> => {
  try {
    const formattedPhone = formatPhoneNumber(to);
    const cost = calculateSMSCost(message.length);
    
    console.log('Sending SMS via Africa\'s Talking:', {
      to: formattedPhone,
      message,
      cost,
      apiKey: AT_CONFIG.apiKey.substring(0, 10) + '...',
      username: AT_CONFIG.username
    });
    
    // In production, this would make actual API call to Africa's Talking
    // For now, we'll simulate the API call with realistic behavior
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate success/failure (95% success rate)
    const isSuccess = Math.random() > 0.05;
    
    if (isSuccess) {
      return {
        success: true,
        messageId: `ATXid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cost,
        recipients: 1
      };
    } else {
      return {
        success: false,
        error: 'Network error or invalid phone number',
        cost: 0,
        recipients: 0
      };
    }
  } catch (error: any) {
    console.error('Africa\'s Talking SMS error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
      cost: 0,
      recipients: 0
    };
  }
};

// Send bulk SMS to multiple recipients
export const sendBulkRentReminders = async (
  recipients: Array<{ phone: string; message: string; tenantName: string }>
): Promise<SMSResponse> => {
  try {
    console.log(`Sending bulk SMS to ${recipients.length} recipients via Africa's Talking`);
    
    let totalCost = 0;
    let successCount = 0;
    let failureCount = 0;
    const results: Array<{ success: boolean; phone: string; error?: string }> = [];
    
    // Send SMS to each recipient with small delay to avoid rate limiting
    for (const recipient of recipients) {
      try {
        const result = await sendRentReminderSMS(recipient.phone, recipient.message);
        
        if (result.success) {
          successCount++;
          totalCost += result.cost || 0;
          results.push({ success: true, phone: recipient.phone });
        } else {
          failureCount++;
          results.push({ 
            success: false, 
            phone: recipient.phone, 
            error: result.error 
          });
        }
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error: any) {
        failureCount++;
        results.push({ 
          success: false, 
          phone: recipient.phone, 
          error: error.message 
        });
      }
    }
    
    console.log('Bulk SMS Results:', {
      total: recipients.length,
      successful: successCount,
      failed: failureCount,
      totalCost
    });
    
    return {
      success: successCount > 0,
      messageId: `BULK_${Date.now()}`,
      cost: totalCost,
      recipients: successCount,
      error: failureCount > 0 ? `${failureCount} messages failed to send` : undefined
    };
    
  } catch (error: any) {
    console.error('Bulk SMS error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send bulk SMS',
      cost: 0,
      recipients: 0
    };
  }
};

// SMS Templates for different reminder types
export const createRentReminderMessage = (
  tenantName: string,
  rentAmount: number,
  dueDay: number,
  propertyName: string,
  reminderType: 'due_soon' | 'due_today' | 'overdue',
  daysOverdue?: number
): string => {
  const formattedAmount = `KES ${rentAmount.toLocaleString()}`;
  
  switch (reminderType) {
    case 'due_soon':
      return `Hi ${tenantName}, your rent of ${formattedAmount} for ${propertyName} is due in 3 days (${dueDay}th). Pay via M-Pesa: Paybill 696385 or Send to 0705441549. Thank you.`;
    
    case 'due_today':
      return `Hi ${tenantName}, your rent of ${formattedAmount} for ${propertyName} is due TODAY (${dueDay}th). Pay via M-Pesa: Paybill 696385 or Send to 0705441549. Contact us for assistance.`;
    
    case 'overdue':
      return `Hi ${tenantName}, your rent of ${formattedAmount} for ${propertyName} is ${daysOverdue} days overdue. Please settle immediately to avoid penalties. Pay via M-Pesa: Paybill 696385 or 0705441549.`;
    
    default:
      return `Hi ${tenantName}, rent reminder for ${propertyName}. Amount: ${formattedAmount}. Pay via M-Pesa: Paybill 696385 or 0705441549.`;
  }
};

// Validate Kenyan phone number
export const validateKenyanPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Check for valid Kenyan phone number patterns
  const patterns = [
    /^254[17]\d{8}$/, // +254 7xx xxx xxx or +254 1xx xxx xxx
    /^0[17]\d{8}$/, // 07xx xxx xxx or 01xx xxx xxx
    /^[17]\d{8}$/, // 7xx xxx xxx or 1xx xxx xxx
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
};

// Get SMS delivery status (for future implementation)
export const getSMSStatus = async (messageId: string): Promise<{
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  cost?: number;
}> => {
  // This would query Africa's Talking delivery reports API
  // For now, return a simulated status
  return {
    status: 'delivered',
    cost: 1.00
  };
};

// Test SMS sending function
export const testSMSConnection = async (): Promise<SMSResponse> => {
  const testMessage = "Test message from PropMan Kenya SMS system";
  const testPhone = "+254700000000"; // Africa's Talking test number
  
  return sendRentReminderSMS(testPhone, testMessage);
};