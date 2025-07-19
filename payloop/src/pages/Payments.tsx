import React, { useState } from 'react';
import { useProperty } from '../contexts/PropertyContext';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Download,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

const Payments = () => {
  const { properties, tenants, payments, updateTenant, addPayment } = useProperty();
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'bank' | 'cash'>('mpesa');
  const [paymentReference, setPaymentReference] = useState('');

  // Create payment data from tenants
  const paymentData = tenants.map(tenant => {
    const property = properties.find(p => p.id === tenant.propertyId);
    const tenantPayments = payments.filter(p => p.tenantId === tenant.id);
    const lastPayment = tenantPayments.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())[0];
    
    return {
      id: tenant.id,
      tenant,
      property,
      amount: tenant.rentAmount,
      dueDate: new Date(2024, 0, tenant.dueDate), // January 2024
      status: tenant.status === 'defaulter' ? 'overdue' : 
              tenant.status === 'active' ? 'paid' : 'pending',
      paidDate: lastPayment?.paymentDate || tenant.lastPaymentDate,
      outstandingAmount: tenant.outstandingAmount,
      lastPayment
    };
  });

  const filteredPayments = paymentData.filter(payment => {
    const matchesSearch = payment.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.property?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRecordPayment = async () => {
    if (!selectedTenant || !paymentAmount) {
      addNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please select a tenant and enter payment amount.'
      });
      return;
    }

    const tenant = tenants.find(t => t.id === selectedTenant);
    if (!tenant) return;

    const amount = parseFloat(paymentAmount);
    
    try {
      // Add payment record
      addPayment({
        tenantId: selectedTenant,
        amount,
        paymentDate: new Date(),
        method: paymentMethod,
        reference: paymentReference,
        status: 'paid'
      });

      // Update tenant status
      const newOutstanding = Math.max(0, tenant.outstandingAmount - amount);
      updateTenant(selectedTenant, {
        lastPaymentDate: new Date(),
        outstandingAmount: newOutstanding,
        status: newOutstanding === 0 ? 'active' : tenant.status
      });

      addNotification({
        type: 'success',
        title: 'Payment Recorded',
        message: `Payment of KES ${amount.toLocaleString()} recorded for ${tenant.name}.`
      });

      // Reset form
      setShowRecordForm(false);
      setSelectedTenant('');
      setPaymentAmount('');
      setPaymentReference('');
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to record payment.'
      });
    }
  };

  const handleSendReminder = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    // Simulate SMS sending
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addNotification({
        type: 'success',
        title: 'Reminder Sent',
        message: `Payment reminder sent to ${tenant.name} via SMS.`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to Send',
        message: 'Could not send SMS reminder. Please try again.'
      });
    }
  };

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      ['Tenant', 'Property', 'Unit', 'Amount', 'Status', 'Due Date', 'Outstanding'],
      ...filteredPayments.map(payment => [
        payment.tenant.name,
        payment.property?.name || '',
        payment.tenant.unitNumber,
        payment.amount,
        payment.status,
        payment.dueDate.toLocaleDateString(),
        payment.outstandingAmount
      ])
    ].map(row => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    addNotification({
      type: 'success',
      title: 'Export Complete',
      message: 'Payment data has been exported to CSV.'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'overdue':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const totalRevenue = paymentData.reduce((sum, payment) => 
    payment.status === 'paid' ? sum + payment.amount : sum, 0
  );
  
  const totalOutstanding = paymentData.reduce((sum, payment) => 
    payment.status === 'overdue' ? sum + payment.outstandingAmount : sum, 0
  );

  const collectionRate = paymentData.length > 0 ? 
    (paymentData.filter(p => p.status === 'paid').length / paymentData.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Track and manage rent payments</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => {
              const overdueTenantsIds = paymentData
                .filter(p => p.status === 'overdue')
                .map(p => p.tenant.id);
              
              if (overdueTenantsIds.length === 0) {
                addNotification({
                  type: 'info',
                  title: 'No Overdue Payments',
                  message: 'All tenants are up to date with their payments.'
                });
                return;
              }

              // Send reminders to all overdue tenants
              overdueTenantsIds.forEach(id => handleSendReminder(id));
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
          >
            <Phone className="h-5 w-5 mr-2" />
            Send Reminders
          </button>
          <button
            onClick={() => setShowRecordForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Collected</p>
              <p className="text-2xl font-bold text-green-600">
                KES {totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                KES {totalOutstanding.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {collectionRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {paymentData.filter(p => p.status === 'pending').length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
            <button 
              onClick={handleExport}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Record Payment Form */}
      {showRecordForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Tenant
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (KES)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="30000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference (Optional)
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Transaction ID"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 mt-4">
            <button
              onClick={() => setShowRecordForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRecordPayment}
              disabled={!selectedTenant || !paymentAmount}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Record Payment
            </button>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.tenant.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Unit {payment.tenant.unitNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payment.property?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.property?.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      KES {payment.amount.toLocaleString()}
                    </div>
                    {payment.outstandingAmount > 0 && (
                      <div className="text-sm text-red-600">
                        Outstanding: KES {payment.outstandingAmount.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payment.dueDate.toLocaleDateString()}
                    </div>
                    {payment.paidDate && (
                      <div className="text-sm text-gray-500">
                        Paid: {payment.paidDate.toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1 capitalize">{payment.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {payment.status !== 'paid' && (
                        <button
                          onClick={() => {
                            setSelectedTenant(payment.tenant.id);
                            setPaymentAmount(payment.amount.toString());
                            setShowRecordForm(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button 
                        onClick={() => handleSendReminder(payment.tenant.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Send Reminder
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;