import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PropertyProvider } from './contexts/PropertyContext';
import { SMSProvider } from './contexts/SMSContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PaymentProvider } from './contexts/PaymentContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Tenants from './pages/Tenants';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SMSCampaigns from './pages/SMSCampaigns';
import SubscriptionPayment from './pages/SubscriptionPayment';
import AdminVerification from './pages/AdminVerification';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <PaymentProvider>
          <PropertyProvider>
            <SMSProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/subscription" element={<SubscriptionPayment />} />
                  <Route path="/admin-verification" element={<AdminVerification />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Dashboard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/properties" element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Properties />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/tenants" element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Tenants />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/payments" element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Payments />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/sms-campaigns" element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <SMSCampaigns />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/reports" element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Reports />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Settings />
                      </DashboardLayout>
                    </ProtectedRoute>
                  } />
                </Routes>
              </Router>
            </SMSProvider>
          </PropertyProvider>
        </PaymentProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;