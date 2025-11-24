import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import RedDotLoader from '../components/common/RedDotLoader';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const navigate = useNavigate();
  const { verifyCode } = useAuth();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!email) {
      setError('Email address is required for verification');
    }
  }, [email]);

  const handleCodeChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      setError('');
      // Focus last input
      const lastInput = document.getElementById('code-5');
      if (lastInput) lastInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (!email) {
      setError('Email address is required');
      return;
    }

    setLoading(true);

    const result = await verifyCode(verificationCode, email);

    if (result.success) {
      // Redirect to home or returnUrl
      const returnUrl = searchParams.get('returnUrl');
      const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/';
      navigate(redirectTo);
    } else {
      setError(result.error);
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    }

    setLoading(false);
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email address is required');
      return;
    }

    setResending(true);
    setResendMessage('');
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3007'}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage('Verification code sent! Please check your email.');
      } else {
        setError(data.error || 'Failed to resend verification code');
      }
    } catch (err) {
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center px-6 py-12">
          <div className="max-w-md w-full">
            <div className="bg-[#222222] p-8 rounded-lg border border-[#222222] text-center">
              <div className="text-6xl mb-4">❌</div>
              <h1 className="text-4xl font-bold mb-4 text-red-500">Error</h1>
              <p className="text-gray-400 mb-6">Email address is required for verification.</p>
              <Link
                to="/register"
                className="inline-block bg-[#8B1A1A] hover:bg-[#A02A2A] text-white font-semibold px-6 py-2 rounded transition-colors"
              >
                Go to Register
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <div className="bg-[#222222] p-8 rounded-lg border border-[#222222]">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📧</div>
              <h1 className="text-4xl font-bold mb-2">Verify Your Email</h1>
              <p className="text-gray-400">
                We've sent a 6-digit verification code to
              </p>
              <p className="text-[#8B1A1A] font-semibold mt-1">{email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                  Enter Verification Code
                </label>
                <div className="flex justify-center gap-2">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-14 text-center text-2xl font-bold bg-[#1a1a1a] border border-gray-600 rounded focus:border-[#8B1A1A] focus:outline-none text-white"
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              {resendMessage && (
                <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded text-sm">
                  {resendMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.join('').length !== 6}
                className="w-full bg-[#8B1A1A] hover:bg-[#A02A2A] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded transition-colors flex items-center justify-center"
              >
                {loading ? <RedDotLoader /> : 'Verify Email'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-[#8B1A1A] hover:text-[#A02A2A] disabled:text-gray-500 text-sm font-medium"
              >
                {resending ? 'Sending...' : "Didn't receive the code? Resend"}
              </button>
              
              <div className="text-gray-500 text-sm">
                <p>Code expires in 10 minutes</p>
              </div>

              <Link
                to="/login"
                className="block text-[#8B1A1A] hover:text-[#A02A2A] text-sm font-medium mt-4"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmailVerification;
