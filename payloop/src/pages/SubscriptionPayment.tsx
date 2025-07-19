import React, { useState } from 'react';
import { usePayment } from '../contexts/PaymentContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  CreditCard, 
  Check, 
  Smartphone, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  Play
} from 'lucide-react';

const SubscriptionPayment = () => {
  const { user } = useAuth();
  const { submitPaymentConfirmation, getUserPaymentStatus, canSubmitNewPayment, hasActiveSubscription } = usePayment();
  const { addNotification } = useNotifications();
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'growth' | 'enterprise'>('starter');
  const [showConfirmationForm, setShowConfirmationForm] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.ownerName || '',
    phone: user?.phone || '',
    transactionCode: '',
  });

  const userPaymentStatus = user ? getUserPaymentStatus(user.id) : null;
  const userCanSubmitPayment = user ? canSubmitNewPayment(user.id) : false;
  const userHasActiveSubscription = user ? hasActiveSubscription(user.id) : false;

  const plans = [
    {
      id: 'starter' as const,
      name: 'Starter',
      price: 'KES 500',
      period: 'per month',
      features: [
        '1 Property',
        'Up to 10 Tenants',
        'SMS Reminders',
        'Basic Reports',
        'Email Support'
      ],
      popular: false,
    },
    {
      id: 'growth' as const,
      name: 'Growth',
      price: 'KES 1,000',
      period: 'per month',
      features: [
        'Up to 5 Properties',
        'Up to 50 Tenants',
        'SMS Reminders',
        'Advanced Reports',
        'M-Pesa Integration',
        'Priority Support'
      ],
      popular: true,
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise',
      price: 'KES 2,500',
      period: 'per month',
      features: [
        'Unlimited Properties',
        'Unlimited Tenants',
        'SMS Reminders',
        'Advanced Analytics',
        'M-Pesa Integration',
        'WhatsApp Support',
        'Custom Features'
      ],
      popular: false,
    },
  ];

  const handlePlanSelect = (planId: 'starter' | 'growth' | 'enterprise') => {
    if (!userCanSubmitPayment) {
      if (userHasActiveSubscription) {
        addNotification({
          type: 'warning',
          title: 'Active Subscription',
          message: 'You already have an active subscription. You can upgrade or change plans after your current subscription expires.'
        });
      } else {
        addNotification({
          type: 'warning',
          title: 'Payment Pending',
          message: 'You have a pending payment confirmation. Please wait for verification or contact support.'
        });
      }
      return;
    }

    setSelectedPlan(planId);
    setShowConfirmationForm(true);
  };

  const handleSubmitConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.phone || !formData.transactionCode) {
      addNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please fill in all required fields.'
      });
      return;
    }

    try {
      submitPaymentConfirmation({
        fullName: formData.fullName,
        phone: formData.phone,
        planSelected: selectedPlan,
        transactionCode: formData.transactionCode,
      });

      addNotification({
        type: 'success',
        title: 'Payment Confirmation Received',
        message: 'Your payment confirmation was received. We will verify and activate your account shortly.'
      });

      setShowConfirmationForm(false);
      setFormData({
        fullName: user?.ownerName || '',
        phone: user?.phone || '',
        transactionCode: '',
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error.message || 'Failed to submit payment confirmation.'
      });
    }
  };

  const handleWatchDemo = () => {
    setShowDemoModal(true);
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Subscription Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Select the plan that best fits your property management needs. Pay via M-Pesa and confirm your payment below.
          </p>
          <button
            onClick={handleWatchDemo}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors inline-flex items-center"
          >
            <Play className="h-5 w-5 mr-2" />
            Watch Demo
          </button>
        </div>

        {/* Active Subscription Warning */}
        {userHasActiveSubscription && (
          <div className="mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-blue-800">
                    You have an active subscription
                  </h3>
                  <p className="text-sm text-blue-600 mt-1">
                    Your current {user?.subscriptionPlan} plan is active. You can upgrade or change plans after your current subscription expires.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Status */}
        {userPaymentStatus && (
          <div className="mb-8">
            <div className={`p-6 rounded-lg border-2 ${
              userPaymentStatus.status === 'approved' ? 'bg-green-50 border-green-200' :
              userPaymentStatus.status === 'rejected' ? 'bg-red-50 border-red-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center">
                {getStatusIcon(userPaymentStatus.status)}
                <div className="ml-3">
                  <h3 className={`text-lg font-medium ${getStatusColor(userPaymentStatus.status)}`}>
                    Payment Status: {userPaymentStatus.status.charAt(0).toUpperCase() + userPaymentStatus.status.slice(1)}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Plan: {userPaymentStatus.planSelected.charAt(0).toUpperCase() + userPaymentStatus.planSelected.slice(1)} • 
                    Submitted: {userPaymentStatus.timestamp.toLocaleDateString('en-KE', { 
                      timeZone: 'Africa/Nairobi',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {userPaymentStatus.adminNotes && (
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Note:</strong> {userPaymentStatus.adminNotes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* M-Pesa Payment Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <Smartphone className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-blue-900">M-Pesa Payment Instructions</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Step 1: Send Money</h3>
              <p className="text-blue-700 mb-2">Send your subscription payment to:</p>
              <div className="bg-white rounded p-3 border border-blue-200">
                <p className="text-lg font-bold text-blue-900">0705441549</p>
                <p className="text-sm text-blue-600">M-Pesa Number</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">Step 2: Confirm Payment</h3>
              <p className="text-blue-700 mb-2">After payment, use the form below to confirm with your M-Pesa transaction code.</p>
              <div className="bg-white rounded p-3 border border-blue-200">
                <p className="text-sm text-blue-600">We'll verify and activate your account within 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-white rounded-xl shadow-lg p-8 relative ${
              plan.popular ? 'border-2 border-blue-600' : 'border border-gray-200'
            }`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handlePlanSelect(plan.id)}
                disabled={!userCanSubmitPayment}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  !userCanSubmitPayment 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {!userCanSubmitPayment 
                  ? (userHasActiveSubscription ? 'Already Subscribed' : 'Payment Pending')
                  : `Select ${plan.name}`
                }
              </button>
            </div>
          ))}
        </div>

        {/* Payment Confirmation Form */}
        {showConfirmationForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Payment for {plans.find(p => p.id === selectedPlan)?.name} Plan
              </h2>
              
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Amount:</strong> {plans.find(p => p.id === selectedPlan)?.price}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Send to:</strong> 0705441549
                </p>
              </div>

              <form onSubmit={handleSubmitConfirmation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+254712345678"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    M-Pesa Transaction Code
                  </label>
                  <input
                    type="text"
                    value={formData.transactionCode}
                    onChange={(e) => setFormData({ ...formData, transactionCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., QGH7X8Y9Z0"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the transaction code from your M-Pesa confirmation SMS
                  </p>
                </div>
                
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowConfirmationForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Confirm Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Demo Modal */}
        {showDemoModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">PropMan Kenya Demo</h2>
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Demo video would be embedded here</p>
                    <p className="text-sm text-gray-500 mt-2">
                      This would show the platform features, SMS automation, and property management capabilities
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Key Features Demonstrated:</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Property and tenant management</li>
                      <li>• Automated SMS rent reminders</li>
                      <li>• Payment tracking and reporting</li>
                      <li>• Dashboard analytics</li>
                      <li>• M-Pesa integration</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Benefits:</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Save time on manual reminders</li>
                      <li>• Improve rent collection rates</li>
                      <li>• Professional tenant communication</li>
                      <li>• Real-time property insights</li>
                      <li>• Reduce administrative overhead</li>
                    </ul>
                  </div>
                </div>
                
                <div className="text-center">
                  <button
                    onClick={() => {
                      setShowDemoModal(false);
                      if (userCanSubmitPayment) {
                        setSelectedPlan('growth');
                        setShowConfirmationForm(true);
                      }
                    }}
                    disabled={!userCanSubmitPayment}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      userCanSubmitPayment
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {userCanSubmitPayment ? 'Start Free Trial' : 'Already Subscribed'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPayment;