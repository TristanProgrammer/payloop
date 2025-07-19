import { differenceInDays, format, addDays } from 'date-fns';
import { sendRentReminderSMS, createRentReminderMessage, SMSResponse } from './africasTalkingService';

interface Tenant {
  id: string;
  name: string;
  phone: string;
  dueDay: number; // 1-31
  rentAmount: number;
  propertyId: string;
  status: 'active' | 'inactive' | 'suspended' | 'defaulter';
}

interface Property {
  id: string;
  name: string;
  location: string;
}

interface ReminderLog {
  id: string;
  tenantId: string;
  reminderType: 'due_soon' | 'due_today' | 'overdue';
  sentAt: Date;
  success: boolean;
  cost: number;
  messageId?: string;
  error?: string;
}

export class RentReminderScheduler {
  private static instance: RentReminderScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private reminderLogs: ReminderLog[] = [];

  private constructor() {
    // Load existing logs from localStorage
    const stored = localStorage.getItem('rent_reminder_logs');
    if (stored) {
      try {
        this.reminderLogs = JSON.parse(stored).map((log: any) => ({
          ...log,
          sentAt: new Date(log.sentAt)
        }));
      } catch (error) {
        console.error('Error loading reminder logs:', error);
      }
    }
  }

  static getInstance(): RentReminderScheduler {
    if (!RentReminderScheduler.instance) {
      RentReminderScheduler.instance = new RentReminderScheduler();
    }
    return RentReminderScheduler.instance;
  }

  // Start the scheduler to check every hour
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Rent Reminder Scheduler started');
    
    // Run immediately on start
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
    console.log('⏹️ Rent Reminder Scheduler stopped');
  }

  // Check for tenants who need reminders and send them
  private async checkAndSendReminders(): Promise<void> {
    try {
      console.log('🔍 Checking for rent reminders to send...');
      
      const now = new Date();
      const currentHour = now.getHours();
      
      // Only send reminders during business hours (8 AM - 6 PM)
      if (currentHour < 8 || currentHour > 18) {
        console.log('⏰ Outside business hours, skipping SMS reminders');
        return;
      }

      // Get tenants and properties from localStorage (in production, this would come from your backend)
      const tenants = this.getTenantsFromStorage();
      const properties = this.getPropertiesFromStorage();
      
      if (tenants.length === 0) {
        console.log('📭 No tenants found, skipping reminder check');
        return;
      }

      const remindersToSend = this.identifyTenantsForReminders(tenants, now);
      
      if (remindersToSend.length === 0) {
        console.log('✅ No reminders needed at this time');
        return;
      }

      console.log(`📨 Found ${remindersToSend.length} tenants who need reminders`);
      
      // Send reminders
      for (const reminder of remindersToSend) {
        await this.sendReminderToTenant(reminder, properties);
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Save logs
      this.saveLogsToStorage();
      
      console.log('✅ Rent reminder check completed');
    } catch (error) {
      console.error('❌ Error in rent reminder scheduler:', error);
    }
  }

  // Identify tenants who need reminders based on their due dates
  private identifyTenantsForReminders(tenants: Tenant[], currentDate: Date): Array<{
    tenant: Tenant;
    reminderType: 'due_soon' | 'due_today' | 'overdue';
    daysOverdue?: number;
  }> {
    const reminders: Array<{
      tenant: Tenant;
      reminderType: 'due_soon' | 'due_today' | 'overdue';
      daysOverdue?: number;
    }> = [];

    const today = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    for (const tenant of tenants) {
      // Skip inactive tenants
      if (tenant.status === 'inactive') continue;

      // Check if we already sent a reminder today
      if (this.hasReminderBeenSentToday(tenant.id, currentDate)) {
        continue;
      }

      const dueDay = tenant.dueDay;
      
      // Calculate due date for current month
      let dueDate = new Date(currentYear, currentMonth, dueDay);
      
      // If due date has passed this month, it's overdue
      if (dueDate < currentDate) {
        const daysOverdue = differenceInDays(currentDate, dueDate);
        
        // Send overdue reminders (3 days after due date)
        if (daysOverdue === 3) {
          reminders.push({
            tenant,
            reminderType: 'overdue',
            daysOverdue
          });
        }
      } else {
        // Due date is in the future this month
        const daysUntilDue = differenceInDays(dueDate, currentDate);
        
        if (daysUntilDue === 3) {
          // Send "due soon" reminder (3 days before)
          reminders.push({
            tenant,
            reminderType: 'due_soon'
          });
        } else if (daysUntilDue === 0) {
          // Send "due today" reminder
          reminders.push({
            tenant,
            reminderType: 'due_today'
          });
        }
      }
    }

    return reminders;
  }

  // Send reminder to a specific tenant
  private async sendReminderToTenant(
    reminder: {
      tenant: Tenant;
      reminderType: 'due_soon' | 'due_today' | 'overdue';
      daysOverdue?: number;
    },
    properties: Property[]
  ): Promise<void> {
    const { tenant, reminderType, daysOverdue } = reminder;
    
    try {
      // Find property name
      const property = properties.find(p => p.id === tenant.propertyId);
      const propertyName = property ? property.name : 'Your Property';
      
      // Create personalized message
      const message = createRentReminderMessage(
        tenant.name,
        tenant.rentAmount,
        tenant.dueDay,
        propertyName,
        reminderType,
        daysOverdue
      );
      
      console.log(`📱 Sending ${reminderType} reminder to ${tenant.name} (${tenant.phone})`);
      
      // Send SMS via Africa's Talking
      const result = await sendRentReminderSMS(tenant.phone, message);
      
      // Log the result
      const log: ReminderLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        tenantId: tenant.id,
        reminderType,
        sentAt: new Date(),
        success: result.success,
        cost: result.cost || 0,
        messageId: result.messageId,
        error: result.error
      };
      
      this.reminderLogs.push(log);
      
      if (result.success) {
        console.log(`✅ Successfully sent ${reminderType} reminder to ${tenant.name}`);
      } else {
        console.log(`❌ Failed to send ${reminderType} reminder to ${tenant.name}: ${result.error}`);
      }
      
    } catch (error: any) {
      console.error(`❌ Error sending reminder to ${tenant.name}:`, error);
      
      // Log the error
      const errorLog: ReminderLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        tenantId: tenant.id,
        reminderType,
        sentAt: new Date(),
        success: false,
        cost: 0,
        error: error.message
      };
      
      this.reminderLogs.push(errorLog);
    }
  }

  // Check if a reminder has already been sent to a tenant today
  private hasReminderBeenSentToday(tenantId: string, currentDate: Date): boolean {
    const today = format(currentDate, 'yyyy-MM-dd');
    
    return this.reminderLogs.some(log => 
      log.tenantId === tenantId && 
      format(log.sentAt, 'yyyy-MM-dd') === today &&
      log.success
    );
  }

  // Get tenants from localStorage (in production, this would be an API call)
  private getTenantsFromStorage(): Tenant[] {
    try {
      const stored = localStorage.getItem('propman_tenants');
      if (!stored) return [];
      
      const tenants = JSON.parse(stored);
      return tenants.map((t: any) => ({
        id: t.id,
        name: t.name,
        phone: t.phone,
        dueDay: t.dueDate, // Map dueDate to dueDay
        rentAmount: t.rentAmount,
        propertyId: t.propertyId,
        status: t.status
      }));
    } catch (error) {
      console.error('Error loading tenants:', error);
      return [];
    }
  }

  // Get properties from localStorage (in production, this would be an API call)
  private getPropertiesFromStorage(): Property[] {
    try {
      const stored = localStorage.getItem('propman_properties');
      if (!stored) return [];
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading properties:', error);
      return [];
    }
  }

  // Save logs to localStorage
  private saveLogsToStorage(): void {
    try {
      // Keep only last 1000 logs
      const logsToSave = this.reminderLogs.slice(-1000);
      localStorage.setItem('rent_reminder_logs', JSON.stringify(logsToSave));
    } catch (error) {
      console.error('Error saving reminder logs:', error);
    }
  }

  // Manual trigger for testing
  async triggerManualCheck(): Promise<void> {
    console.log('🔧 Manual rent reminder check triggered');
    await this.checkAndSendReminders();
  }

  // Get reminder statistics
  getStats(): {
    totalSent: number;
    totalFailed: number;
    totalCost: number;
    todaysSent: number;
    successRate: number;
  } {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaysLogs = this.reminderLogs.filter(log => 
      format(log.sentAt, 'yyyy-MM-dd') === today
    );
    
    const totalSent = this.reminderLogs.filter(log => log.success).length;
    const totalFailed = this.reminderLogs.filter(log => !log.success).length;
    const totalCost = this.reminderLogs.reduce((sum, log) => sum + log.cost, 0);
    const todaysSent = todaysLogs.filter(log => log.success).length;
    const successRate = this.reminderLogs.length > 0 ? 
      (totalSent / this.reminderLogs.length) * 100 : 0;
    
    return {
      totalSent,
      totalFailed,
      totalCost,
      todaysSent,
      successRate
    };
  }

  // Get recent logs
  getRecentLogs(limit: number = 50): ReminderLog[] {
    return this.reminderLogs
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(0, limit);
  }

  // Clear all logs
  clearLogs(): void {
    this.reminderLogs = [];
    localStorage.removeItem('rent_reminder_logs');
  }
}

// Initialize and export scheduler instance
export const rentReminderScheduler = RentReminderScheduler.getInstance();

// Auto-start scheduler when the module loads
if (typeof window !== 'undefined') {
  // Only start in browser environment
  rentReminderScheduler.start();
}