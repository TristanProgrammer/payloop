import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2, Eye, EyeOff, AlertCircle, Check, RefreshCw,
} from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate(); // ✅ moved up
  const { register, user } = useAuth();

  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ✅ redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setIsLoading(true);

    try {
      await register(formData);
      // Navigate will be handled by useEffect after user context updates
    } catch (err: any) {
      console.error("Register failed:", err);
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Start Your Free Trial</h1>
          <p className="text-gray-600 mt-2">7 days free, no credit card required</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-green-700 font-medium">Full access during trial</span>
          </div>
          <ul className="mt-2 text-sm text-green-600 space-y-1">
            <li>• All premium features included</li>
            <li>• No setup fees or hidden costs</li>
            <li>• Cancel anytime</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {[
            { name: 'businessName', label: 'Business Name', type: 'text', placeholder: 'e.g., Nairobi Properties Ltd' },
            { name: 'ownerName', label: 'Owner Name', type: 'text', placeholder: 'Your full name' },
            { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+254712345678' },
            { name: 'email', label: 'Email Address', type: 'email', placeholder: 'your@email.com' },
          ].map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
              <input
                type={type}
                id={name}
                name={name}
                value={formData[name as keyof typeof formData]}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={placeholder}
                required
              />
            </div>
          ))}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Minimum 6 characters"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(prev => !prev)}
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Repeat your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Start Free Trial'
            )}
          </button>

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a> and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>.
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
