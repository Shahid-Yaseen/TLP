import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RedDotLoader from '../components/common/RedDotLoader';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      // Redirect to returnUrl if provided, otherwise go to home
      const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/';
      navigate(redirectTo);
      // Scroll to comments section if hash is present
      setTimeout(() => {
        if (redirectTo.includes('#comments')) {
          const commentsElement = document.getElementById('comments');
          if (commentsElement) {
            commentsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 100);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <>
      {loading && <RedDotLoader fullScreen={true} size="large" />}
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <div className="bg-[#222222] p-8 rounded-lg border border-[#222222]">
            <h1 className="text-4xl font-bold mb-2 text-center">LOGIN</h1>
            <p className="text-gray-400 text-center mb-8">
              Sign in to your TLP Network account
            </p>

            {error && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
                {error}
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

              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-black border border-gray-700 text-white px-4 py-3 rounded focus:outline-none focus:border-[#8B1A1A] focus:ring-2 focus:ring-[#8B1A1A]"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8B1A1A] hover:bg-[#A02A2A] text-white font-semibold py-3 px-6 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'SIGN IN'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#8B1A1A] hover:text-[#A02A2A]">
                  Create one here
                </Link>
              </p>
              <p className="text-gray-500 text-xs">
                <Link to="/forgot-password" className="hover:text-gray-400">
                  Forgot your password?
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
