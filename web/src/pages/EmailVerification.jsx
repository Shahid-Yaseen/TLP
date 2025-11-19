import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import API_URL from '../config/api';

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-email`, {
        token,
      });

      if (response.data.success) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } else {
        setStatus('error');
        setMessage(response.data.error || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(
        error.response?.data?.error || 'Verification failed. The link may have expired.'
      );
    }
  };

  const resendVerification = async () => {
    try {
      // This endpoint requires authentication, so we'll need to handle it differently
      // For now, show a message directing user to login and resend from profile
      setMessage('Please log in to your account to resend the verification email from your profile page.');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to resend verification email');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <div className="bg-[#222222] p-8 rounded-lg border border-[#222222] text-center">
            {status === 'verifying' && (
              <>
                <div className="text-6xl mb-4">⏳</div>
                <h1 className="text-4xl font-bold mb-4">Verifying Email</h1>
                <p className="text-gray-400">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="text-6xl mb-4">✅</div>
                <h1 className="text-4xl font-bold mb-4 text-green-500">Email Verified!</h1>
                <p className="text-gray-400 mb-6">{message}</p>
                <Link
                  to="/login"
                  className="inline-block bg-[#8B1A1A] hover:bg-[#A02A2A] text-white font-semibold px-6 py-2 rounded transition-colors"
                >
                  GO TO LOGIN
                </Link>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="text-6xl mb-4">❌</div>
                <h1 className="text-4xl font-bold mb-4 text-red-500">Verification Failed</h1>
                <p className="text-gray-400 mb-6">{message}</p>
                <div className="space-y-4">
                  <button
                    onClick={resendVerification}
                    className="w-full bg-[#8B1A1A] hover:bg-[#A02A2A] text-white font-semibold px-6 py-2 rounded transition-colors"
                  >
                    RESEND VERIFICATION EMAIL
                  </button>
                  <Link
                    to="/login"
                    className="block text-center text-[#8B1A1A] hover:text-[#A02A2A]"
                  >
                    Return to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmailVerification;
