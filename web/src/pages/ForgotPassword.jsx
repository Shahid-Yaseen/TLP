import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import API_URL from '../config/api';
import RedDotLoader from '../components/common/RedDotLoader';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // TODO: Implement forgot password API endpoint
      // For now, show success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setMessage('If an account exists with this email, a password reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {loading && <RedDotLoader fullScreen={true} size="large" />}
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <div className="bg-[#222222] p-8 rounded-lg border border-[#222222]">
            <h1 className="text-4xl font-bold mb-2 text-center">RESET PASSWORD</h1>
            <p className="text-gray-400 text-center mb-8">
              Enter your email address and we'll send you a link to reset your password
            </p>

            {error && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded mb-6">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black border border-gray-700 text-white px-4 py-3 rounded focus:outline-none focus:border-[#8B1A1A] focus:ring-2 focus:ring-[#8B1A1A]"
                  placeholder="your.email@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8B1A1A] hover:bg-[#A02A2A] text-white font-semibold py-3 px-6 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'SEND RESET LINK'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-400 text-sm">
                Remember your password?{' '}
                <Link to="/login" className="text-[#8B1A1A] hover:text-[#A02A2A]">
                  Sign in
                </Link>
              </p>
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#8B1A1A] hover:text-[#A02A2A]">
                  Create one here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPassword;
