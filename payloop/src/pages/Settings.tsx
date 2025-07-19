import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProperty } from '../contexts/PropertyContext';
import { useSMS } from '../contexts/SMSContext';
import { usePayment } from '../contexts/PaymentContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import { 
  User, 
  Bell, 
  CreditCard, 
  Shield, 
  Phone,
  Mail,
  Building2,
  Save,
  Check,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Ban
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { clearAllData: clearPropertyData } = useProperty();
  const { clearAllData: clearSMSData } = useSMS();
  const { getUserPaymentStatus, hasActiveSubscription } = usePayment();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    businessName: user?.businessName || '',
    ownerName: user?.ownerName || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const userPaymentStatus = user ? getUserPaymentStatus(user.id) : null;
  const userHasActiveSubscription = user ? hasActiveSubscription(user.id) : false;

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'subscription', name: 'Subscription', icon: CreditCard },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSave = () => {
    try {
      updateUser(profileData);
      addNotification({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile information has been updated successfully.'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update profile. Please try again.'
      });
    }
  };

  const handlePasswordSave = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Password Mismatch',
        message: 'New password and confirmation do not match.'
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      addNotification({
        type: 'error',
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters long.'
      });
      return;
    }

    // Simulate password change
    addNotification({
      type: 'success',
      title: 'Password Changed',
      message: 'Your password has been updated successfully.'
    });

    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowPasswordForm(false);
  };

  const handleInactivateSubscription = () => {
    if (window.confirm('Are you sure you want to inactivate your subscription? This will disable access to premium features.')) {
      updateUser({
        subscriptionStatus: 'suspended'
      });
      addNotification({
        type: 'warning',
        title: 'Subscription Inactivated',
        message: 'Your subscription has been manually inactivated. Contact support to reactivate.'
      });
    }
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      clearPropertyData();
      clearSMSData();
      addNotification({
        type: 'success',
        title: 'Data Cleared',
        message: 'All data has been cleared successfully!'
      });
    }
  };

  const getTrialDaysRemaining = () => {
    if (!user?.trialEndsAt) return 0;
    const now = new Date();
    const trialEnd = new Date(user.trialEndsAt);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getSubscriptionExpiryDate = () => {
    if (user?.subscriptionEndsAt) {
      return new Date(user.subscriptionEndsAt);
    }
    if (user?.trialEndsAt && user?.subscriptionPlan === 'trial') {
      return new Date(user.trialEndsAt);
    }
    return null;
  };

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
    
    return user.subscriptionStatus === 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getDaysUntilExpiry = () => {
    const expiryDate = getSubscriptionExpiryDate();
    if (!expiryDate) return 0;
    
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
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
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={profileData.businessName}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      name="ownerName"
                      value={profileData.ownerName}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={handleProfileSave}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Data Management */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <h4 className="text-sm font-medium text-red-800">Clear All Data</h4>
                  </div>
                  <p className="text-sm text-red-600 mb-4">
                    This will permanently delete all your properties, tenants, and SMS data. This action cannot be undone.
                  </p>
                  <button
                    onClick={handleClearAllData}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Subscription</h3>
                
                {/* Current Plan Status */}
                <div className={`p-6 rounded-lg border-2 mb-6 ${
                  isSubscriptionActive() ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${
                        isSubscriptionActive() ? 'bg-green-100' : 'bg-orange-100'
                      }`}>
                        <CreditCard className={`h-5 w-5 ${
                          isSubscriptionActive() ? 'text-green-600' : 'text-orange-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className={`text-lg font-medium ${
                          isSubscriptionActive() ? 'text-green-800' : 'text-orange-800'
                        }`}>
                          {user?.subscriptionPlan?.charAt(0).toUpperCase() + user?.subscriptionPlan?.slice(1)} Plan
                        </h4>
                        <p className={`text-sm ${
                          isSubscriptionActive() ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          Status: {isSubscriptionActive() ? 'Active' : 'Inactive'}
                        </p>
                        {getSubscriptionExpiryDate() && (
                          <p className="text-sm text-gray-600">
                            {user?.subscriptionPlan === 'trial' ? 'Trial expires' : 'Subscription expires'}: {' '}
                            {format(getSubscriptionExpiryDate()!, 'MMM dd, yyyy')}
                            {isSubscriptionActive() && (
                              <span className="ml-2 font-medium">
                                ({getDaysUntilExpiry()} days remaining)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!isSubscriptionActive() && (
                        <Link
                          to="/subscription"
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                        >
                          Upgrade Now
                        </Link>
                      )}
                      {isSubscriptionActive() && user?.subscriptionStatus === 'active' && user?.subscriptionPlan !== 'trial' && (
                        <button
                          onClick={handleInactivateSubscription}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Inactivate
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                {userPaymentStatus && (
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Recent Payment Status</h4>
                    <div className={`p-4 rounded-lg border ${
                      userPaymentStatus.status === 'approved' ? 'bg-green-50 border-green-200' :
                      userPaymentStatus.status === 'rejected' ? 'bg-red-50 border-red-200' :
                      'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center">
                        {getStatusIcon(userPaymentStatus.status)}
                        <div className="ml-3">
                          <h5 className={`font-medium ${getStatusColor(userPaymentStatus.status)}`}>
                            Payment {userPaymentStatus.status.charAt(0).toUpperCase() + userPaymentStatus.status.slice(1)}
                          </h5>
                          <p className="text-sm text-gray-600">
                            Plan: {userPaymentStatus.planSelected.charAt(0).toUpperCase() + userPaymentStatus.planSelected.slice(1)} • 
                            Transaction: {userPaymentStatus.transactionCode} • 
                            Submitted: {format(userPaymentStatus.timestamp, 'MMM dd, yyyy HH:mm')}
                          </p>
                          {userPaymentStatus.adminNotes && (
                            <p className="text-sm text-gray-700 mt-1">
                              <strong>Note:</strong> {userPaymentStatus.adminNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subscription Actions */}
                <div className="space-y-4">
                  <Link
                    to="/subscription"
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors block text-center"
                  >
                    {isSubscriptionActive() ? 'Upgrade/Change Plan' : 'Subscribe Now'}
                  </Link>
                  
                  {userPaymentStatus?.status === 'rejected' && (
                    <Link
                      to="/subscription"
                      className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-colors block text-center"
                    >
                      Submit New Payment Confirmation
                    </Link>
                  )}
                </div>

                {/* Plan Features */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Current Plan Features</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {user?.subscriptionPlan === 'starter' && (
                      <>
                        <li>• 1 Property</li>
                        <li>• Up to 10 Tenants</li>
                        <li>• SMS Reminders</li>
                        <li>• Basic Reports</li>
                      </>
                    )}
                    {user?.subscriptionPlan === 'growth' && (
                      <>
                        <li>• Up to 5 Properties</li>
                        <li>• Up to 50 Tenants</li>
                        <li>• SMS Reminders</li>
                        <li>• Advanced Reports</li>
                        <li>• M-Pesa Integration</li>
                      </>
                    )}
                    {user?.subscriptionPlan === 'enterprise' && (
                      <>
                        <li>• Unlimited Properties</li>
                        <li>• Unlimited Tenants</li>
                        <li>• SMS Reminders</li>
                        <li>• Advanced Analytics</li>
                        <li>• Priority Support</li>
                      </>
                    )}
                    {user?.subscriptionPlan === 'trial' && (
                      <>
                        <li>• 2 Properties (Trial)</li>
                        <li>• Unlimited Tenants</li>
                        <li>• SMS Reminders</li>
                        <li>• All Features</li>
                        <li>• 7-Day Trial Period</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">SMS Notifications</p>
                        <p className="text-sm text-gray-500">Receive SMS alerts for important updates</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive email updates and reports</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Payment Reminders</p>
                        <p className="text-sm text-gray-500">Automatic reminders for overdue payments</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Add an extra layer of security with SMS-based verification
                    </p>
                    <button 
                      onClick={() => {
                        addNotification({
                          type: 'info',
                          title: '2FA Setup',
                          message: 'Two-factor authentication setup will be available soon.'
                        });
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Enable 2FA
                    </button>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Change Password</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Update your password regularly for better security
                    </p>
                    {!showPasswordForm ? (
                      <button 
                        onClick={() => setShowPasswordForm(true)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Change Password
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? 'text' : 'password'}
                              name="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={handlePasswordSave}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                          >
                            Update Password
                          </button>
                          <button
                            onClick={() => {
                              setShowPasswordForm(false);
                              setPasswordData({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: '',
                              });
                            }}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Login History</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Review your recent login activity
                    </p>
                    <button 
                      onClick={() => {
                        addNotification({
                          type: 'info',
                          title: 'Login History',
                          message: 'Login history feature will be available soon.'
                        });
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      View History
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;