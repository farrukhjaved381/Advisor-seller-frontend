import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdvisorDashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/advisor-login');
        return;
      }

      // Get user profile
      const userRes = await axios.get('https://advisor-seller-backend.vercel.app/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (userRes.data.role !== 'advisor') {
        navigate('/seller-login');
        return;
      }

      setUser(userRes.data);

      // Get advisor profile
      try {
        const profileRes = await axios.get('https://advisor-seller-backend.vercel.app/api/advisors/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(profileRes.data);
      } catch (error) {
        if (error.response?.status === 404) {
          // No profile exists, redirect to create one
          navigate('/advisor-form');
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      navigate('/advisor-login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await axios.post('https://advisor-seller-backend.vercel.app/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all stored data
      localStorage.clear();
      sessionStorage.clear();
      toast.success('Logged out successfully!');
      navigate('/advisor-login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Advisor Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name || user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Profile Overview */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Profile Overview
              </h3>
              {profile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{profile.companyName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{profile.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Website</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        {profile.website}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Years Experience</dt>
                    <dd className="mt-1 text-sm text-gray-900">{profile.yearsExperience} years</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Transactions</dt>
                    <dd className="mt-1 text-sm text-gray-900">{profile.numberOfTransactions}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        profile.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {profile.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </dd>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No profile found. Please create your profile.</p>
              )}
            </div>
          </div>

          {/* Industries & Geographies */}
          {profile && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Industries</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.industries?.map((industry, index) => (
                      <span key={index} className="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Geographies</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.geographies?.map((geography, index) => (
                      <span key={index} className="inline-flex px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                        {geography}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Actions</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/advisor-form')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {profile ? 'Edit Profile' : 'Create Profile'}
                </button>
                {!profile && (
                  <button
                    onClick={() => navigate('/advisor-payments')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Make Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdvisorDashboard;