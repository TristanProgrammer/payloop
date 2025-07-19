import React, { useState } from 'react';
import { usePayment } from '../contexts/PaymentContext';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  Shield, 
  Eye, 
  Check, 
  X, 
  Clock,
  User,
  Phone,
  CreditCard,
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const AdminVerification = () => {
  const { getPendingConfirmations, paymentConfirmations, approvePayment, rejectPayment } = usePayment();
  const { addNotification } = useNotifications();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [selectedConfirmation, setSelectedConfirmation] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (loginForm.email === 'tristan@propman.co.ke' && loginForm.password === 'Narkisso2007.!') {
      setIsAuthenticated(true);
    } else {
      setLoginError('Invalid admin credentials. Please check your email and password.');
    }
    
    setIsLoading(false);
  };

  const handleAction = (confirmationId: string, action: 'approve' | 'reject') => {
    setSelectedConfirmation(confirmationId);
    setActionType(action);
    setShowNotesModal(true);
  };

  const executeAction = () => {
    if (!selectedConfirmation) return;

    if (actionType === 'approve') {
      approvePayment(selectedConfirmation, adminNotes);
      addNotification({
        type: 'success',
        title: 'Payment Approved',
        message: 'User subscription has been activated successfully.'
      });
    } else {
      rejectPayment(selectedConfirmation, adminNotes);
      addNotification({
        type: 'warning',
        title: 'Payment Rejected',
        message: 'Payment confirmation has been rejected.'
      });
    }

    setShowNotesModal(false);
    setSelectedConfirmation(null);
    setAdminNotes('');
  };

  const pendingConfirmations = getPendingConfirmations();
  const allConfirmations = paymentConfirmations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Verification</h1>
            <p className="text-gray-600 mt-2">Enter admin credentials to access payment verification</p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <span className="text-red-700 text-sm">{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter admin email"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter admin password"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Access Admin Panel
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Verification Admin</h1>
              <p className="text-gray-600 mt-2">Review and approve subscription payment confirmations</p>
            </div>
            <div className="bg-green-100 px-4 py-2 rounded-lg">
              <p className="text-green-800 font-medium">Admin: Tristan</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingConfirmations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {allConfirmations.filter(c => c.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {allConfirmations.filter(c => c.status === 'rejected').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* No Pending Confirmations Message */}
        {pendingConfirmations.length === 0 && (
          <div className="mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <Clock className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">No Pending Confirmations</h3>
              <p className="text-blue-700">All payment confirmations have been processed. New submissions will appear here.</p>
            </div>
          </div>
        )}

        {/* Pending Confirmations */}
        {pendingConfirmations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pending Payment Confirmations ({pendingConfirmations.length})
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingConfirmations.map((confirmation) => (
                      <tr key={confirmation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-8 w-8 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {confirmation.fullName}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Phone className="h-4 w-4 mr-1" />
                                {confirmation.phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            confirmation.planSelected === 'starter' ? 'bg-blue-100 text-blue-800' :
                            confirmation.planSelected === 'growth' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {confirmation.planSelected.charAt(0).toUpperCase() + confirmation.planSelected.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {confirmation.transactionCode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {confirmation.timestamp.toLocaleDateString('en-KE', {
                            timeZone: 'Africa/Nairobi',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAction(confirmation.id, 'approve')}
                              className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(confirmation.id, 'reject')}
                              className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
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
        )}

        {/* All Confirmations */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            All Payment Confirmations ({allConfirmations.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {allConfirmations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allConfirmations.map((confirmation) => (
                      <tr key={confirmation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-8 w-8 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {confirmation.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {confirmation.phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            confirmation.planSelected === 'starter' ? 'bg-blue-100 text-blue-800' :
                            confirmation.planSelected === 'growth' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {confirmation.planSelected.charAt(0).toUpperCase() + confirmation.planSelected.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {confirmation.transactionCode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            confirmation.status === 'approved' ? 'bg-green-100 text-green-800' :
                            confirmation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {confirmation.status.charAt(0).toUpperCase() + confirmation.status.slice(1)}
                          </span>
                          {confirmation.adminNotes && (
                            <div className="text-xs text-gray-500 mt-1">
                              Note: {confirmation.adminNotes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {confirmation.timestamp.toLocaleDateString('en-KE', {
                            timeZone: 'Africa/Nairobi',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Confirmations</h3>
                <p className="text-gray-500">Payment confirmations will appear here once users submit them.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Modal */}
        {showNotesModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {actionType === 'approve' ? 'Approve Payment' : 'Reject Payment'}
              </h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder={actionType === 'approve' ? 
                    'Payment verified and approved...' : 
                    'Invalid transaction code or payment not found...'
                  }
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowNotesModal(false);
                    setAdminNotes('');
                    setSelectedConfirmation(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeAction}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    actionType === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {actionType === 'approve' ? 'Approve Payment' : 'Reject Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerification;