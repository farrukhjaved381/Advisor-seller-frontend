import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { FaBuilding, FaChartLine, FaDollarSign, FaFileAlt, FaCog, FaSignOutAlt, FaUser, FaBars, FaTimes, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { rawIndustryData } from '../../components/Static/industryData';
import { rawGeographyData } from '../../components/Static/geographyData';

// Multi-select filter component for industries and geographies
const MultiSelectFilter = ({ title, data, fieldName }) => {
  const { values, setFieldValue } = useFormikContext();
  const [query, setQuery] = useState("");
  const [collapsedParents, setCollapsedParents] = useState(new Set(data.map((item) => item.id)));

  const handleToggleCollapse = (item) => {
    setCollapsedParents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item.id)) newSet.delete(item.id);
      else newSet.add(item.id);
      return newSet;
    });
  };

  const filterData = (items, currentQuery) => {
    if (!currentQuery) return items;
    const lowerCaseQuery = currentQuery.toLowerCase();
    return items.filter((item) => {
      const itemMatches = item.label.toLowerCase().includes(lowerCaseQuery);
      if (item.children) {
        const filteredChildren = filterData(item.children, currentQuery);
        if (itemMatches || filteredChildren.length > 0) return true;
      }
      return itemMatches;
    });
  };

  const filteredData = filterData(data, query);
  const selectedItems = values[fieldName] || [];

  const renderCheckboxes = (items) => (
    <ul className="list-none space-y-2">
      {items.map((item) => {
        const isItemParent = item.children && item.children.length > 0;
        const isCollapsed = collapsedParents.has(item.id);
        const isSelected = selectedItems.includes(item.label);

        return (
          <li key={item.id} className="ml-4">
            <div className="flex items-center space-x-2">
              {isItemParent && (
                <button
                  type="button"
                  onClick={() => handleToggleCollapse(item)}
                  className="p-1 text-gray-500 hover:text-gray-700 transition"
                >
                  {isCollapsed ? <FaChevronRight /> : <FaChevronDown />}
                </button>
              )}
              <label className={`flex items-center text-sm font-medium cursor-pointer transition-colors duration-200 ${
                isSelected ? "text-primary font-semibold" : "text-gray-700 hover:text-primary"
              }`}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    const newSelected = e.target.checked
                      ? [...selectedItems, item.label]
                      : selectedItems.filter(i => i !== item.label);
                    setFieldValue(fieldName, newSelected);
                  }}
                  className="form-checkbox h-4 w-4 text-primary focus:ring-primary transition-colors duration-200"
                />
                <span className="ml-2">{item.label}</span>
              </label>
            </div>
            {isItemParent && !isCollapsed && (
              <ul className="mt-2 pl-4 border-l-2 border-primary/20">{renderCheckboxes(item.children)}</ul>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="w-full">
      {title && <h3 className="block text-sm font-medium mb-2">{title}</h3>}
      <div className="relative mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${fieldName}`}
          className="w-full p-2 pr-10 rounded-xl border-[0.15rem] border-primary/30 focus:border-primary focus:outline-none transition"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <div className="bg-white max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
        {filteredData.length > 0 ? renderCheckboxes(filteredData) : (
          <p className="text-gray-500 text-sm">No results found for "{query}".</p>
        )}
      </div>
      <ErrorMessage name={fieldName} component="p" className="text-red-500 text-sm mt-1" />
    </div>
  );
};

const EditAdvisorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

      // Get advisor profile
      const profileRes = await axios.get('https://advisor-seller-backend.vercel.app/api/advisors/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfile(profileRes.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      navigate('/advisor-dashboard');
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
      localStorage.clear();
      sessionStorage.clear();
      toast.success('Logged out successfully!');
      setTimeout(() => {
        navigate('/advisor-login');
      }, 2000);
    }
  };

  const validationSchema = Yup.object().shape({
    companyName: Yup.string().required("Company name is required"),
    phone: Yup.string().required("Phone is required"),
    website: Yup.string().url("Invalid URL").required("Website is required"),
    industries: Yup.array().min(1, "Select at least one industry"),
    geographies: Yup.array().min(1, "Select at least one geography"),
    yearsExperience: Yup.number().min(1).required("Years of experience is required"),
    numberOfTransactions: Yup.number().min(0).required("Number of transactions is required"),
    currency: Yup.string().required("Currency is required"),
    description: Yup.string().required("Description is required"),
    licensing: Yup.string().required("Licensing information is required"),
    revenueRange: Yup.object().shape({
      min: Yup.number().required("Minimum revenue is required"),
      max: Yup.number().required("Maximum revenue is required"),
    }),
  });

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const token = localStorage.getItem('access_token');
      
      await axios.patch('https://advisor-seller-backend.vercel.app/api/advisors/profile', values, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Profile updated successfully!');
      navigate('/advisor-dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <button
            onClick={() => navigate('/advisor-dashboard')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:static inset-y-0 left-0 z-30 w-72 bg-white flex flex-col border-r border-gray-200 shadow-sm transition-transform duration-300 ease-in-out
      `}>
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between lg:justify-center mb-4">
            <img
              src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop,q=95/mk3JaNVZEltBD9g4/logo-transparency-mnlJLXr4jxIOR470.png"
              alt="Advisor Chooser"
              className="h-8 w-auto object-contain"
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <FaTimes className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-6">
          <div className="space-y-6">
            {/* Main Menu */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Main Menu</p>

              <button
                className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between text-gray-700 hover:bg-gray-100"
                onClick={() => navigate('/advisor-dashboard')}
              >
                <div className="flex items-center space-x-3">
                  <FaUser className="w-5 h-5" />
                  <div>
                    <span className="font-medium text-sm">Profile Overview</span>
                    <p className="text-xs opacity-70">View your profile details</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Settings */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Settings</p>

              <button
                className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 bg-gradient-to-r from-third to-primary text-white shadow-sm"
              >
                <FaCog className="w-5 h-5" />
                <div>
                  <span className="font-medium text-sm">Profile Settings</span>
                  <p className="text-xs opacity-70">Update your information</p>
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-6 border-t border-gray-100 space-y-4">
          <button
            className="w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center justify-center space-x-2 border border-red-200 hover:border-red-300"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="w-4 h-4" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between bg-white shadow-sm border-b border-gray-200 px-4 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <FaBars className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Edit Profile</h1>
          </div>
          
          <div className="relative">
            <button
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
              onClick={() => setProfileDropdownOpen(prev => !prev)}
            >
              <div className="text-right hidden sm:block">
                <span className="block font-semibold text-gray-900 text-sm">
                  {user?.name || "Loading..."}
                </span>
                <span className="block text-xs text-gray-500">Advisor Account</span>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-primary to-third rounded-full text-white font-bold text-sm shadow-md">
                {(user?.name || "A").charAt(0)}
              </div>
            </button>
          </div>
        </header>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
        <Formik
          initialValues={{
            companyName: profile.companyName || "",
            phone: profile.phone || "",
            website: profile.website || "",
            industries: profile.industries || [],
            geographies: profile.geographies || [],
            yearsExperience: profile.yearsExperience || "",
            numberOfTransactions: profile.numberOfTransactions || "",
            currency: profile.currency || "USD",
            description: profile.description || "",
            licensing: profile.licensing || "",
            revenueRange: {
              min: profile.revenueRange?.min || "",
              max: profile.revenueRange?.max || "",
            },
          }}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {({ isSubmitting, setFieldValue, values }) => (
            <Form className="space-y-8">
              {/* Company Information */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FaBuilding className="mr-3 text-primary" />
                  Company Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                    <Field
                      name="companyName"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <ErrorMessage name="companyName" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <Field
                      name="phone"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <ErrorMessage name="phone" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <Field
                      name="website"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <ErrorMessage name="website" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              </div>

              {/* Industries & Geographies */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Expertise Areas</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <MultiSelectFilter
                    title="Industries"
                    data={rawIndustryData}
                    fieldName="industries"
                  />
                  
                  <MultiSelectFilter
                    title="Geographies"
                    data={rawGeographyData}
                    fieldName="geographies"
                  />
                </div>
              </div>

              {/* Experience & Performance */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FaChartLine className="mr-3 text-primary" />
                  Experience & Performance
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                    <Field
                      name="yearsExperience"
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <ErrorMessage name="yearsExperience" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Transactions</label>
                    <Field
                      name="numberOfTransactions"
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <ErrorMessage name="numberOfTransactions" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              </div>

              {/* Revenue Range */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FaDollarSign className="mr-3 text-primary" />
                    Revenue Size Range
                  </h3>
                  <div className="w-28">
                    <Field name="currency">
                      {({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="USD">USD</option>
                          <option value="PKR">PKR</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      )}
                    </Field>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Revenue</label>
                    <Field
                      name="revenueRange.min"
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <ErrorMessage name="revenueRange.min" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Revenue</label>
                    <Field
                      name="revenueRange.max"
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <ErrorMessage name="revenueRange.max" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              </div>

              {/* Description & Licensing */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FaFileAlt className="mr-3 text-primary" />
                  Additional Information
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
                    <Field
                      as="textarea"
                      name="description"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                    <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">Are you licensed?</label>
                    <div className="flex space-x-8">
                      <label className="flex items-center cursor-pointer">
                        <Field
                          type="radio"
                          name="licensing"
                          value="yes"
                          className="form-radio h-5 w-5 text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="ml-3 text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <Field
                          type="radio"
                          name="licensing"
                          value="no"
                          className="form-radio h-5 w-5 text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="ml-3 text-gray-700">No</span>
                      </label>
                    </div>
                    <ErrorMessage name="licensing" component="div" className="text-red-500 text-sm mt-2" />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/advisor-dashboard')}
                  className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-primary to-third text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditAdvisorProfile;