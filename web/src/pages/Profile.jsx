import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import API_URL from '../config/api';

const Profile = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    bio: '',
    location: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (user) {
      setFormData({
        full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
      });
    }
  }, [user, token, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.patch(`${API_URL}/api/users/me`, formData);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      // Update local user state
      setFormData(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">USER PROFILE</h1>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded transition-colors"
            >
              LOGOUT
            </button>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-semibold mb-2">
                  Full Name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  className="w-full bg-black border border-gray-700 text-white px-4 py-3 rounded focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={true}
                  className="w-full bg-black border border-gray-700 text-white px-4 py-3 rounded opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-semibold mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!editing}
                rows={4}
                className="w-full bg-black border border-gray-700 text-white px-4 py-3 rounded focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-semibold mb-2">
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                disabled={!editing}
                className="w-full bg-black border border-gray-700 text-white px-4 py-3 rounded focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="City, Country"
              />
            </div>

            <div className="flex gap-4">
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 rounded transition-colors"
                >
                  EDIT PROFILE
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '',
                        email: user.email || '',
                        bio: user.bio || '',
                        location: user.location || '',
                      });
                      setError('');
                      setSuccess('');
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded transition-colors"
                  >
                    CANCEL
                  </button>
                </>
              )}
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-800">
            <h2 className="text-2xl font-bold mb-4">Account Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Account Created:</span>
                <span className="text-white">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email Verified:</span>
                <span className={user.email_verified || user.email_verified === true ? 'text-green-500' : 'text-red-500'}>
                  {user.email_verified || user.email_verified === true ? 'Yes' : 'No'}
                </span>
              </div>
              {user.roles && user.roles.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Roles:</span>
                  <span className="text-white">
                    {user.roles.map((r) => r.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
