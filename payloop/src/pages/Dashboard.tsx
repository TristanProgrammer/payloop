import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProperty } from '../contexts/PropertyContext';
import { usePayment } from '../contexts/PaymentContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  Plus,
  ArrowRight,
  Calendar,
  Phone,
  BookOpen,
  CheckCircle,
  Clock,
  DollarSign,
  XCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    properties, 
    tenants, 
    getTotalProperties, 
    getTotalUnits, 
    getTotalRevenue, 
    getTotalOutstanding,
    getVacancyRate,
    selectedPropertyId,
    getTenantsForProperty,
    getDefaulterTenants,
    getRecentTenants,
    getRecentPayments
  } = useProperty();
  const { getUserPaymentStatus, hasActiveSubscription } = usePayment();
  const { addNotification } = useNotifications();

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const propertyTenants = selectedPropertyId ? getTenantsForProperty(selectedPropertyId) : tenants;
  const defaulterTenants = getDefaulterTenants();
  const recentTenants = getRecentTenants(5);
  const recentPayments = getRecentPayments(5);
  const userPaymentStatus = user ? getUserPaymentStatus(user.id) : null;
  const userHasActiveSubscription = user ? hasActiveSubscription(user.id) : false;

  // Check subscription status
  const isSubscriptionActive = () => {
    if (!user) return false;
    
    if (user.subscriptionPlan === 'trial') {
      const trialEnd = new Date(user.trialEndsAt);
      return trialEnd > new Date();
    }
    
    if (user.subscriptionEndsAt) {
      const subscriptionEnd = new Date(user.subscriptionEndsAt);
      return subscriptionEnd > new Date() && user.subscriptionStatus === 'active';
    }
    
    return user.subscriptionStatus === 'active' && userHasActiveSubscription;
  };

  const getSubscriptionMessage = () => {
    if (!user) return '';
    
    if (userPaymentStatus?.status === 'pending') {
      return 'Payment confirmation pending verification. We will activate your account shortly.';
    }
    
    if (userPaymentStatus?.status === 'rejected') {
      return 'Your payment was rejected. Please contact support or submit a new payment confirmation.';
    }
    
    if (user.subscriptionPlan === 'trial') {
      const trialEnd = new Date(user.trialEndsAt);
      const daysLeft = differenceInDays(trialEnd, new Date());
      if (daysLeft <= 0) {
        return 'Your trial has expired. Please upgrade to continue using all features.';
      }
    }
    
    if (user.subscriptionEndsAt) {
      const subscriptionEnd = new Date(user.subscriptionEndsAt);
      const daysLeft = differenceInDays(subscriptionEnd, new Date());
      if (daysLeft <= 0) {
        return 'Your subscription has expired. Please renew to continue using all features.';
      }
    }
    
    if (user.subscriptionStatus !== 'active') {
      return 'Your subscription is inactive. Please pay and confirm to continue.';
    }
    
    return '';
  };

  const stats = [
    {
      name: 'Total Properties',
      value: getTotalProperties(),
      icon: Building2,
      color: 'bg-blue-500',
      change: getTotalProperties() > 0 ? '+12%' : '0%',
      changeType: 'positive'
    },
    {
      name: 'Total Units',
      value: getTotalUnits(),
      icon: Users,
      color: 'bg-teal-500',
      change: getTotalUnits() > 0 ? '+8%' : '0%',
      changeType: 'positive'
    },
    {
      name: 'Monthly Revenue',
      value: `KES ${getTotalRevenue().toLocaleString()}`,
      icon: CreditCard,
      color: 'bg-green-500',
      change: getTotalRevenue() > 0 ? '+15%' : '0%',
      changeType: 'positive'
    },
    {
      name: 'Outstanding',
      value: `KES ${getTotalOutstanding().toLocaleString()}`,
      icon: AlertCircle,
      color: 'bg-red-500',
      change: getTotalOutstanding() > 0 ? '-5%' : '0%',
      changeType: 'negative'
    }
  ];

  const getTrialDaysRemaining = () => {
    if (!user?.trialEndsAt) return 0;
    const now = new Date();
    const trialEnd = new Date(user.trialEndsAt);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getSubscriptionDaysRemaining = () => {
    if (!user?.subscriptionEndsAt) return 0;
    const now = new Date();
    const subscriptionEnd = new Date(user.subscriptionEndsAt);
    const diffTime = subscriptionEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const trialDaysRemaining = getTrialDaysRemaining();
  const subscriptionDaysRemaining = getSubscriptionDaysRemaining();

  // Show getting started guide if no real data
  const hasRealData = properties.some(p => !p.id.startsWith('sample-')) || 
                     tenants.some(t => !t.id.startsWith('sample-'));

  // Calculate overdue tenants with days
  const overdueTenantsWithDays = defaulterTenants.map(tenant => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const dueDate = new Date(currentYear, currentMonth, tenant.dueDate);
    
    // If due date hasn't passed this month, check previous month
    if (dueDate > today) {
      dueDate.setMonth(dueDate.getMonth() - 1);
    }
    
    const daysOverdue = differenceInDays(today, dueDate);
    return { ...tenant, daysOverdue: Math.max(0, daysOverdue) };
  });

  const subscriptionMessage = getSubscriptionMessage();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.ownerName}!</h1>
            <p className="text-blue-100 mt-1">
              {hasRealData 
                ? "Here's what's happening with your properties today"
                : "Let's get you started with your property management"
              }
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Today</p>
            <p className="text-xl font-semibold">{format(new Date(), 'MMM dd, yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Subscription Status Alert */}
      {subscriptionMessage && (
        <div className={`p-4 rounded-lg border-2 ${
          userPaymentStatus?.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
          userPaymentStatus?.status === 'rejected' ? 'bg-red-50 border-red-200' :
          'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center">
            {userPaymentStatus?.status === 'pending' ? (
              <Clock className="h-5 w-5 text-yellow-600 mr-3" />
            ) : userPaymentStatus?.status === 'rejected' ? (
              <XCircle className="h-5 w-5 text-red-600 mr-3" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                userPaymentStatus?.status === 'pending' ? 'text-yellow-800' :
                userPaymentStatus?.status === 'rejected' ? 'text-red-800' :
                'text-orange-800'
              }`}>
                {subscriptionMessage}
              </p>
              {userPaymentStatus?.adminNotes && (
                <p className="text-xs text-gray-600 mt-1">
                  <strong>Note:</strong> {userPaymentStatus.adminNotes}
                </p>
              )}
            </div>
            {!isSubscriptionActive() && userPaymentStatus?.status !== 'pending' && (
              <Link
                to="/subscription"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Upgrade Now
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Getting Started Guide */}
      {!hasRealData && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center mb-4">
            <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Getting Started Guide</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Welcome to PropMan Kenya! We've added some sample data to help you understand how the system works. 
            Follow these steps to get started:
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start p-4 bg-blue-50 rounded-lg">
              <div className="bg-blue-100 p-2 rounded-lg mr-3 mt-1">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">1. Add Your Properties</h3>
                <p className="text-sm text-gray-600">Start by adding your real properties to the system</p>
              </div>
            </div>
            
            <div className="flex items-start p-4 bg-teal-50 rounded-lg">
              <div className="bg-teal-100 p-2 rounded-lg mr-3 mt-1">
                <Users className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">2. Add Your Tenants</h3>
                <p className="text-sm text-gray-600">Register your tenants with their contact details</p>
              </div>
            </div>
            
            <div className="flex items-start p-4 bg-green-50 rounded-lg">
              <div className="bg-green-100 p-2 rounded-lg mr-3 mt-1">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">3. Set Up SMS</h3>
                <p className="text-sm text-gray-600">Configure automated rent reminders</p>
              </div>
            </div>
            
            <div className="flex items-start p-4 bg-purple-50 rounded-lg">
              <div className="bg-purple-100 p-2 rounded-lg mr-3 mt-1">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">4. You're Ready!</h3>
                <p className="text-sm text-gray-600">Start managing your properties efficiently</p>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-700">
              <strong>Note:</strong> The sample data (marked with "Sample" labels) can be deleted once you've added your own properties and tenants.
            </p>
          </div>
        </div>
      )}

      {/* Trial/Subscription Status */}
      {user?.subscriptionPlan === 'trial' && trialDaysRemaining > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-orange-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                Free trial expires in {trialDaysRemaining} days
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Upgrade to continue using all features
              </p>
            </div>
          </div>
          <Link
            to="/subscription"
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
          >
            Upgrade Plan
          </Link>
        </div>
      )}

      {/* Active Subscription Status */}
      {user?.subscriptionPlan !== 'trial' && subscriptionDaysRemaining > 0 && subscriptionDaysRemaining <= 7 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Your {user.subscriptionPlan} subscription expires in {subscriptionDaysRemaining} days
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Renew now to avoid service interruption
              </p>
            </div>
          </div>
          <Link
            to="/subscription"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Renew Now
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.name}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/properties"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <Building2 className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Add Property</p>
              <p className="text-sm text-gray-500">Create new property</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-blue-600" />
          </Link>
          
          <Link
            to="/tenants"
            className="flex items-center p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors group"
          >
            <Users className="h-8 w-8 text-teal-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Add Tenant</p>
              <p className="text-sm text-gray-500">Register new tenant</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-teal-600" />
          </Link>
          
          <Link
            to="/payments"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
          >
            <CreditCard className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Record Payment</p>
              <p className="text-sm text-gray-500">Update payment status</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-green-600" />
          </Link>
          
          <Link
            to="/sms-campaigns"
            className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors group"
          >
            <Phone className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Send SMS</p>
              <p className="text-sm text-gray-500">Bulk reminders</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-orange-600" />
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Tenants */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Tenants</h2>
              <Link
                to="/tenants"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentTenants.length > 0 ? (
              <div className="space-y-4">
                {recentTenants.map((tenant) => {
                  const property = properties.find(p => p.id === tenant.propertyId);
                  return (
                    <div key={tenant.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {tenant.name}
                            {tenant.id.startsWith('sample-') && (
                              <span className="ml-2 text-xs text-orange-600">(Sample)</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {property?.name} - Unit {tenant.unitNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          KES {tenant.rentAmount.toLocaleString()}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                          tenant.status === 'defaulter' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {tenant.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No tenants yet</p>
                <Link
                  to="/tenants"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first tenant
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Payment Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Payment Alerts</h2>
              <Link
                to="/payments"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {overdueTenantsWithDays.length > 0 ? (
              <div className="space-y-4">
                {overdueTenantsWithDays.slice(0, 5).map((tenant) => {
                  const property = properties.find(p => p.id === tenant.propertyId);
                  return (
                    <div key={tenant.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tenant.name}
                            {tenant.id.startsWith('sample-') && (
                              <span className="ml-2 text-xs text-orange-600">(Sample)</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {property?.name} - Unit {tenant.unitNumber}
                          </p>
                          <p className="text-xs text-red-600">
                            {tenant.daysOverdue} days overdue
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">
                          KES {tenant.outstandingAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-red-500">overdue</p>
                      </div>
                    </div>
                  );
                })}
                <Link
                  to="/sms-campaigns"
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors block text-center"
                >
                  Send Payment Reminders
                </Link>
              </div>
            ) : recentPayments.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Payments</h3>
                {recentPayments.map((payment) => {
                  const tenant = tenants.find(t => t.id === payment.tenantId);
                  const property = properties.find(p => p.id === tenant?.propertyId);
                  return (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {tenant?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {property?.name} - {format(payment.paymentDate, 'MMM dd')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          +KES {payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-500">paid</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">All payments up to date</p>
                <p className="text-sm text-gray-400">Great job managing your properties!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;