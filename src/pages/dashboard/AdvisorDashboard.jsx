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

      // Get advisor profile from database
      try {
        const profileRes = await axios.get('https://advisor-seller-backend.vercel.app/api/advisors/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(profileRes.data);
      } catch (error) {
        if (error.response?.status === 404) {
          // No profile exists, check if payment is verified
          if (userRes.data.isPaymentVerified) {
            navigate('/advisor-form');
          } else {
            navigate('/advisor-payments');
          }
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
      <header className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Advisor Dashboard</h1>
                <p className="text-blue-100">Manage your advisory profile and leads</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white font-medium">{user?.name || user?.email}</p>
                <p className="text-blue-100 text-sm">Professional Advisor</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl hover:bg-opacity-30 transition-all duration-200 font-medium backdrop-blur-sm"
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
          <div className="bg-white overflow-hidden shadow-xl rounded-2xl mb-8 border border-gray-100">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <svg className="w-6 h-6 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Profile Overview
              </h3>
            </div>
            <div className="px-6 py-6">
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
                    <dt className="text-sm font-medium text-gray-500">Profile Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        profile.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {profile.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Lead Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        profile.sendLeads ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {profile.sendLeads ? 'Receiving Leads' : 'Leads Paused'}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/>
                      <path fillRule="evenodd" d="M3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                    </svg>
                    Industries
                  </h3>
                </div>
                <div className="px-6 py-6">
                  <div className="flex flex-wrap gap-3">
                    {profile.industries?.map((industry, index) => (
                      <span key={index} className="inline-flex px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full border border-blue-300">
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                    Geographies
                  </h3>
                </div>
                <div className="px-6 py-6">
                  <div className="flex flex-wrap gap-3">
                    {profile.geographies?.map((geography, index) => (
                      <span key={index} className="inline-flex px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-full border border-green-300">
                        {geography}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lead Management */}
          {profile && (
            <div className="bg-white overflow-hidden shadow-xl rounded-2xl mb-8 border border-gray-100">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <svg className="w-6 h-6 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                  Lead Management
                </h3>
              </div>
              <div className="px-6 py-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Receive New Leads</h4>
                    <p className="text-sm text-gray-500">
                      {profile.sendLeads ? 'You are currently receiving new leads from sellers' : 'Lead delivery is paused'}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('access_token');
                        await axios.patch(
                          'https://advisor-seller-backend.vercel.app/api/advisors/profile/pause-leads',
                          { sendLeads: !profile.sendLeads },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        toast.success(`Leads ${!profile.sendLeads ? 'resumed' : 'paused'} successfully!`);
                        fetchUserData();
                      } catch (error) {
                        toast.error('Failed to update lead status');
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      profile.sendLeads ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        profile.sendLeads ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white overflow-hidden shadow-xl rounded-2xl border border-gray-100">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <svg className="w-6 h-6 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                </svg>
                Profile Actions
              </h3>
            </div>
            <div className="px-6 py-6">
              <div className="flex flex-wrap gap-4">
                {profile && (
                  <button
                    onClick={() => navigate('/edit-advisor-profile')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Edit Profile
                  </button>
                )}
                {!profile && (
                  <button
                    onClick={() => navigate('/advisor-payments')}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
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