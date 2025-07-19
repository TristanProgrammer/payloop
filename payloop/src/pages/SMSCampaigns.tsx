import React, { useState, useEffect } from 'react';
import { useSMS } from '../contexts/SMSContext';
import { useProperty } from '../contexts/PropertyContext';
import { useNotifications } from '../contexts/NotificationContext';
import { rentReminderScheduler } from '../services/rentReminderScheduler';
import { sendBulkRentReminders, createRentReminderMessage, testSMSConnection } from '../services/africasTalkingService';
import { 
  MessageSquare, 
  Plus, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Eye,
  Send,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';

const SMSCampaigns = () => {
  const { 
    templates, 
    campaigns, 
    logs, 
    stats, 
    addTemplate, 
    updateTemplate, 
    addCampaign, 
    updateCampaign,
    sendBulkSMS,
    runCampaigns,
    getTemplateVariables,
    previewMessage
  } = useSMS();
  const { tenants, properties } = useProperty();
  const { addNotification } = useNotifications();
  
  const [activeTab, setActiveTab] = useState('scheduler');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(true);
  const [schedulerStats, setSchedulerStats] = useState({
    totalSent: 0,
    totalFailed: 0,
    totalCost: 0,
    todaysSent: 0,
    successRate: 0
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'reminder' as 'reminder' | 'overdue' | 'welcome' | 'custom',
    message: '',
  });

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    templateId: '',
    propertyIds: [] as string[],
    scheduleType: 'before_due' as 'before_due' | 'on_due' | 'after_due',
    daysBefore: 3,
    daysAfter: 3,
  });

  // Load scheduler stats and logs
  useEffect(() => {
    const updateStats = () => {
      const stats = rentReminderScheduler.getStats();
      const logs = rentReminderScheduler.getRecentLogs(20);
      setSchedulerStats(stats);
      setRecentLogs(logs);
    };

    updateStats();
    
    // Update stats every 30 seconds
    const interval = setInterval(updateStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const variables = getTemplateVariables().filter(variable => 
      templateForm.message.includes(`{${variable}}`)
    );
    
    addTemplate({
      ...templateForm,
      variables,
      isActive: true,
    });
    
    setTemplateForm({ name: '', type: 'reminder', message: '' });
    setShowTemplateForm(false);
    
    addNotification({
      type: 'success',
      title: 'Template Created',
      message: `SMS template "${templateForm.name}" has been created successfully.`
    });
  };

  const handleCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCampaign({
      ...campaignForm,
      isActive: true,
    });
    
    setCampaignForm({
      name: '',
      templateId: '',
      propertyIds: [],
      scheduleType: 'before_due',
      daysBefore: 3,
      daysAfter: 3,
    });
    setShowCampaignForm(false);
    
    addNotification({
      type: 'success',
      title: 'Campaign Created',
      message: `SMS campaign "${campaignForm.name}" has been created successfully.`
    });
  };

  const handleRunCampaigns = async () => {
    try {
      await runCampaigns();
      addNotification({
        type: 'success',
        title: 'Campaigns Executed',
        message: 'All active campaigns have been executed successfully!'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Campaign Failed',
        message: 'Failed to run campaigns. Please try again.'
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Testing Connection',
        message: 'Testing Africa\'s Talking SMS connection...'
      });
      
      const result = await testSMSConnection();
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Connection Successful',
          message: 'Africa\'s Talking SMS service is working properly!'
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Connection Failed',
          message: result.error || 'Failed to connect to SMS service.'
        });
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Test Failed',
        message: error.message || 'Failed to test SMS connection.'
      });
    }
  };

  const handleManualReminderCheck = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Checking Reminders',
        message: 'Manually checking for rent reminders to send...'
      });
      
      await rentReminderScheduler.triggerManualCheck();
      
      // Update stats after manual check
      const newStats = rentReminderScheduler.getStats();
      const newLogs = rentReminderScheduler.getRecentLogs(20);
      setSchedulerStats(newStats);
      setRecentLogs(newLogs);
      
      addNotification({
        type: 'success',
        title: 'Check Complete',
        message: 'Manual reminder check completed successfully!'
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Check Failed',
        message: error.message || 'Failed to check reminders.'
      });
    }
  };

  const handleSendBulkReminders = async () => {
    if (tenants.length === 0) {
      addNotification({
        type: 'warning',
        title: 'No Tenants',
        message: 'No tenants found to send reminders to.'
      });
      return;
    }

    try {
      addNotification({
        type: 'info',
        title: 'Sending Reminders',
        message: `Sending rent reminders to ${tenants.length} tenants...`
      });

      // Prepare bulk SMS data
      const recipients = tenants.map(tenant => {
        const property = properties.find(p => p.id === tenant.propertyId);
        const message = createRentReminderMessage(
          tenant.name,
          tenant.rentAmount,
          tenant.dueDate,
          property?.name || 'Your Property',
          'due_soon'
        );
        
        return {
          phone: tenant.phone,
          message,
          tenantName: tenant.name
        };
      });

      const result = await sendBulkRentReminders(recipients);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Reminders Sent',
          message: `Successfully sent reminders to ${result.recipients} tenants. Cost: KES ${result.cost?.toFixed(2)}`
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Send Failed',
          message: result.error || 'Failed to send bulk reminders.'
        });
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Send Failed',
        message: error.message || 'Failed to send bulk reminders.'
      });
    }
  };

  const toggleScheduler = () => {
    if (isSchedulerRunning) {
      rentReminderScheduler.stop();
      setIsSchedulerRunning(false);
      addNotification({
        type: 'warning',
        title: 'Scheduler Stopped',
        message: 'Automatic rent reminders have been disabled.'
      });
    } else {
      rentReminderScheduler.start();
      setIsSchedulerRunning(true);
      addNotification({
        type: 'success',
        title: 'Scheduler Started',
        message: 'Automatic rent reminders are now active.'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS Campaigns</h1>
          <p className="text-gray-600">Automated rent reminders with Africa's Talking</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleTestConnection}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center"
          >
            <Settings className="h-5 w-5 mr-2" />
            Test Connection
          </button>
          <button
            onClick={handleSendBulkReminders}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
          >
            <Send className="h-5 w-5 mr-2" />
            Send Bulk Reminders
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Sent</p>
              <p className="text-2xl font-bold text-green-600">{schedulerStats.todaysSent}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Send className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sent</p>
              <p className="text-2xl font-bold text-blue-600">{schedulerStats.totalSent}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-teal-600">{schedulerStats.successRate.toFixed(1)}%</p>
            </div>
            <div className="bg-teal-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold text-orange-600">KES {schedulerStats.totalCost.toFixed(2)}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <MessageSquare className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scheduler</p>
              <p className={`text-2xl font-bold ${isSchedulerRunning ? 'text-green-600' : 'text-red-600'}`}>
                {isSchedulerRunning ? 'Active' : 'Stopped'}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${isSchedulerRunning ? 'bg-green-100' : 'bg-red-100'}`}>
              <Zap className={`h-6 w-6 ${isSchedulerRunning ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'scheduler', name: 'Auto Scheduler', icon: Zap },
              { id: 'campaigns', name: 'Campaigns', icon: Calendar },
              { id: 'templates', name: 'Templates', icon: MessageSquare },
              { id: 'logs', name: 'SMS Logs', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Auto Scheduler Tab */}
          {activeTab === 'scheduler' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Automatic Rent Reminder Scheduler</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={handleManualReminderCheck}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Manual Check
                  </button>
                  <button
                    onClick={toggleScheduler}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                      isSchedulerRunning 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isSchedulerRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {isSchedulerRunning ? 'Stop Scheduler' : 'Start Scheduler'}
                  </button>
                </div>
              </div>

              {/* Scheduler Status */}
              <div className={`p-6 rounded-lg border-2 ${
                isSchedulerRunning 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center mb-4">
                  <Zap className={`h-6 w-6 mr-3 ${
                    isSchedulerRunning ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <h4 className={`text-lg font-medium ${
                    isSchedulerRunning ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Scheduler Status: {isSchedulerRunning ? 'Active' : 'Stopped'}
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">3 Days Before Due</h5>
                    <p className="text-sm text-gray-600">Sends "rent due soon" reminders</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">On Due Date</h5>
                    <p className="text-sm text-gray-600">Sends "rent due today" reminders</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">3 Days After Due</h5>
                    <p className="text-sm text-gray-600">Sends "rent overdue" reminders</p>
                  </div>
                </div>
              </div>

              {/* Recent Scheduler Logs */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Recent Automatic Reminders</h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  {recentLogs.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {recentLogs.slice(0, 10).map((log) => {
                        const tenant = tenants.find(t => t.id === log.tenantId);
                        return (
                          <div key={log.id} className="p-4 hover:bg-white transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`flex items-center ${getStatusColor(log.success ? 'sent' : 'failed')}`}>
                                  {getStatusIcon(log.success ? 'sent' : 'failed')}
                                  <span className="ml-2 text-sm font-medium capitalize">
                                    {log.reminderType.replace('_', ' ')}
                                  </span>
                                </div>
                                <span className="ml-4 text-sm text-gray-900">
                                  {tenant?.name || 'Unknown Tenant'}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-900">
                                  KES {log.cost.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {format(log.sentAt, 'MMM dd, HH:mm')}
                                </p>
                              </div>
                            </div>
                            {log.error && (
                              <p className="text-xs text-red-600 mt-2">{log.error}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No automatic reminders sent yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">SMS Campaigns</h3>
                <button
                  onClick={() => setShowCampaignForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </button>
              </div>

              <div className="grid gap-4">
                {campaigns.map((campaign) => {
                  const template = templates.find(t => t.id === campaign.templateId);
                  return (
                    <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                            <span className={`ml-3 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              campaign.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {campaign.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Template: {template?.name} | 
                            Schedule: {campaign.scheduleType.replace('_', ' ')} 
                            {campaign.daysBefore && ` (${campaign.daysBefore} days before)`}
                            {campaign.daysAfter && ` (${campaign.daysAfter} days after)`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Next run: {campaign.nextRun ? format(campaign.nextRun, 'MMM dd, yyyy HH:mm') : 'Not scheduled'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCampaign(campaign.id, { isActive: !campaign.isActive })}
                            className={`p-2 rounded-lg ${
                              campaign.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {campaign.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">SMS Templates</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowPreview(true)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </button>
                  <button
                    onClick={() => setShowTemplateForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <span className={`ml-3 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            template.type === 'reminder' ? 'bg-blue-100 text-blue-800' :
                            template.type === 'overdue' ? 'bg-red-100 text-red-800' :
                            template.type === 'welcome' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {template.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{template.message}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.variables.map((variable) => (
                            <span key={variable} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                              {`{${variable}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateTemplate(template.id, { isActive: !template.isActive })}
                          className={`p-2 rounded-lg ${
                            template.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {template.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SMS Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">SMS Activity Logs</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sent At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[...logs, ...recentLogs.map(log => ({
                      id: log.id,
                      tenantId: log.tenantId,
                      templateId: log.reminderType,
                      message: `${log.reminderType.replace('_', ' ')} reminder`,
                      status: log.success ? 'sent' : 'failed',
                      sentAt: log.sentAt,
                      cost: log.cost,
                      error: log.error
                    }))].slice(0, 20).map((log) => {
                      const tenant = tenants.find(t => t.id === log.tenantId);
                      return (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {tenant?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {tenant?.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 capitalize">
                              {log.templateId?.replace('_', ' ') || 'Custom'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center ${getStatusColor(log.status)}`}>
                              {getStatusIcon(log.status)}
                              <span className="ml-2 text-sm font-medium capitalize">
                                {log.status}
                              </span>
                            </div>
                            {log.error && (
                              <div className="text-xs text-red-600 mt-1">{log.error}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(log.sentAt, 'MMM dd, yyyy HH:mm')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            KES {log.cost.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Form Modal */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create SMS Template</h2>
            <form onSubmit={handleTemplateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Rent Reminder - 3 Days Before"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Type
                </label>
                <select
                  value={templateForm.type}
                  onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="reminder">Reminder</option>
                  <option value="overdue">Overdue</option>
                  <option value="welcome">Welcome</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Template
                </label>
                <textarea
                  value={templateForm.message}
                  onChange={(e) => setTemplateForm({ ...templateForm, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Hi {tenantName}, your rent of KES {amount} for {propertyName} is due on {dueDate}..."
                  required
                />
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Available variables:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getTemplateVariables().map((variable) => (
                      <span key={variable} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {`{${variable}}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowTemplateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Form Modal */}
      {showCampaignForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create SMS Campaign</h2>
            <form onSubmit={handleCampaignSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Monthly Rent Reminder"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMS Template
                </label>
                <select
                  value={campaignForm.templateId}
                  onChange={(e) => setCampaignForm({ ...campaignForm, templateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Type
                </label>
                <select
                  value={campaignForm.scheduleType}
                  onChange={(e) => setCampaignForm({ ...campaignForm, scheduleType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="before_due">Before Due Date</option>
                  <option value="on_due">On Due Date</option>
                  <option value="after_due">After Due Date</option>
                </select>
              </div>
              
              {campaignForm.scheduleType === 'before_due' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days Before Due Date
                  </label>
                  <input
                    type="number"
                    value={campaignForm.daysBefore}
                    onChange={(e) => setCampaignForm({ ...campaignForm, daysBefore: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="30"
                  />
                </div>
              )}
              
              {campaignForm.scheduleType === 'after_due' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days After Due Date
                  </label>
                  <input
                    type="number"
                    value={campaignForm.daysAfter}
                    onChange={(e) => setCampaignForm({ ...campaignForm, daysAfter: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="30"
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCampaignForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl mx-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview SMS Template</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Tenant (for preview)
                </label>
                <select
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose tenant...</option>
                  {tenants.map((tenant) => {
                    const property = properties.find(p => p.id === tenant.propertyId);
                    return (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} - {property?.name} Unit {tenant.unitNumber}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              {selectedTemplate && selectedTenant && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview Message
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-900">
                      {previewMessage(selectedTemplate, selectedTenant)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setSelectedTemplate('');
                  setSelectedTenant('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSCampaigns;