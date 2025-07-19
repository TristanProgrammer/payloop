import React, { createContext, useContext, useState, useEffect } from 'react';
import { useProperty } from './PropertyContext';
import { sendRentReminderSMS, createRentReminderMessage, calculateSMSCost } from '../services/africasTalkingService';
import { format, addDays, differenceInDays } from 'date-fns';

interface SMSTemplate {
  id: string;
  name: string;
  type: 'reminder' | 'overdue' | 'welcome' | 'custom';
  message: string;
  variables: string[]; // Available variables like {tenantName}, {amount}, etc.
  isActive: boolean;
  createdAt: Date;
}

interface SMSCampaign {
  id: string;
  name: string;
  templateId: string;
  propertyIds: string[]; // Empty array means all properties
  scheduleType: 'before_due' | 'on_due' | 'after_due';
  daysBefore?: number; // For before_due type
  daysAfter?: number; // For after_due type
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
}

interface SMSLog {
  id: string;
  tenantId: string;
  campaignId?: string;
  templateId: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: Date;
  cost: number; // SMS cost in KES
  error?: string;
}

interface SMSStats {
  totalSent: number;
  totalFailed: number;
  totalCost: number;
  monthlyUsage: number;
  successRate: number;
}

interface SMSContextType {
  templates: SMSTemplate[];
  campaigns: SMSCampaign[];
  logs: SMSLog[];
  stats: SMSStats;
  addTemplate: (template: Omit<SMSTemplate, 'id' | 'createdAt'>) => void;
  updateTemplate: (id: string, updates: Partial<SMSTemplate>) => void;
  deleteTemplate: (id: string) => void;
  addCampaign: (campaign: Omit<SMSCampaign, 'id' | 'createdAt'>) => void;
  updateCampaign: (id: string, updates: Partial<SMSCampaign>) => void;
  deleteCampaign: (id: string) => void;
  sendBulkSMS: (tenantIds: string[], templateId: string) => Promise<void>;
  sendSingleSMS: (tenantId: string, message: string) => Promise<void>;
  runCampaigns: () => Promise<void>;
  getLogsForTenant: (tenantId: string) => SMSLog[];
  getTemplateVariables: () => string[];
  previewMessage: (templateId: string, tenantId: string) => string;
  clearAllData: () => void;
}

const SMSContext = createContext<SMSContextType | undefined>(undefined);

export const useSMS = () => {
  const context = useContext(SMSContext);
  if (context === undefined) {
    throw new Error('useSMS must be used within an SMSProvider');
  }
  return context;
};

export const SMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenants, properties } = useProperty();
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [stats, setStats] = useState<SMSStats>({
    totalSent: 0,
    totalFailed: 0,
    totalCost: 0,
    monthlyUsage: 0,
    successRate: 0,
  });

  useEffect(() => {
    // Load data from localStorage or set defaults
    const storedTemplates = localStorage.getItem('propman_sms_templates');
    const storedCampaigns = localStorage.getItem('propman_sms_campaigns');
    const storedLogs = localStorage.getItem('propman_sms_logs');
    const storedStats = localStorage.getItem('propman_sms_stats');

    if (storedTemplates) {
      try {
        const parsedTemplates = JSON.parse(storedTemplates);
        setTemplates(parsedTemplates.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt)
        })));
      } catch (error) {
        console.error('Error loading SMS templates:', error);
        loadDefaultTemplates();
      }
    } else {
      loadDefaultTemplates();
    }

    if (storedCampaigns) {
      try {
        const parsedCampaigns = JSON.parse(storedCampaigns);
        setCampaigns(parsedCampaigns.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          lastRun: c.lastRun ? new Date(c.lastRun) : undefined,
          nextRun: c.nextRun ? new Date(c.nextRun) : undefined
        })));
      } catch (error) {
        console.error('Error loading SMS campaigns:', error);
      }
    }

    if (storedLogs) {
      try {
        const parsedLogs = JSON.parse(storedLogs);
        setLogs(parsedLogs.map((l: any) => ({
          ...l,
          sentAt: new Date(l.sentAt)
        })));
      } catch (error) {
        console.error('Error loading SMS logs:', error);
      }
    }

    if (storedStats) {
      try {
        setStats(JSON.parse(storedStats));
      } catch (error) {
        console.error('Error loading SMS stats:', error);
      }
    }
  }, []);

  const loadDefaultTemplates = () => {
    const defaultTemplates: SMSTemplate[] = [
      {
        id: '1',
        name: 'Rent Reminder (3 Days Before)',
        type: 'reminder',
        message: 'Hi {tenantName}, your rent of KES {amount} for {propertyName} Unit {unitNumber} is due on {dueDate}. Pay via M-Pesa: Paybill 696385 or Send to 0705441549. Thank you.',
        variables: ['tenantName', 'amount', 'propertyName', 'unitNumber', 'dueDate'],
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: '2',
        name: 'Rent Due Today',
        type: 'reminder',
        message: 'Hi {tenantName}, your rent of KES {amount} for {propertyName} Unit {unitNumber} is due TODAY. Pay via M-Pesa: Paybill 696385 or Send to 0705441549. Contact us for assistance.',
        variables: ['tenantName', 'amount', 'propertyName', 'unitNumber'],
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: '3',
        name: 'Overdue Payment Notice',
        type: 'overdue',
        message: 'Hi {tenantName}, your rent of KES {amount} for {propertyName} Unit {unitNumber} is {daysOverdue} days overdue. Please settle immediately. Contact: 0705441549',
        variables: ['tenantName', 'amount', 'propertyName', 'unitNumber', 'daysOverdue'],
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: '4',
        name: 'Welcome New Tenant',
        type: 'welcome',
        message: 'Welcome to {propertyName}, {tenantName}! Your rent of KES {amount} is due on {dueDate} monthly. Pay via Paybill 696385 or Send to 0705441549',
        variables: ['tenantName', 'propertyName', 'amount', 'dueDate'],
        isActive: true,
        createdAt: new Date(),
      },
    ];
    setTemplates(defaultTemplates);
  };

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('propman_sms_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('propman_sms_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('propman_sms_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('propman_sms_stats', JSON.stringify(stats));
  }, [stats]);

  const calculateNextRun = (campaign: SMSCampaign): Date => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    if (campaign.scheduleType === 'before_due' && campaign.daysBefore) {
      return addDays(nextMonth, -campaign.daysBefore);
    } else if (campaign.scheduleType === 'on_due') {
      return nextMonth;
    } else if (campaign.scheduleType === 'after_due' && campaign.daysAfter) {
      return addDays(nextMonth, campaign.daysAfter);
    }
    
    return nextMonth;
  };

  const addTemplate = (template: Omit<SMSTemplate, 'id' | 'createdAt'>) => {
    const newTemplate: SMSTemplate = {
      ...template,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setTemplates(prev => [...prev, newTemplate]);
  };

  const updateTemplate = (id: string, updates: Partial<SMSTemplate>) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === id ? { ...template, ...updates } : template
      )
    );
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
    // Also remove any campaigns using this template
    setCampaigns(prev => prev.filter(campaign => campaign.templateId !== id));
  };

  const addCampaign = (campaign: Omit<SMSCampaign, 'id' | 'createdAt'>) => {
    const newCampaign: SMSCampaign = {
      ...campaign,
      id: Date.now().toString(),
      createdAt: new Date(),
      nextRun: calculateNextRun(campaign as SMSCampaign),
    };
    setCampaigns(prev => [...prev, newCampaign]);
  };

  const updateCampaign = (id: string, updates: Partial<SMSCampaign>) => {
    setCampaigns(prev => 
      prev.map(campaign => {
        if (campaign.id === id) {
          const updated = { ...campaign, ...updates };
          return {
            ...updated,
            nextRun: calculateNextRun(updated),
          };
        }
        return campaign;
      })
    );
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
  };

  const getTemplateVariables = (): string[] => {
    return [
      'tenantName',
      'amount',
      'propertyName',
      'unitNumber',
      'dueDate',
      'daysOverdue',
      'ownerName',
      'businessName',
      'currentDate',
    ];
  };

  const previewMessage = (templateId: string, tenantId: string): string => {
    const template = templates.find(t => t.id === templateId);
    const tenant = tenants.find(t => t.id === tenantId);
    const property = properties.find(p => p.id === tenant?.propertyId);
    
    if (!template || !tenant || !property) return '';

    let message = template.message;
    
    // Replace variables
    const variables = {
      tenantName: tenant.name,
      amount: tenant.rentAmount.toLocaleString(),
      propertyName: property.name,
      unitNumber: tenant.unitNumber,
      dueDate: tenant.dueDate.toString(),
      daysOverdue: Math.max(0, differenceInDays(new Date(), new Date(2024, 0, tenant.dueDate))).toString(),
      ownerName: 'John Kamau', // From auth context
      businessName: 'Nairobi Properties Ltd', // From auth context
      currentDate: format(new Date(), 'dd/MM/yyyy'),
    };

    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    return message;
  };

  const sendSingleSMS = async (tenantId: string, message: string): Promise<void> => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) throw new Error('Tenant not found');

    try {
      // Use Africa's Talking service
      const result = await sendPaymentReminderSMS(
        tenant.phone,
        tenant.name,
        tenant.rentAmount,
        tenant.dueDate.toString(),
        properties.find(p => p.id === tenant.propertyId)?.name || 'Property'
      );

      const cost = calculateSMSCost(message.length);

      const log: SMSLog = {
        id: Date.now().toString(),
        tenantId,
        templateId: 'custom',
        message,
        status: result.success ? 'sent' : 'failed',
        sentAt: new Date(),
        cost: result.cost || cost,
        error: result.error,
      };

      setLogs(prev => [log, ...prev]);
      
      if (result.success) {
        setStats(prev => ({
          ...prev,
          totalSent: prev.totalSent + 1,
          totalCost: prev.totalCost + (result.cost || cost),
          monthlyUsage: prev.monthlyUsage + 1,
          successRate: ((prev.totalSent + 1) / (prev.totalSent + prev.totalFailed + 1)) * 100,
        }));
      } else {
        setStats(prev => ({
          ...prev,
          totalFailed: prev.totalFailed + 1,
          successRate: (prev.totalSent / (prev.totalSent + prev.totalFailed + 1)) * 100,
        }));
      }
    } catch (error: any) {
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  };

  const sendBulkSMS = async (tenantIds: string[], templateId: string): Promise<void> => {
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    const results = await Promise.allSettled(
      tenantIds.map(async (tenantId) => {
        const message = previewMessage(templateId, tenantId);
        return sendSingleSMS(tenantId, message);
      })
    );

    // Update stats based on results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    setStats(prev => ({
      ...prev,
      totalSent: prev.totalSent + successful,
      totalFailed: prev.totalFailed + failed,
      totalCost: prev.totalCost + (successful * 1.0), // Africa's Talking pricing
      monthlyUsage: prev.monthlyUsage + successful,
      successRate: ((prev.totalSent + successful) / (prev.totalSent + prev.totalFailed + successful + failed)) * 100,
    }));
  };

  const runCampaigns = async (): Promise<void> => {
    const now = new Date();
    const activeCampaigns = campaigns.filter(c => c.isActive && c.nextRun && c.nextRun <= now);

    for (const campaign of activeCampaigns) {
      try {
        // Get eligible tenants
        const eligibleTenants = tenants.filter(tenant => {
          // Filter by property if specified
          if (campaign.propertyIds.length > 0 && !campaign.propertyIds.includes(tenant.propertyId)) {
            return false;
          }

          // Check if tenant meets campaign criteria
          const today = new Date();
          const dueDate = new Date(today.getFullYear(), today.getMonth(), tenant.dueDate);
          const daysDiff = differenceInDays(dueDate, today);

          if (campaign.scheduleType === 'before_due' && campaign.daysBefore) {
            return daysDiff === campaign.daysBefore;
          } else if (campaign.scheduleType === 'on_due') {
            return daysDiff === 0;
          } else if (campaign.scheduleType === 'after_due' && campaign.daysAfter) {
            return daysDiff === -campaign.daysAfter;
          }

          return false;
        });

        if (eligibleTenants.length > 0) {
          await sendBulkSMS(eligibleTenants.map(t => t.id), campaign.templateId);
        }

        // Update campaign last run and next run
        updateCampaign(campaign.id, {
          lastRun: now,
          nextRun: calculateNextRun(campaign),
        });
      } catch (error) {
        console.error(`Failed to run campaign ${campaign.name}:`, error);
      }
    }
  };

  const getLogsForTenant = (tenantId: string): SMSLog[] => {
    return logs.filter(log => log.tenantId === tenantId);
  };

  const clearAllData = () => {
    setTemplates([]);
    setCampaigns([]);
    setLogs([]);
    setStats({
      totalSent: 0,
      totalFailed: 0,
      totalCost: 0,
      monthlyUsage: 0,
      successRate: 0,
    });
    localStorage.removeItem('propman_sms_templates');
    localStorage.removeItem('propman_sms_campaigns');
    localStorage.removeItem('propman_sms_logs');
    localStorage.removeItem('propman_sms_stats');
    loadDefaultTemplates();
  };

  return (
    <SMSContext.Provider value={{
      templates,
      campaigns,
      logs,
      stats,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      addCampaign,
      updateCampaign,
      deleteCampaign,
      sendBulkSMS,
      sendSingleSMS,
      runCampaigns,
      getLogsForTenant,
      getTemplateVariables,
      previewMessage,
      clearAllData,
    }}>
      {children}
    </SMSContext.Provider>
  );
};