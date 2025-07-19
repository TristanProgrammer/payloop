import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  CreditCard, 
  BarChart3, 
  Smartphone, 
  Shield,
  Check,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showDeveloperLogin, setShowDeveloperLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [loginError, setLoginError] = useState('');

  const handleDeveloperLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (loginForm.email === 'tristan@propman.co.ke' && loginForm.password === 'Narkisso2007.!') {
      // Redirect to admin verification
      navigate('/admin-verification');
    } else {
      setLoginError('Access Denied');
    }
  };

  const features = [
    {
      icon: <Building2 className="h-8 w-8 text-blue-600" />,
      title: "Property Management",
      description: "Manage multiple properties and units with ease. Track occupancy, revenue, and maintenance."
    },
    {
      icon: <Users className="h-8 w-8 text-teal-600" />,
      title: "Tenant Management",
      description: "Complete tenant lifecycle management from move-in to move-out with automated workflows."
    },
    {
      icon: <CreditCard className="h-8 w-8 text-orange-600" />,
      title: "Payment Tracking",
      description: "Track rent payments, send automated reminders, and manage M-Pesa transactions."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-green-600" />,
      title: "Analytics & Reports",
      description: "Get insights into your property performance with detailed reports and analytics."
    },
    {
      icon: <Smartphone className="h-8 w-8 text-purple-600" />,
      title: "Mobile Optimized",
      description: "Access your property management system anywhere with our mobile-optimized platform."
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: "Secure & Compliant",
      description: "Bank-level security with SMS OTP and compliance with Kenyan data protection laws."
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "KES 500",
      period: "per month",
      features: [
        "1 Property",
        "Up to 10 Tenants",
        "SMS Reminders",
        "Basic Reports",
        "Email Support"
      ],
      popular: false
    },
    {
      name: "Growth",
      price: "KES 1,000",
      period: "per month",
      features: [
        "Up to 5 Properties",
        "Up to 50 Tenants",
        "SMS Reminders",
        "Advanced Reports",
        "M-Pesa Integration",
        "Priority Support"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "KES 2,500",
      period: "per month",
      features: [
        "Unlimited Properties",
        "Unlimited Tenants",
        "SMS Reminders",
        "Advanced Analytics",
        "M-Pesa Integration",
        "WhatsApp Support",
        "Custom Features"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">PropMan Kenya</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-teal-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Automate Your Property Management in
              <span className="text-blue-600"> Kenya</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Stop chasing rent manually. Our platform helps landlords automate rent collection, 
              manage tenants, and grow their property business with SMS reminders and M-Pesa integration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
              >
                Start Free 7-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors">
                Watch Demo
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required • Cancel anytime • Full access during trial
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Properties
            </h2>
            <p className="text-xl text-gray-600">
              Built specifically for the Kenyan market with local payment methods and workflows
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your property portfolio
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`bg-white rounded-xl shadow-lg p-8 ${plan.popular ? 'border-2 border-blue-600 relative' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
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
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors text-center block ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Automate Your Property Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of landlords who have streamlined their operations with PropMan Kenya
          </p>
          <Link
            to="/register"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center"
          >
            Start Your Free Trial Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Building2 className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">PropMan Kenya</span>
              </div>
              <p className="text-gray-400">
                The leading property management platform for Kenyan landlords.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">WhatsApp</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Data Protection</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2024 PropMan Kenya. All rights reserved.</p>
            
            {/* Developer Login Link */}
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowDeveloperLogin(true)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Developer Login
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Developer Login Modal */}
      {showDeveloperLogin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Developer Access</h2>
              </div>
              <button
                onClick={() => {
                  setShowDeveloperLogin(false);
                  setLoginForm({ email: '', password: '' });
                  setLoginError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleDeveloperLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter admin email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="Enter admin password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeveloperLogin(false);
                    setLoginForm({ email: '', password: '' });
                    setLoginError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Access Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;