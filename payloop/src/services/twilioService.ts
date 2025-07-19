// Note: In a browser environment, we need to handle Twilio differently
// This service will work with a backend API that handles Twilio calls

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Simulate Twilio SMS sending (in production, this would call your backend API)
export const sendSMS = async (to: string, message: string): Promise<SMSResponse> => {
  try {
    // Format phone number for Kenyan numbers
    const formattedPhone = formatKenyanPhoneNumber(to);
    
    // In production, this would be an API call to your backend
    // For now, we'll simulate the SMS sending
    console.log(`SMS would be sent to ${formattedPhone}: ${message}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success (in production, this would be the actual Twilio response)
    return {
      success: true,
      messageId: `SM${Date.now()}`,
    };
  } catch (error: any) {
    console.error('SMS sending failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
};

export const sendVerificationSMS = async (phone: string, code: string): Promise<SMSResponse> => {
  const message = `Your PropMan Kenya verification code is: ${code}. This code expires in 10 minutes. Do not share this code with anyone.`;
  return sendSMS(phone, message);
};

export const sendPaymentReminderSMS = async (
  phone: string, 
  tenantName: string, 
  amount: number, 
  dueDate: string,
  propertyName: string
): Promise<SMSResponse> => {
  const message = `Hi ${tenantName}, your rent of KES ${amount.toLocaleString()} for ${propertyName} is due on ${dueDate}. Please make payment via M-Pesa Paybill. Thank you.`;
  return sendSMS(phone, message);
};

export const sendOverdueReminderSMS = async (
  phone: string, 
  tenantName: string, 
  amount: number, 
  daysOverdue: number,
  propertyName: string
): Promise<SMSResponse> => {
  const message = `Hi ${tenantName}, your rent of KES ${amount.toLocaleString()} for ${propertyName} is ${daysOverdue} days overdue. Please settle immediately to avoid penalties. Contact us for assistance.`;
  return sendSMS(phone, message);
};

// Format Kenyan phone numbers to international format
export const formatKenyanPhoneNumber = (phone: string): string => {
  // Remove any spaces, dashes, or other characters
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