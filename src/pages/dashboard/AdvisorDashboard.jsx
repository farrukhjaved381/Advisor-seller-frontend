import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_CONFIG } from '../../config/api';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { FaUser, FaBuilding, FaPhone, FaGlobe, FaCalendarAlt, FaQuoteLeft, FaFilePdf, FaChartLine, FaDollarSign, FaMapMarkerAlt, FaIndustry, FaCog, FaSignOutAlt, FaEdit, FaToggleOn, FaToggleOff, FaBars, FaTimes, FaChevronDown, FaChevronRight, FaFileAlt, FaSearch, FaCreditCard } from 'react-icons/fa';
import { getIndustryData } from '../../components/Static/newIndustryData';
import { Country, State } from 'country-state-city';

const AdvisorDashboard = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leads');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leadOverview, setLeadOverview] = useState(null);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [hasLoadedLeads, setHasLoadedLeads] = useState(false);
  const [showAllIndustries, setShowAllIndustries] = useState(false);

  const leadStats = leadOverview?.stats;
  const totalLeads = leadStats?.totalLeads ?? 0;
  const leadsThisMonth = leadStats?.leadsThisMonth ?? 0;
  const leadsLastMonth = leadStats?.leadsLastMonth ?? 0;
  const leadsThisWeek = leadStats?.leadsThisWeek ?? 0;
  const leadsByType = leadStats?.leadsByType ?? {};
  const topLeadTypeEntry = Object.entries(leadsByType).sort((a, b) => b[1] - a[1])[0];
  const topLeadType = topLeadTypeEntry
    ? { label: topLeadTypeEntry[0], count: topLeadTypeEntry[1] }
    : null;
  const monthlyTrend = leadStats?.monthlyTrend ?? [];
  const formatTitleCase = (value = '') =>
    value
      .split(/[-_\s]+/)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');

  const normalizeTestimonials = (rawTestimonials = []) => {
    const base = Array.isArray(rawTestimonials)
      ? rawTestimonials
          .slice(0, 5)
          .map((testimonial) => ({
            clientName: testimonial?.clientName || '',
            testimonial: testimonial?.testimonial || '',
            pdfFile: null,
            existingPdfUrl: testimonial?.pdfUrl || testimonial?.existingPdfUrl || null,
          }))
      : [];

    while (base.length < 5) {
      base.push({ clientName: '', testimonial: '', pdfFile: null, existingPdfUrl: null });
    }

    return base;
  };
  const monthDelta = leadsLastMonth > 0
    ? Math.round(((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100)
    : leadsThisMonth > 0
      ? 100
      : 0;
  const monthDeltaLabel = leadsLastMonth > 0
    ? `${monthDelta >= 0 ? '+' : ''}${monthDelta}% vs last month`
    : leadsThisMonth > 0
      ? 'First leads this month'
      : 'No change from last month';
  const monthDeltaColor = leadsLastMonth > 0
    ? monthDelta >= 0
      ? 'text-green-600'
      : 'text-red-600'
    : 'text-gray-500';
  const allLeads = leadOverview?.leads ?? [];
  const recentLeads = allLeads.filter(
    (lead) => (lead.type || 'introduction') === 'introduction',
  );
  const lastLeadDate = recentLeads.length > 0 && recentLeads[0]?.createdAt
    ? new Date(recentLeads[0].createdAt)
    : null;
  const topLeadTypeLabel = topLeadType ? formatTitleCase(topLeadType.label) : '';

  const formatCurrencyValue = (amount, currency = 'USD') => {
    const numericAmount = typeof amount === 'number' ? amount : Number(amount);
    if (!Number.isFinite(numericAmount)) {
      return '—';
    }
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        maximumFractionDigits: 0,
      }).format(numericAmount);
    } catch (error) {
      return numericAmount.toLocaleString();
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // If landed via /edit-advisor-profile, open the Settings tab by default
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location?.pathname === '/edit-advisor-profile') {
      setActiveTab('settings');
    }
  }, []);

  // Read tab from query string (?tab=leads|overview|settings)
  const location = useLocation();
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      if (tab && ['leads','overview','settings'].includes(tab)) {
        setActiveTab(tab);
      }
    } catch {}
  }, [location.search]);

  useEffect(() => {
    if (activeTab === 'leads' && !hasLoadedLeads) {
      fetchLeadOverview();
    }
  }, [activeTab, hasLoadedLeads]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/advisor-login');
        return;
      }

      // Get user profile
      const userRes = await axios.get(`${API_CONFIG.BACKEND_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (userRes.data.role !== 'advisor') {
        navigate('/seller-login');
        return;
      }

      setUser(userRes.data);

      // Get advisor profile from database
      try {
        const profileRes = await axios.get(`${API_CONFIG.BACKEND_URL}/api/advisors/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const p = profileRes.data || {};
        // Normalize industries/geographies to arrays, including single-item comma payloads
        const norm = (val) => {
          if (Array.isArray(val)) {
            if (val.length === 1 && typeof val[0] === 'string' && val[0].includes(',')) {
              return val[0].split(',').map(s => s.trim()).filter(Boolean);
            }
            return val;
          }
          if (typeof val === 'string') {
            return val.split(',').map(s => s.trim()).filter(Boolean);
          }
          return [];
        };
        p.industries = norm(p.industries);
        p.geographies = norm(p.geographies);
        // Ensure revenueRange numbers
        if (p.revenueRange) {
          if (p.revenueRange.min !== undefined) p.revenueRange.min = Number(p.revenueRange.min);
          if (p.revenueRange.max !== undefined) p.revenueRange.max = Number(p.revenueRange.max);
        }
        setProfile(p);
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

  const fetchLeadOverview = async (force = false) => {
    if (leadsLoading && !force) return;
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      setLeadsLoading(true);
      setLeadError('');
      const response = await axios.get(`${API_CONFIG.BACKEND_URL}/api/advisors/leads?_=${Date.now()}` , {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeadOverview(response.data);
      setHasLoadedLeads(true);
    } catch (error) {
      console.error('Error fetching lead overview:', error);
      setLeadError(error.response?.data?.message || 'Unable to load leads right now.');
    } finally {
      setLeadsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await axios.post(`${API_CONFIG.BACKEND_URL}/api/auth/logout`, {}, {
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

  // =================== Industry Chooser ===================
  const IndustryChooser = ({ selected, onChange }) => {
    const [query, setQuery] = useState("");
    const [expandedSectors, setExpandedSectors] = useState({});
    const industryData = getIndustryData();

    const filterSectors = (sectors, currentQuery) => {
      if (!currentQuery) return sectors;
      const lowerCaseQuery = currentQuery.toLowerCase();
      return sectors.filter(sector => {
        const sectorMatches = sector.name.toLowerCase().includes(lowerCaseQuery);
        const groupMatches = sector.industryGroups.some(group => 
          group.name.toLowerCase().includes(lowerCaseQuery)
        );
        return sectorMatches || groupMatches;
      });
    };

    const filteredSectors = filterSectors(industryData.sectors, query);

    // Handler for sector checkbox
    const handleSectorToggle = (sector) => {
      const sectorName = sector.name;
      const allGroupNames = sector.industryGroups.map(group => group.name);
      const isSelected = selected.includes(sectorName);
      
      let newSelected;
      if (isSelected) {
        newSelected = selected.filter(
          item => item !== sectorName && !allGroupNames.includes(item)
        );
      } else {
        newSelected = [
          ...selected.filter(
            item => item !== sectorName && !allGroupNames.includes(item)
          ),
          sectorName,
          ...allGroupNames,
        ];
      }
      onChange([...new Set(newSelected)]);
    };

    // Handler for industry group checkbox
    const handleGroupToggle = (group) => {
      const groupName = group.name;
      const isSelected = selected.includes(groupName);
      
      let newSelected;
      if (isSelected) {
        newSelected = selected.filter(item => item !== groupName);
      } else {
        newSelected = [...selected, groupName];
      }
      onChange([...new Set(newSelected)]);
    };

    return (
      <div className="w-full">
        <div className="relative mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Industry Sectors"
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-gray-700"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto">
          {filteredSectors.length > 0 ? (
            <div className="space-y-2">
              {filteredSectors.map((sector) => (
                <div key={sector.id} className="border-b border-gray-100 pb-1">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`sector-${sector.id}`}
                      checked={selected.includes(sector.name)}
                      onChange={() => handleSectorToggle(sector)}
                      className="mr-2 h-4 w-4 text-primary focus:ring-primary form-checkbox border-gray-300 rounded transition-colors duration-200"
                    />
                    <div
                      className="flex items-center cursor-pointer flex-1"
                      onClick={() =>
                        setExpandedSectors(prev => ({
                          ...prev,
                          [sector.id]: !prev[sector.id],
                        }))
                      }
                    >
                      {expandedSectors[sector.id] ? (
                        <FaChevronDown className="h-4 w-4 mr-1 text-gray-600" />
                      ) : (
                        <FaChevronRight className="h-4 w-4 mr-1 text-gray-600" />
                      )}
                      <label htmlFor={`sector-${sector.id}`} className="text-gray-700 cursor-pointer font-medium">
                        {sector.name}
                      </label>
                    </div>
                  </div>
                  {expandedSectors[sector.id] && (
                    <div className="ml-6 mt-1 space-y-1">
                      {sector.industryGroups.map((group) => (
                        <div key={group.id} className="pl-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`group-${group.id}`}
                              checked={selected.includes(group.name)}
                              onChange={() => handleGroupToggle(group)}
                              className="mr-2 h-4 w-4 text-primary focus:ring-primary form-checkbox border-gray-300 rounded transition-colors duration-200"
                            />
                            <label
                              htmlFor={`group-${group.id}`}
                              className="text-gray-700 cursor-pointer text-sm"
                            >
                              {group.name}
                            </label>
                          </div>
                          {group.description && (
                            <div className="text-xs text-gray-500 italic mt-1 ml-6">
                              {group.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">
              No results found for "{query}".
            </p>
          )}
        </div>
      </div>
    );
  };

  // =================== Geography Chooser ===================
  const GeographyChooser = ({ selected, onChange }) => {
    const [query, setQuery] = useState("");
    const [expandedCountries, setExpandedCountries] = useState({});

    // Get all countries and filter based on search
    let allCountries = Country.getAllCountries().filter((country) => {
      const countryMatch = country.name.toLowerCase().includes(query.toLowerCase());
      const states = State.getStatesOfCountry(country.isoCode);
      const stateMatch = states.some(state => state.name.toLowerCase().includes(query.toLowerCase()));
      return countryMatch || stateMatch;
    });

    // Priority countries (United States, Canada, Mexico)
    const priorityCountries = ["United States", "Canada", "Mexico"];
    const priority = allCountries.filter(c => priorityCountries.includes(c.name));
    const rest = allCountries.filter(c => !priorityCountries.includes(c.name));
    allCountries = [...priority, ...rest];

    // Handler for country checkbox
    const handleCountryToggle = (country) => {
      const countryName = country.name;
      const states = State.getStatesOfCountry(country.isoCode);
      const allStateNames = states.map(state => `${country.name} > ${state.name}`);
      const isSelected = selected.includes(countryName);
      
      let newSelected;
      if (isSelected) {
        newSelected = selected.filter(
          item => item !== countryName && !allStateNames.includes(item)
        );
      } else {
        newSelected = [
          ...selected.filter(
            item => item !== countryName && !allStateNames.includes(item)
          ),
          countryName,
          ...allStateNames,
        ];
      }
      onChange([...new Set(newSelected)]);
    };

    // Handler for state checkbox
    const handleStateToggle = (country, state) => {
      const stateName = `${country.name} > ${state.name}`;
      const isSelected = selected.includes(stateName);
      
      let newSelected;
      if (isSelected) {
        newSelected = selected.filter(item => item !== stateName);
      } else {
        newSelected = [...selected, stateName];
      }
      onChange([...new Set(newSelected)]);
    };

    return (
      <div className="w-full">
        <div className="relative mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Geographies"
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-gray-700"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto">
          <div className="space-y-2">
            {allCountries.map((country) => {
              let states = State.getStatesOfCountry(country.isoCode);
              
              // Filter US states to exclude territories
              if (country.name === "United States") {
                const contiguous = [
                  "Alabama","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
                ];
                states = states.filter(state => contiguous.includes(state.name) || ["Hawaii","Alaska"].includes(state.name));
              }
              
              return (
                <div key={country.isoCode} className="border-b border-gray-100 pb-1">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`geo-${country.isoCode}`}
                      checked={selected.includes(country.name)}
                      onChange={() => handleCountryToggle(country)}
                      className="mr-2 h-4 w-4 text-primary focus:ring-primary form-checkbox border-gray-300 rounded transition-colors duration-200"
                    />
                    <div
                      className="flex items-center cursor-pointer flex-1"
                      onClick={() =>
                        setExpandedCountries(prev => ({
                          ...prev,
                          [country.isoCode]: !prev[country.isoCode],
                        }))
                      }
                    >
                      {expandedCountries[country.isoCode] ? (
                        <FaChevronDown className="h-4 w-4 mr-1 text-gray-600" />
                      ) : (
                        <FaChevronRight className="h-4 w-4 mr-1 text-gray-600" />
                      )}
                      <label htmlFor={`geo-${country.isoCode}`} className="text-gray-700 cursor-pointer font-medium">
                        {country.name}
                      </label>
                    </div>
                  </div>
                  {expandedCountries[country.isoCode] && (
                    <div className="ml-6 mt-1 space-y-1">
                      {states
                        .filter(state =>
                          query.trim() === '' ||
                          country.name.toLowerCase().includes(query.toLowerCase()) ||
                          state.name.toLowerCase().includes(query.toLowerCase())
                        )
                        .map((state) => (
                          <div key={state.isoCode} className="pl-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`geo-${country.isoCode}-${state.isoCode}`}
                                checked={selected.includes(`${country.name} > ${state.name}`)}
                                onChange={() => handleStateToggle(country, state)}
                                className="mr-2 h-4 w-4 text-primary focus:ring-primary form-checkbox border-gray-300 rounded transition-colors duration-200"
                              />
                              <label
                                htmlFor={`geo-${country.isoCode}-${state.isoCode}`}
                                className="text-gray-700 cursor-pointer text-sm"
                              >
                                {state.name}
                              </label>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    companyName: Yup.string().required("Company name is required"),
    phone: Yup.string().required("Phone is required"),
    website: Yup.string()
      .required("Website is required")
      .test('url', 'Invalid URL format', function(value) {
        if (!value) return false;
        // Allow various URL formats
        const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?(\/.*)?(\?.*)?(#.*)?$/;
        return urlPattern.test(value);
      }),
    industries: Yup.array().min(1, "Select at least one industry"),
    geographies: Yup.array().min(1, "Select at least one geography"),
    yearsExperience: Yup.number().min(1).required("Years of experience is required"),
    numberOfTransactions: Yup.number().min(0).required("Number of transactions is required"),
    currency: Yup.string().required("Currency is required"),
    description: Yup.string().required("Description is required"),
    testimonials: Yup.array()
      .of(
        Yup.object().shape({
          clientName: Yup.string().trim().required('Client name is required'),
          testimonial: Yup.string().trim().required('Testimonial is required'),
        }),
      )
      .length(5, 'Exactly 5 testimonials are required'),
    revenueRange: Yup.object().shape({
      min: Yup.number().required("Minimum revenue is required"),
      max: Yup.number().required("Maximum revenue is required"),
    }),
  });

  const [logoFile, setLogoFile] = useState(null);
  const [introVideoFile, setIntroVideoFile] = useState(null);
  const [introVideoPreview, setIntroVideoPreview] = useState('');

  const ValidationTouched = ({ submitCount, errors, setTouched }) => {
    useEffect(() => {
      if (submitCount > 0 && errors && Object.keys(errors).length) {
        const all = {};
        const walk = (o, p='') => {
          Object.keys(o).forEach(k => { const path = p?`${p}.${k}`:k; if (o[k] && typeof o[k]==='object') walk(o[k], path); else all[path]=true; });
        };
        walk(errors);
        setTouched(all, true);
      }
    }, [submitCount]);
    return null;
  };

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const formData = new FormData();
      formData.append('name', values.name || '');
      formData.append('companyName', values.companyName || '');
      formData.append('phone', values.phone || '');
      formData.append('website', values.website || '');
      formData.append('currency', values.currency || 'USD');
      formData.append('description', values.description || '');
      // Arrays as JSON to ensure backend saves arrays
      formData.append('industries', JSON.stringify(values.industries || []));
      formData.append('geographies', JSON.stringify(values.geographies || []));
      // Numbers and ranges
      formData.append('yearsExperience', String(values.yearsExperience ?? ''));
      formData.append('numberOfTransactions', String(values.numberOfTransactions ?? ''));
      if (values.revenueRange) {
        formData.append('revenueRange', JSON.stringify({
          min: values.revenueRange.min || 0,
          max: values.revenueRange.max || 0,
        }));
      }
      
      if (!logoFile && !profile?.logoUrl) {
        toast.error('Company logo is required');
        setSubmitting(false);
        return;
      }
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      if (introVideoFile) {
        formData.append('introVideo', introVideoFile);
      }
      
      const sanitizedTestimonials = (values.testimonials || []).map((testimonial) => ({
        clientName: testimonial.clientName?.trim() || '',
        testimonial: testimonial.testimonial?.trim() || '',
        pdfUrl: testimonial.existingPdfUrl || undefined,
      }));

      if (
        sanitizedTestimonials.length !== 5 ||
        sanitizedTestimonials.some(
          (testimonial) => !testimonial.clientName || !testimonial.testimonial,
        )
      ) {
        toast.error('Please provide client name and testimonial text for all 5 testimonials');
        setSubmitting(false);
        return;
      }

      formData.append('testimonials', JSON.stringify(sanitizedTestimonials));
      
      await axios.patch(`${API_CONFIG.BACKEND_URL}/api/advisors/profile`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Profile updated successfully!');
      // Refresh profile data
      fetchUserData();
      if (introVideoPreview) {
        URL.revokeObjectURL(introVideoPreview);
        setIntroVideoPreview('');
      }
      setIntroVideoFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
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
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between ${
                  activeTab === "leads"
                    ? "bg-gradient-to-r from-third to-primary text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  setActiveTab("leads");
                  setSidebarOpen(false);
                }}
              >
                <div className="flex items-center space-x-3">
                  <FaChartLine className="w-5 h-5" />
                  <div>
                    <span className="font-medium text-sm">Lead Management</span>
                    <p className="text-xs opacity-70">Manage your leads</p>
                  </div>
                </div>
              </button>

              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between ${
                  activeTab === "overview"
                    ? "bg-gradient-to-r from-third to-primary text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  setActiveTab("overview");
                  setSidebarOpen(false);
                }}
              >
                <div className="flex items-center space-x-3">
                  <FaUser className="w-5 h-5" />
                  <div>
                    <span className="font-medium text-sm">Profile Overview</span>
                    <p className="text-xs opacity-70">View your profile details</p>
                  </div>
                </div>
              </button>

              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                  activeTab === "settings"
                    ? "bg-gradient-to-r from-third to-primary text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  setActiveTab("settings");
                  setSidebarOpen(false);
                }}
              >
                <FaCog className="w-5 h-5" />
                <div>
                  <span className="font-medium text-sm">Advisor profile</span>
                  <p className="text-xs opacity-70">Update your information</p>
                </div>
              </button>

              <button
                className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  navigate('/advisor-profile');
                  setSidebarOpen(false);
                }}
              >
                <FaCreditCard className="w-5 h-5" />
                <div>
                  <span className="font-medium text-sm">Subscription Details</span>
                  <p className="text-xs opacity-70">Manage subscription and payments</p>
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
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Advisor Dashboard</h1>
              {user?.subscription?.status === 'canceled' && user?.subscription?.currentPeriodEnd && (
                <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                  Canceled • access until {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const token = localStorage.getItem('access_token');
                        await axios.post(`${API_CONFIG.BACKEND_URL}/api/payment/resume`, {}, { headers: { Authorization: `Bearer ${token}` }});
                        toast.success('Subscription resumed');
                        fetchUserData();
                      } catch {
                        toast.error('Could not resume subscription');
                      }
                    }}
                    className="ml-1 underline hover:opacity-80"
                  >
                    Resume
                  </button>
                </span>
              )}
            </div>
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
              <div className="relative">
                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-primary to-third rounded-full text-white font-bold text-sm shadow-md">
                  {(user?.name || "A").charAt(0)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto space-y-8"
            >
              {/* Welcome Header */}
              <div className="bg-gradient-to-r from-primary via-primary/90 to-third rounded-2xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Hey! {user?.name}!</h1>
                    <p className="text-primary-100 text-lg">Here's your advisor dashboard overview</p>
                  </div>
                  <div className="hidden md:block">
                    {profile?.logoUrl ? (
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center p-2">
                        <img
                          src={profile.logoUrl}
                          alt="Company Logo"
                          className="w-full h-full object-contain rounded-full"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                        <FaUser className="w-10 h-10 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              {profile && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Experience</p>
                        <p className="text-2xl font-bold text-gray-900">{profile.yearsExperience} years</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FaCalendarAlt className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Subscription Glimpse */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Subscription</p>
                        <p className="text-sm text-gray-900">
                          {user?.isSubscriptionActive ? 'Active' : 'Inactive'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(() => {
                            const sub = user?.subscription || {};
                            const now = new Date();
                            const start = sub.currentPeriodStart ? new Date(sub.currentPeriodStart) : null;
                            const end = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
                            // If start is in the future (next cycle), the current cycle ends at start; else ends at end
                            const displayEnd = start && start > now ? start : end;
                            return `Ends: ${displayEnd ? displayEnd.toLocaleDateString() : '—'}`;
                          })()}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/advisor-profile')}
                        className="px-3 py-2 text-xs rounded-md bg-primary text-white hover:opacity-90"
                      >
                        Manage
                      </button>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Transactions</p>
                        <p className="text-2xl font-bold text-gray-900">{profile.numberOfTransactions}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <FaChartLine className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Industries</p>
                        <p className="text-2xl font-bold text-gray-900">{profile.industries?.length || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FaIndustry className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Geographies</p>
                        <p className="text-2xl font-bold text-gray-900">{profile.geographies?.length || 0}</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <FaMapMarkerAlt className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Profile Information Cards */}
              {profile && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Company Information */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <FaBuilding className="mr-3 text-primary" />
                      Company Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FaBuilding className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Company Name</p>
                          <p className="text-lg font-semibold text-gray-900">{profile.companyName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FaPhone className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <p className="text-lg text-gray-900">{profile.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FaGlobe className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Website</p>
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-lg text-primary hover:text-third transition-colors">
                            {profile.website}
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Revenue & Performance */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <FaDollarSign className="mr-3 text-primary" />
                     Revenue Range and Performance
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-green-700 mb-1">Revenue Range</p>
                        <p className="text-xl font-bold text-green-900">
                          {profile.currency} {profile.revenueRange?.min?.toLocaleString()} - {profile.revenueRange?.max?.toLocaleString()}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-900">{profile.yearsExperience}</p>
                          <p className="text-sm text-blue-700">Years Experience</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-900">{profile.numberOfTransactions}</p>
                          <p className="text-sm text-purple-700">Transactions</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Expertise Areas */}
              {profile && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <FaIndustry className="mr-3 text-primary" />
                      Industries
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(showAllIndustries ? profile.industries : (profile.industries || []).slice(0, 10))?.map((industry, index) => (
                        <span key={index} className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium border border-blue-200">
                          {industry}
                        </span>
                      ))}
                    </div>
                    {(profile.industries?.length || 0) > 10 && (
                      <div className="pt-3">
                        <button
                          type="button"
                          onClick={() => setShowAllIndustries(v => !v)}
                          className="text-sm font-semibold text-primary hover:text-third"
                        >
                          {showAllIndustries ? 'Show less' : `Show ${profile.industries.length - 10} more`}
                        </button>
                      </div>
                    )}
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <FaMapMarkerAlt className="mr-3 text-primary" />
                      Geographies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.geographies?.map((geography, index) => (
                        <span key={index} className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium border border-green-200">
                          {geography}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Testimonials */}
              {profile?.testimonials && profile.testimonials.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FaQuoteLeft className="mr-3 text-primary" />
                    Client Testimonials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profile.testimonials.map((testimonial, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <FaUser className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">{testimonial.clientName}</h4>
                            <p className="text-gray-600 text-sm italic mb-3">"{testimonial.testimonial}"</p>
                            {testimonial.pdfUrl && (
                              <a 
                                href={testimonial.pdfUrl} 
                                download
                                className="inline-flex items-center px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary/90 transition-colors"
                              >
                                <FaFilePdf className="mr-1" />
                                Download PDF
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'leads' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto space-y-8"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <FaChartLine className="mr-3 text-primary" />
                      Lead Management
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Manage your lead preferences and keep an eye on performance.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {leadError && (
                      <span className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-lg">
                        {leadError}
                      </span>
                    )}
                    <button
                      onClick={() => fetchLeadOverview(true)}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={leadsLoading}
                    >
                      {leadsLoading ? 'Refreshing…' : 'Refresh'}
                    </button>
                  </div>
                </div>
                {profile && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Lead Reception Status</h3>
                        <p className="text-gray-600">
                          {profile.sendLeads ? (
                            <span className="text-green-700">✅ You are currently receiving new leads from sellers</span>
                          ) : (
                            <span className="text-yellow-700">⏸️ Lead delivery is currently paused</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Toggle this setting to control whether you receive new leads.
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`text-sm font-medium ${profile.sendLeads ? 'text-green-600' : 'text-gray-500'}`}>
                          {profile.sendLeads ? 'Active' : 'Paused'}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('access_token');
                              await axios.patch(
                                `${API_CONFIG.BACKEND_URL}/api/advisors/profile/pause-leads`,
                                { sendLeads: !profile.sendLeads },
                                { headers: { Authorization: `Bearer ${token}` } }
                              );
                              toast.success(`Leads ${!profile.sendLeads ? 'resumed' : 'paused'} successfully!`);
                              await fetchUserData();
                              setHasLoadedLeads(false);
                              await fetchLeadOverview(true);
                            } catch (error) {
                              toast.error('Failed to update lead status');
                            }
                          }}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            profile.sendLeads ? 'bg-primary' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                              profile.sendLeads ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Leads</p>
                      <p className="text-3xl font-bold text-gray-900">{totalLeads}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {lastLeadDate ? `Last lead on ${lastLeadDate.toLocaleDateString()}` : 'Awaiting first lead'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaUser className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">This Month</p>
                      <p className="text-3xl font-bold text-gray-900">{leadsThisMonth}</p>
                      <p className={`text-sm mt-1 ${monthDeltaColor}`}>{monthDeltaLabel}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <FaChartLine className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">This Week</p>
                      <p className="text-3xl font-bold text-gray-900">{leadsThisWeek}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {topLeadType ? `${topLeadType.count} ${topLeadTypeLabel} leads overall` : 'No lead type data yet'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FaDollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </motion.div>
              </div>
              {monthlyTrend.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Lead Trend</h3>
                  <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {monthlyTrend.map((entry, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">{entry.month}</p>
                        <p className="text-xl font-semibold text-gray-900">{entry.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Recent Leads</h3>
                    <p className="text-gray-600 text-sm mt-1">Your latest lead opportunities</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {Math.min(recentLeads.length, 10)} of {totalLeads} leads
                  </div>
                </div>
                <div className="p-6">
                  {leadsLoading ? (
                    <div className="py-12 text-center text-gray-500 text-sm">Loading leads…</div>
                  ) : recentLeads.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Seller</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Industry</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Geography</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Revenue</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Phone</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Website</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Received</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {recentLeads.slice(0, 10).map((lead) => {
                            const seller = (lead.seller && typeof lead.seller === 'object')
                              ? lead.seller
                              : (lead.sellerId && typeof lead.sellerId === 'object')
                                ? lead.sellerId
                                : {};
                            const websiteUrl = seller.website
                              ? seller.website.startsWith('http')
                                ? seller.website
                                : `https://${seller.website}`
                              : '';
                            const revenueText = formatCurrencyValue(
                              seller.annualRevenue,
                              seller.currency,
                            );
                            const contactEmail = seller.contactEmail || seller.email;
                            return (
                              <tr key={lead._id}>
                                <td className="px-4 py-3 text-gray-900 font-medium">
                                  <div className="flex flex-col">
                                    <span>{seller.companyName || 'Unknown seller'}</span>
                                    {seller.contactName && (
                                      <span className="text-xs text-gray-500 font-normal">
                                        {seller.contactName}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{seller.industry || '—'}</td>
                                <td className="px-4 py-3 text-gray-600">{seller.geography || '—'}</td>
                                <td className="px-4 py-3 text-gray-600">{revenueText}</td>
                                <td className="px-4 py-3 text-gray-600">
                                  {contactEmail ? (
                                    <a
                                      href={`mailto:${contactEmail}`}
                                      className="text-primary hover:text-third underline"
                                    >
                                      {contactEmail}
                                    </a>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {seller.phone ? (
                                    <a
                                      href={`tel:${seller.phone}`}
                                      className="text-primary hover:text-third"
                                    >
                                      {seller.phone}
                                    </a>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {websiteUrl ? (
                                    <a
                                      href={websiteUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:text-third underline"
                                    >
                                      {websiteUrl}
                                    </a>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUser className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        When sellers match your expertise and criteria, their leads will appear here. Make sure your profile is complete and lead reception is enabled.
                      </p>
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => setActiveTab('settings')}
                          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                        >
                          Update Profile
                        </button>
                        {profile && !profile.sendLeads && (
                          <button
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem('access_token');
                                await axios.patch(
                                  `${API_CONFIG.BACKEND_URL}/api/advisors/profile/pause-leads`,
                                  { sendLeads: true },
                                  { headers: { Authorization: `Bearer ${token}` } }
                                );
                                toast.success('Lead reception enabled!');
                                await fetchUserData();
                                setHasLoadedLeads(false);
                                await fetchLeadOverview(true);
                              } catch (error) {
                                toast.error('Failed to enable leads');
                              }
                            }}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            Enable Leads
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && profile && (
            <div className="max-w-6xl mx-auto">
              <Formik
                enableReinitialize
                initialValues={{
                  name: profile.name || user?.name || "",
                  companyName: profile.companyName || "",
                  phone: profile.phone || "",
                  website: profile.website || "",
                  industries: profile.industries || [],
                  geographies: profile.geographies || [],
                  yearsExperience: profile.yearsExperience || "",
                  numberOfTransactions: profile.numberOfTransactions || "",
                  currency: profile.currency || "USD",
                  description: profile.description || "",
                  testimonials: normalizeTestimonials(profile.testimonials),
                  revenueRange: {
                    min: profile.revenueRange?.min || "",
                    max: profile.revenueRange?.max || "",
                  },
                }}
                validationSchema={validationSchema}
                onSubmit={onSubmit}
              >
                {({ isSubmitting, values, setFieldValue, submitCount, errors, setTouched }) => (
                  <Form className="space-y-8" key={JSON.stringify(profile?.industries) + '|' + JSON.stringify(profile?.geographies)}>
                    {submitCount > 0 && Object.keys(errors || {}).length > 0 && (
                      <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700">
                        Please fix {Object.keys(errors).length} highlighted field{Object.keys(errors).length>1?'s':''}.
                      </div>
                    )}
                    <ValidationTouched submitCount={submitCount} errors={errors} setTouched={setTouched} />
                    {/* Personal Information */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <FaUser className="mr-3 text-primary" />
                        Personal Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                          <Field
                            name="name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                      </div>
                    </div>

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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Industries
                          </label>
                          <IndustryChooser
                            selected={values.industries}
                            onChange={(val) => setFieldValue("industries", val)}
                          />
                          <ErrorMessage name="industries" component="div" className="text-red-500 text-sm mt-2" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Geographies
                          </label>
                          <GeographyChooser
                            selected={values.geographies}
                            onChange={(val) => setFieldValue("geographies", val)}
                          />
                          <ErrorMessage name="geographies" component="div" className="text-red-500 text-sm mt-2" />
                        </div>
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
                                <option value="USD">US Dollar (USD)</option>
                                <option value="EUR">Euro (EUR)</option>
                                <option value="JPY">Japanese Yen (JPY)</option>
                                <option value="GBP">British Pound Sterling (GBP)</option>
                                <option value="CNY">Chinese Yuan/Renminbi (CNY)</option>
                                <option value="AUD">Australian Dollar (AUD)</option>
                                <option value="CAD">Canadian Dollar (CAD)</option>
                                <option value="CHF">Swiss Franc (CHF)</option>
                                <option value="HKD">Hong Kong Dollar (HKD)</option>
                                <option value="SGD">Singapore Dollar (SGD)</option>
                                <option value="SEK">Swedish Krona (SEK)</option>
                                <option value="NOK">Norwegian Krone (NOK)</option>
                                <option value="NZD">New Zealand Dollar (NZD)</option>
                                <option value="MXN">Mexican Peso (MXN)</option>
                                <option value="ZAR">South African Rand (ZAR)</option>
                                <option value="TRY">Turkish Lira (TRY)</option>
                                <option value="BRL">Brazilian Real (BRL)</option>
                                <option value="KRW">South Korean Won (KRW)</option>
                                <option value="INR">Indian Rupee (INR)</option>
                                <option value="RUB">Russian Ruble (RUB)</option>
                              </select>
                            )}
                          </Field>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Revenue</label>
                          <Field name="revenueRange.min">
                            {({ field, form }) => (
                              <input
                                {...field}
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                onChange={(e) => {
                                  const value = e.target.value.replace(/,/g, '');
                                  if (value === '' || /^\d+$/.test(value)) {
                                    form.setFieldValue(field.name, value);
                                  }
                                }}
                                value={field.value ? Number(field.value).toLocaleString() : ''}
                              />
                            )}
                          </Field>
                          <ErrorMessage name="revenueRange.min" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Revenue</label>
                          <Field name="revenueRange.max">
                            {({ field, form }) => (
                              <input
                                {...field}
                                type="text"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                onChange={(e) => {
                                  const value = e.target.value.replace(/,/g, '');
                                  if (value === '' || /^\d+$/.test(value)) {
                                    form.setFieldValue(field.name, value);
                                  }
                                }}
                                value={field.value ? Number(field.value).toLocaleString() : ''}
                              />
                            )}
                          </Field>
                          <ErrorMessage name="revenueRange.max" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                      </div>
                    </div>

                    {/* Description*/}
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

                      </div>
                    </div>

                    {/* Logo Upload */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <FaFileAlt className="mr-3 text-primary" />
                        Company Logo
                      </h3>
                      
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-full max-w-md">
                          {/* Show existing logo if available */}
                          {profile.logoUrl && !logoFile && (
                            <div className="mb-4">
                              <div className="flex justify-center mb-2">
                                <img
                                  src={profile.logoUrl}
                                  alt="Current Logo"
                                  className="max-w-32 max-h-32 object-contain rounded-lg border border-gray-200 shadow-sm"
                                />
                              </div>
                              <p className="text-sm text-gray-600 text-center">Current Logo</p>
                            </div>
                          )}
                          
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setLogoFile(file);
                              }
                            }}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label
                            htmlFor="logo-upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer bg-white hover:bg-primary/5 transition-all duration-200"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <FaFileAlt className="w-8 h-8 mb-4 text-primary" />
                              <p className="mb-2 text-sm text-gray-700">
                                <span className="font-semibold">Click to {profile.logoUrl ? 'change' : 'upload'}</span> company logo
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                            </div>
                          </label>
                          
                          {logoFile && (
                            <div className="mt-4 space-y-3">
                              <div className="flex justify-center">
                                <img
                                  src={URL.createObjectURL(logoFile)}
                                  alt="New Logo Preview"
                                  className="max-w-32 max-h-32 object-contain rounded-lg border border-gray-200 shadow-sm"
                                />
                              </div>
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center">
                                  <FaUser className="text-green-500 mr-2" />
                                  <span className="text-sm text-green-700 font-medium">
                                    {logoFile.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Introduction Video Upload */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <FaFileAlt className="mr-3 text-primary" />
                        Advisor Introduction Video (optional)
                      </h3>

                      <div className="flex flex-col items-center justify-center">
                        <div className="w-full max-w-xl">
                          {/* Existing video preview if available and no new file */}
                          {profile.introVideoUrl && !introVideoFile && (
                            <div className="mb-4">
                              <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                <video src={profile.introVideoUrl} controls className="w-full h-full object-contain bg-black" />
                              </div>
                              <p className="text-sm text-gray-600 mt-2 text-center">Current intro video</p>
                            </div>
                          )}

                          <input
                            type="file"
                            accept="video/mp4,video/quicktime,video/webm"
                            id="intro-video-upload"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (!file.type.startsWith('video/')) {
                                toast.error('Please select a valid video file (MP4, MOV, WEBM).');
                                return;
                              }
                              if (file.size > 200 * 1024 * 1024) {
                                toast.error('Video must be 200MB or smaller.');
                                return;
                              }
                              if (introVideoPreview) {
                                URL.revokeObjectURL(introVideoPreview);
                              }
                              setIntroVideoFile(file);
                              setIntroVideoPreview(URL.createObjectURL(file));
                            }}
                          />
                          <label
                            htmlFor="intro-video-upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer bg-white hover:bg-primary/5 transition-all duration-200"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <FaFileAlt className="w-8 h-8 mb-2 text-primary" />
                              <p className="mb-1 text-sm text-gray-700">
                                <span className="font-semibold">Click to {profile.introVideoUrl ? 'change' : 'upload'}</span> intro video
                              </p>
                              <p className="text-xs text-gray-500">MP4, MOV, or WEBM • up to 200MB</p>
                            </div>
                          </label>

                          {introVideoFile && (
                            <div className="mt-4 space-y-3">
                              {introVideoPreview && (
                                <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                  <video src={introVideoPreview} controls className="w-full h-full object-contain bg-black" />
                                </div>
                              )}
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                                <div className="flex items-center">
                                  <FaUser className="text-blue-500 mr-2" />
                                  <span className="text-sm text-blue-800 font-medium">{introVideoFile.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (introVideoPreview) URL.revokeObjectURL(introVideoPreview);
                                    setIntroVideoFile(null);
                                    setIntroVideoPreview('');
                                  }}
                                  className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Testimonials */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <FaQuoteLeft className="mr-3 text-primary" />
                        Client Testimonials
                      </h3>
                      
                      <div className="space-y-4">
                        {values.testimonials.map((testimonial, index) => (
                          <div key={index} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-700">Testimonial {index + 1}</h4>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                                <Field
                                  name={`testimonials[${index}].clientName`}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <ErrorMessage
                                  name={`testimonials[${index}].clientName`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>
                              
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial</label>
                                <Field
                                  as="textarea"
                                  name={`testimonials[${index}].testimonial`}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                                <ErrorMessage
                                  name={`testimonials[${index}].testimonial`}
                                  component="div"
                                  className="text-red-500 text-xs mt-1"
                                />
                              </div>
                              
                              {/* <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">PDF Document</label>
                                {testimonial.existingPdfUrl && (
                                  <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <FaFilePdf className="text-blue-600 mr-2" />
                                        <span className="text-sm text-blue-800 font-medium">Current PDF</span>
                                      </div>
                                      <a 
                                        href={testimonial.existingPdfUrl} 
                                        download
                                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                      >
                                        Download PDF
                                      </a>
                                    </div>
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      setFieldValue(`testimonials[${index}].pdfFile`, file);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                                />
                              </div> */}
                            </div>
                          </div>
                        ))}
                        
                      </div>

                        <p className="text-xs text-gray-500">
                          Exactly 5 testimonials are required. Update the details in each card to reflect your latest client feedback.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-6">
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
          )}
        </div>
      </main>
    </div>
  );
};

export default AdvisorDashboard;
