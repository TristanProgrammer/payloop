import { useSMS } from '../contexts/SMSContext';
import { useProperty } from '../contexts/PropertyContext';
import { differenceInDays, format } from 'date-fns';

// SMS Scheduler Service
export class SMSScheduler {
  private static instance: SMSScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): SMSScheduler {
    if (!SMSScheduler.instance) {
      SMSScheduler.instance = new SMSScheduler();
    }
    return SMSScheduler.instance;
  }

  // Start the scheduler to run every hour
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('SMS Scheduler started');
    
    // Run immediately
    this.checkAndSendReminders();
    
    // Then run every hour
    this.intervalId = setInterval(() => {
      this.checkAndSendReminders();
    }, 60 * 60 * 1000); // 1 hour
  }

  // Stop the scheduler
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('SMS Scheduler stopped');
  }

  // Check for due reminders and send them
  private async checkAndSendReminders(): Promise<void> {
    try {
      console.log('Checking for SMS reminders to send...');
      
      // This would typically be called from a context or service
      // For now, we'll simulate the logic
      
      const now = new Date();
      const currentHour = now.getHours();
      
      // Only send reminders during business hours (8 AM - 6 PM)
      if (currentHour < 8 || currentHour > 18) {
        console.log('Outside business hours, skipping SMS reminders');
        return;
      }

      // In a real implementation, this would:
      // 1. Get all active campaigns
      // 2. Check which tenants are due for reminders
      // 3. Send appropriate SMS messages
      // 4. Log the results
      
      console.log('SMS reminder check completed');
    } catch (error) {
      console.error('Error in SMS scheduler:', error);
    }
  }

  // Manual trigger for testing
  async triggerManualCheck(): Promise<void> {
    console.log('Manual SMS reminder check triggered');
    await this.checkAndSendReminders();
  }
}

// Initialize scheduler when the module loads
export const smsScheduler = SMSScheduler.getInstance();

// Auto-start scheduler in development
if (import.meta.env.DEV) {
  smsScheduler.start();
}

// Utility functions for SMS scheduling
export const calculateNextReminderDate = (
  dueDate: Date,
  reminderType: 'before' | 'on' | 'after',
  days: number = 0
): Date => {
  const reminderDate = new Date(dueDate);
  
  if (reminderType === 'before') {
    reminderDate.setDate(reminderDate.getDate() - days);
  } else if (reminderType === 'after') {
    reminderDate.setDate(reminderDate.getDate() + days);
  }
  
  return reminderDate;
};

export const shouldSendReminder = (
  tenantDueDate: number,
  reminderType: 'before' | 'on' | 'after',
  days: number = 0
): boolean => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Create due date for current month
  const dueDate = new Date(currentYear, currentMonth, tenantDueDate);
  
  // Calculate when reminder should be sent
  const reminderDate = calculateNextReminderDate(dueDate, reminderType, days);
  
  // Check if today is the reminder date
  const daysDiff = differenceInDays(today, reminderDate);
  
  return daysDiff === 0;
};

export const formatReminderMessage = (
  template: string,
  variables: Record<string, string>
): string => {
  let message = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{${key}}`, 'g'), value);
  });
  
  return message;
};

// SMS cost calculator
export const calculateSMSCost = (messageLength: number): number => {
  // Standard SMS is 160 characters = KES 1.50
  // Long SMS (161-320 chars) = KES 3.00
  // Extra long SMS (321+ chars) = KES 4.50
  
  if (messageLength <= 160) {
    return 1.50;
  } else if (messageLength <= 320) {
    return 3.00;
  } else {
    return 4.50;
  }
};

// Validate Kenyan phone number
export const validateKenyanPhone = (phone: string): boolean => {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check for valid Kenyan phone number patterns
  const patterns = [
    /^254[17]\d{8}$/, // +254 7xx xxx xxx or +254 1xx xxx xxx
    /^0[17]\d{8}$/, // 07xx xxx xxx or 01xx xxx xxx
    /^[17]\d{8}$/, // 7xx xxx xxx or 1xx xxx xxx
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
};