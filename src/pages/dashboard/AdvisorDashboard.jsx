import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FaUser, FaBuilding, FaPhone, FaGlobe, FaCalendarAlt, FaChartLine, FaDollarSign, FaMapMarkerAlt, FaIndustry, FaCog, FaSignOutAlt, FaEdit, FaToggleOn, FaToggleOff } from 'react-icons/fa';

const AdvisorDashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
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
      // Clear cookies
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
      }
      localStorage.clear();
      sessionStorage.clear();
      toast.success('Logged out successfully!');
      setTimeout(() => {
        navigate('/advisor-login');
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand to-brand-light">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-secondary to-secondary/90 shadow-xl flex flex-col relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-third/20"></div>
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-third/10 rounded-full translate-x-12 translate-y-12"></div>
        </div>
        
        {/* Header */}
        <div className="relative z-10 p-8 border-b border-primary/20">
          <div className="flex items-center justify-center">
            <img
              src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop,q=95/mk3JaNVZEltBD9g4/logo-transparency-mnlJLXr4jxIOR470.png"
              alt="Advisor Chooser logo"
              className="h-12 w-auto object-contain"
            />
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="relative z-10 flex-1 px-6 py-8 space-y-2">
          <button
            className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-300 flex items-center space-x-3 group ${
              activeTab === "overview"
                ? "bg-primary text-white shadow-lg transform scale-105"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            <FaUser className="w-5 h-5" />
            <span className="font-medium">Profile Overview</span>
          </button>

          <button
            className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-300 flex items-center space-x-3 group ${
              activeTab === "leads"
                ? "bg-primary text-white shadow-lg transform scale-105"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
            onClick={() => setActiveTab("leads")}
          >
            <FaChartLine className="w-5 h-5" />
            <span className="font-medium">Lead Management</span>
          </button>

          <button
            className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-300 flex items-center space-x-3 group ${
              activeTab === "settings"
                ? "bg-primary text-white shadow-lg transform scale-105"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            <FaCog className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </nav>
        
        {/* Sign Out Button */}
        <div className="relative z-10 p-6 border-t border-primary/20">
          <button
            className="w-full text-left px-6 py-4 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 flex items-center space-x-3 group"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between bg-white/95 backdrop-blur-sm shadow-lg border-b border-primary/10 px-8 py-6 relative overflow-hidden">
          {/* Background Accent */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-third/5"></div>
          
          {/* Title Section */}
          <div className="flex items-center relative z-10">
            <h1 className="text-2xl font-bold text-secondary">Advisor Dashboard</h1>
          </div>
          
          {/* Profile Section */}
          <div className="relative z-10">
            <button
              className="flex items-center gap-4 px-4 py-2 rounded-xl hover:bg-primary/10 transition-all duration-300 group"
              onClick={() => setProfileDropdownOpen(prev => !prev)}
            >
              <div className="text-right">
                <span className="block font-semibold text-secondary group-hover:text-primary transition-colors">
                  {user?.name || "Loading..."}
                </span>
                <span className="block text-sm text-gray-500">Advisor Account</span>
              </div>
              <div className="relative">
                <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-primary to-third rounded-full text-white font-bold shadow-lg ring-2 ring-primary/20">
                  {(user?.name || "A").charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
            </button>
            
            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-sm border border-primary/20 rounded-2xl shadow-2xl p-6 z-50 animate-fadeIn">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                    <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-primary to-third rounded-full text-white font-bold text-xl shadow-lg">
                      {(user?.name || "A").charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary text-lg">{user?.name}</h3>
                      <p className="text-sm text-gray-500">Advisor Account</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Name</label>
                    <input
                      type="text"
                      value={user?.name || ""}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Tab Content */}
        <div className="px-6 py-4 overflow-y-auto">
          {/* Profile Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {profile ? (
                <>
                  {/* Profile Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-2xl border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-secondary/70">Years Experience</p>
                          <p className="text-2xl font-bold text-secondary">{profile.yearsExperience}</p>
                        </div>
                        <FaCalendarAlt className="w-8 h-8 text-primary" />
                      </div>
                    </motion.div>
                    
                    <motion.div className="bg-gradient-to-br from-third/10 to-third/5 p-6 rounded-2xl border border-third/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-secondary/70">Transactions</p>
                          <p className="text-2xl font-bold text-secondary">{profile.numberOfTransactions}</p>
                        </div>
                        <FaChartLine className="w-8 h-8 text-third" />
                      </div>
                    </motion.div>
                    
                    <motion.div className="bg-gradient-to-br from-forth/10 to-forth/5 p-6 rounded-2xl border border-forth/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-secondary/70">Profile Status</p>
                          <p className={`text-lg font-semibold ${profile.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {profile.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${profile.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                          <div className={`w-4 h-4 rounded-full ${profile.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div className="bg-gradient-to-br from-green-100 to-green-50 p-6 rounded-2xl border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-secondary/70">Lead Status</p>
                          <p className={`text-lg font-semibold ${profile.sendLeads ? 'text-green-600' : 'text-yellow-600'}`}>
                            {profile.sendLeads ? 'Receiving' : 'Paused'}
                          </p>
                        </div>
                        {profile.sendLeads ? <FaToggleOn className="w-8 h-8 text-green-500" /> : <FaToggleOff className="w-8 h-8 text-yellow-500" />}
                      </div>
                    </motion.div>
                  </div>

                  {/* Company Information */}
                  <motion.div className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm">
                    <h3 className="text-xl font-semibold text-secondary mb-6 flex items-center">
                      <FaBuilding className="mr-3 text-primary" />
                      Company Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="flex items-center space-x-3">
                        <FaBuilding className="text-primary" />
                        <div>
                          <p className="text-sm font-medium text-secondary/70">Company Name</p>
                          <p className="text-secondary font-medium">{profile.companyName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <FaPhone className="text-primary" />
                        <div>
                          <p className="text-sm font-medium text-secondary/70">Phone</p>
                          <p className="text-secondary font-medium">{profile.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <FaGlobe className="text-primary" />
                        <div>
                          <p className="text-sm font-medium text-secondary/70">Website</p>
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-third transition-colors">
                            {profile.website}
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Industries & Geographies */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm">
                      <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center">
                        <FaIndustry className="mr-3 text-primary" />
                        Industries
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.industries?.map((industry, index) => (
                          <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
                            {industry}
                          </span>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm">
                      <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center">
                        <FaMapMarkerAlt className="mr-3 text-primary" />
                        Geographies
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.geographies?.map((geography, index) => (
                          <span key={index} className="px-3 py-1 bg-third/10 text-third rounded-full text-sm font-medium border border-third/20">
                            {geography}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg text-center space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">No Profile Found</h3>
                  <p className="text-gray-700">Please create your advisor profile to get started.</p>
                  <button
                    onClick={() => navigate('/advisor-payments')}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    Create Profile
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Lead Management Tab */}
          {activeTab === "leads" && profile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-secondary mb-6 flex items-center">
                <FaChartLine className="mr-3 text-primary" />
                Lead Management
              </h3>
              
              <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-primary/10">
                <div>
                  <h4 className="text-lg font-medium text-secondary">Receive New Leads</h4>
                  <p className="text-secondary/70 mt-1">
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
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    profile.sendLeads ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-lg ${
                      profile.sendLeads ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-secondary mb-6 flex items-center">
                <FaCog className="mr-3 text-primary" />
                Profile Actions
              </h3>
              
              <div className="flex flex-wrap gap-4">
                {profile && (
                  <button
                    onClick={() => navigate('/edit-advisor-profile')}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-primary to-third text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium transform hover:scale-105"
                  >
                    <FaEdit className="mr-2" />
                    Edit Profile
                  </button>
                )}
                {!profile && (
                  <button
                    onClick={() => navigate('/advisor-payments')}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium transform hover:scale-105"
                  >
                    <FaDollarSign className="mr-2" />
                    Make Payment
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdvisorDashboard;