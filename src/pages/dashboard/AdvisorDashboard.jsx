import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_CONFIG } from '../../config/api';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { FaUser, FaBuilding, FaPhone, FaGlobe, FaCalendarAlt, FaQuoteLeft, FaFilePdf, FaChartLine, FaDollarSign, FaMapMarkerAlt, FaIndustry, FaCog, FaSignOutAlt, FaEdit, FaToggleOn, FaToggleOff, FaBars, FaTimes, FaChevronDown, FaChevronRight, FaFileAlt, FaSearch, FaCreditCard, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
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
  const [leadFilter, setLeadFilter] = useState('introduction'); // Default to introduction leads

  const handleSubscriptionExpired = (hasPaymentMethod = false) => {
    console.log('handleSubscriptionExpired called with:', { hasPaymentMethod, user });
    
    // Check if user still has access despite canceled subscription
    if (user?.subscription?.status === 'canceled' && user?.subscription?.currentPeriodEnd) {
      const periodEnd = new Date(user.subscription.currentPeriodEnd);
      const now = new Date();
      if (periodEnd > now) {
        console.log('User still has access, not redirecting from handleSubscriptionExpired');
        return;
      }
    }
    
    console.log('TEMPORARILY DISABLED handleSubscriptionExpired redirect');
    return;
    
    // TEMPORARILY DISABLED
    // try {
    //   sessionStorage.setItem('subscriptionExpiredNotice', 'true');
    //   if (hasPaymentMethod) {
    //     sessionStorage.setItem('autoRenewalFailed', 'true');
    //   }
    // } catch (error) {
    //   // ignore storage errors
    // }
    
    // const message = hasPaymentMethod 
    //   ? 'Your membership has expired and auto-renewal failed. Please update your payment method.'
    //   : 'Your membership has expired. Please renew to regain access.';
    
    // toast.error(message, { id: 'subscription-expired', duration: 6000 });
    
    // const redirectUrl = hasPaymentMethod 
    //   ? '/advisor-change-card?expired=true'
    //   : '/advisor-payments?intent=reactivate';
    
    // setTimeout(() => {
    //   window.location.replace(redirectUrl);
    // }, 2000);
  };

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
  // Filter leads based on selected filter
  const recentLeads = leadFilter === 'all' 
    ? allLeads 
    : allLeads.filter(lead => {
        const leadType = (lead.type || 'introduction').toLowerCase();
        return leadType === leadFilter;
      });
  const directOutreachLeads = recentLeads.filter(
    (lead) => (lead.type || 'introduction') === 'direct-list',
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
      console.log('Fetching lead overview...');
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
        console.error('Error fetching advisor profile:', error);
        if (error.response?.status === 404) {
          // Profile not found - set profile to null but don't redirect from dashboard
          // Only redirect if user is not payment verified
          setProfile(null);
          // Check if user has active subscription or access until period end
          let hasPayment = false;
          
          if (userRes.data.isPaymentVerified) {
            hasPayment = true;
          }
          // Check if subscription is canceled but user has access until period end
          else if (userRes.data.subscription?.status === 'canceled' && userRes.data.subscription?.currentPeriodEnd) {
            const periodEnd = new Date(userRes.data.subscription.currentPeriodEnd);
            const now = new Date();
            hasPayment = periodEnd > now;
          }
          
          if (!hasPayment) {
            console.log('User not payment verified, redirecting to payments');
            navigate('/advisor-payments');
            return;
          }
          // If payment is verified but no profile, user can create profile from dashboard
          console.log('Payment verified but no profile found - user can create profile from dashboard');
        } else {
          // Other errors - log but don't redirect
          console.error('Unexpected error fetching profile:', error.response?.data || error.message);
          setProfile(null);
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
      if (error?.response?.status === 402) {
        // Check if user still has access despite canceled subscription
        if (user?.subscription?.status === 'canceled' && user?.subscription?.currentPeriodEnd) {
          const periodEnd = new Date(user.subscription.currentPeriodEnd);
          const now = new Date();
          if (periodEnd > now) {
            // User still has access, show different error
            setLeadError('Unable to load leads at this time. Please try again later.');
            return;
          }
        }
        
        const hasPaymentMethod = error?.response?.data?.hasPaymentMethod || false;
        handleSubscriptionExpired(hasPaymentMethod);
        return;
      }
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
  const IndustryChooser = ({ selected, onChange, hasError }) => {
    const [query, setQuery] = useState("");
    const [expandedSectors, setExpandedSectors] = useState({});
    const industryData = getIndustryData();

    const filterSectors = (sectors, currentQuery) => {
      if (!currentQuery) return sectors;
      const lowerCaseQuery = currentQuery.toLowerCase();
      return sectors.filter((sector) => {
        const sectorMatches = sector.name.toLowerCase().includes(lowerCaseQuery);
        const groupMatches = sector.industryGroups.some((group) =>
          group.name.toLowerCase().includes(lowerCaseQuery)
        );
        return sectorMatches || groupMatches;
      });
    };

    const filteredSectors = filterSectors(industryData.sectors, query);

    // Handler for industry group checkbox
    const handleGroupToggle = (group) => {
      const groupName = group.name;
      const isSelected = selected.includes(groupName);

      let newSelected;
      if (isSelected) {
        newSelected = selected.filter((item) => item !== groupName);
      } else {
        newSelected = [...selected, groupName];
      }
      onChange([...new Set(newSelected)]);
    };

    // Handler for selecting/deselecting all groups in a sector
    const handleSectorToggle = (sector, checkAll) => {
      const groupNames = sector.industryGroups.map((g) => g.name);
      let newSelected = [...selected];
      if (checkAll) {
        newSelected = [...newSelected, ...groupNames];
      } else {
        newSelected = newSelected.filter((s) => !groupNames.includes(s));
      }
      onChange([...new Set(newSelected)]);
    };

    // remove single selected item (chip)
    const handleRemoveSelected = (name) => {
      onChange(selected.filter((s) => s !== name));
    };

    // small component to support indeterminate parent checkbox
    const SectorItem = ({ sector }) => {
      const ref = React.useRef(null);
      const allSelected = sector.industryGroups.every((g) =>
        selected.includes(g.name)
      );
      const someSelected =
        sector.industryGroups.some((g) => selected.includes(g.name)) &&
        !allSelected;

      React.useEffect(() => {
        if (ref.current) {
          ref.current.indeterminate = someSelected;
        }
      }, [someSelected]);

      return (
        <div key={sector.id} className="pb-1 border-b border-gray-100">
          <div className="flex items-center">
            <div
              className="flex items-center flex-1 cursor-pointer"
              onClick={() =>
                setExpandedSectors((prev) => ({
                  ...prev,
                  [sector.id]: !prev[sector.id],
                }))
              }
            >
              {expandedSectors[sector.id] ? (
                <FaChevronDown className="w-4 h-4 mr-1 text-gray-600" />
              ) : (
                <FaChevronRight className="w-4 h-4 mr-1 text-gray-600" />
              )}
              {/* Parent checkbox */}
              <input
                ref={ref}
                type="checkbox"
                checked={allSelected}
                onChange={(e) => {
                  // prevent toggling expansion when clicking checkbox
                  e.stopPropagation();
                  handleSectorToggle(sector, e.target.checked);
                }}
                className="w-4 h-4 mr-2 transition-colors duration-200 border-gray-300 rounded text-primary focus:ring-primary form-checkbox"
                id={`sector-${sector.id}-selectall`}
                onClick={(e) => e.stopPropagation()}
              />
              <label
                htmlFor={`sector-${sector.id}`}
                className="font-medium text-gray-700 cursor-pointer"
              >
                {sector.name}
              </label>
            </div>
          </div>
          {expandedSectors[sector.id] && (
            <div className="mt-1 ml-6 space-y-1">
              {sector.industryGroups.map((group) => (
                <div key={group.id} className="pl-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`group-${group.id}`}
                      checked={selected.includes(group.name)}
                      onChange={() => handleGroupToggle(group)}
                      className="w-4 h-4 mr-2 transition-colors duration-200 border-gray-300 rounded text-primary focus:ring-primary form-checkbox"
                    />
                    <label
                      htmlFor={`group-${group.id}`}
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {group.name}
                    </label>
                  </div>
                  {group.description && (
                    <div className="mt-1 ml-6 text-xs italic text-gray-500">
                      {group.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="w-full">
        <div className="relative mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Industry Sectors"
            className="w-full py-3 pl-10 pr-4 text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <FaSearch className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
        </div>

        {/* Selected chips row */}
        {selected && selected.length > 0 && (
          <div className="mb-3">
            {/* fixed box so long lists scroll instead of pushing layout */}
            <div className="w-full p-2 overflow-auto bg-white border rounded-md max-h-28 border-primary/10">
              <div className="flex flex-wrap gap-2">
                {selected.map((name) => (
                  <div
                    key={name}
                    className="flex items-center px-3 py-1 text-sm border rounded-full bg-primary/10 text-primary border-primary/20"
                  >
                    <span className="mr-2">{name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSelected(name)}
                      className="ml-1 text-xs font-bold text-primary/80 hover:text-primary"
                      aria-label={`Remove ${name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div
          className={`bg-gray-50 border rounded-lg p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-gray-100 shadow-inner ${
            hasError ? "border-red-500" : "border-primary/20"
          }`}
        >
          {filteredSectors.length > 0 ? (
            <div className="space-y-2">
              {filteredSectors.map((sector) => (
                <SectorItem key={sector.id} sector={sector} />
              ))}
            </div>
          ) : (
            <p className="py-4 text-sm text-center text-gray-500">
              No results found for "{query}".
            </p>
          )}
        </div>
      </div>
    );
  };

  // =================== Geography Chooser ===================
  const GeographyChooser = ({ selected, onChange, hasError }) => {
    const [query, setQuery] = useState("");
    const [expandedCountries, setExpandedCountries] = useState({});

    // Get all countries and filter based on search
    let allCountries = Country.getAllCountries().filter((country) => {
      const countryMatch = country.name
        .toLowerCase()
        .includes(query.toLowerCase());
      const states = State.getStatesOfCountry(country.isoCode);
      const stateMatch = states.some((state) =>
        state.name.toLowerCase().includes(query.toLowerCase())
      );
      return countryMatch || stateMatch;
    });

    // Priority countries (United States, Canada, Mexico)
    const priorityCountries = ["United States", "Canada", "Mexico"];
    const priority = allCountries.filter((c) =>
      priorityCountries.includes(c.name)
    );
    const rest = allCountries.filter((c) => !priorityCountries.includes(c.name));
    allCountries = [...priority, ...rest];

    // Handler for state checkbox
    const handleStateToggle = (country, state) => {
      const stateName = `${country.name} > ${state.name}`;
      const isSelected = selected.includes(stateName);

      let newSelected;
      if (isSelected) {
        newSelected = selected.filter((item) => item !== stateName);
      } else {
        newSelected = [...selected, stateName];
      }
      onChange([...new Set(newSelected)]);
    };

    // Handler for selecting/deselecting all states in a country
    const handleCountryToggle = (country, states, checkAll) => {
      const names = states.map((s) => `${country.name} > ${s.name}`);
      let newSelected = [...selected];
      if (checkAll) {
        newSelected = [...newSelected, ...names];
      } else {
        newSelected = newSelected.filter((s) => !names.includes(s));
      }
      onChange([...new Set(newSelected)]);
    };

    // Handler for toggling a country that has no states (store as "Country Name")
    const handleCountrySingleToggle = (country) => {
      const name = country.name;
      const isSelected = selected.includes(name);
      let newSelected;
      if (isSelected) {
        newSelected = selected.filter((s) => s !== name);
      } else {
        newSelected = [...selected, name];
      }
      onChange([...new Set(newSelected)]);
    };

    // remove single selected geography (chip)
    const handleRemoveSelectedGeo = (name) => {
      onChange(selected.filter((s) => s !== name));
    };
    
    // Small component to render a country with parent checkbox + indeterminate
    const CountryItem = ({ country }) => {
      let states = State.getStatesOfCountry(country.isoCode);

      // Filter US states to exclude territories
      if (country.name === "United States") {
        const contiguous = [
          "Alabama",
          "Arizona",
          "Arkansas",
          "California",
          "Colorado",
          "Connecticut",
          "Delaware",
          "Florida",
          "Georgia",
          "Idaho",
          "Illinois",
          "Indiana",
          "Iowa",
          "Kansas",
          "Kentucky",
          "Louisiana",
          "Maine",
          "Maryland",
          "Massachusetts",
          "Michigan",
          "Minnesota",
          "Mississippi",
          "Missouri",
          "Montana",
          "Nebraska",
          "Nevada",
          "New Hampshire",
          "New Jersey",
          "New Mexico",
          "New York",
          "North Carolina",
          "North Dakota",
          "Ohio",
          "Oklahoma",
          "Oregon",
          "Pennsylvania",
          "Rhode Island",
          "South Carolina",
          "South Dakota",
          "Tennessee",
          "Texas",
          "Utah",
          "Vermont",
          "Virginia",
          "Washington",
          "West Virginia",
          "Wisconsin",
          "Wyoming",
        ];
        states = states.filter(
          (state) =>
            contiguous.includes(state.name) ||
            ["Hawaii", "Alaska"].includes(state.name)
        );
      }

      const ref = React.useRef(null);

      // IMPORTANT: do not treat an empty states array as "all selected"
      const hasStates = states && states.length > 0;
      // if hasStates -> parent represents all children ("Country > State")
      const allSelected =
        hasStates &&
        states.every((s) => selected.includes(`${country.name} > ${s.name}`));
      const someSelected =
        hasStates &&
        states.some((s) => selected.includes(`${country.name} > ${s.name}`)) &&
        !allSelected;
      // if no states, parent checkbox represents selecting the country itself (stored as "Country Name")
      const countrySelected = !hasStates && selected.includes(country.name);

      React.useEffect(() => {
        if (ref.current) {
          ref.current.indeterminate = someSelected;
        }
      }, [someSelected]);

      return (
        <div key={country.isoCode} className="pb-1 border-b border-gray-100">
          <div className="flex items-center">
            <div
              className={`flex items-center flex-1 ${hasStates ? "cursor-pointer" : ""}`}
              onClick={() =>
                hasStates &&
                setExpandedCountries((prev) => ({
                  ...prev,
                  [country.isoCode]: !prev[country.isoCode],
                }))
              }
            >
              {hasStates ? (
                expandedCountries[country.isoCode] ? (
                  <FaChevronDown className="w-4 h-4 mr-1 text-gray-600" />
                ) : (
                  <FaChevronRight className="w-4 h-4 mr-1 text-gray-600" />
                )
              ) : (
                <div className="w-4 h-4 mr-1" /> /* keep spacing for alignment */
              )}

              <input
                ref={ref}
                type="checkbox"
                checked={hasStates ? allSelected : countrySelected}
                onChange={(e) => {
                  e.stopPropagation();
                  if (hasStates) {
                    handleCountryToggle(country, states, e.target.checked);
                  } else {
                    // toggle single country selection
                    handleCountrySingleToggle(country);
                  }
                }}
                className="w-4 h-4 mr-2 transition-colors duration-200 border-gray-300 rounded text-primary focus:ring-primary form-checkbox"
                id={`country-${country.isoCode}-selectall`}
                onClick={(e) => e.stopPropagation()}
              />

              <label
                htmlFor={`country-${country.isoCode}-selectall`}
                className="font-medium text-gray-700 cursor-pointer"
              >
                {country.name}
              </label>
            </div>
          </div>
          {hasStates && expandedCountries[country.isoCode] && (
            <div className="mt-1 ml-6 space-y-1">
              {states
                .filter(
                  (state) =>
                    query.trim() === "" ||
                    country.name
                      .toLowerCase()
                      .includes(query.toLowerCase()) ||
                    state.name.toLowerCase().includes(query.toLowerCase())
                )
                .map((state) => (
                  <div key={state.isoCode} className="pl-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`geo-${country.isoCode}-${state.isoCode}`}
                        checked={selected.includes(
                          `${country.name} > ${state.name}`
                        )}
                        onChange={() => handleStateToggle(country, state)}
                        className="w-4 h-4 mr-2 transition-colors duration-200 border-gray-300 rounded text-primary focus:ring-primary form-checkbox"
                      />
                      <label
                        htmlFor={`geo-${country.isoCode}-${state.isoCode}`}
                        className="text-sm text-gray-700 cursor-pointer"
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
    };

    return (
      <div className="w-full">
        <div className="relative mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Geographies"
            className="w-full py-3 pl-10 pr-4 text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <FaSearch className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
        </div>

        {/* Selected chips row */}
        {selected && selected.length > 0 && (
          <div className="mb-3">
            {/* fixed box so long lists scroll instead of pushing layout */}
            <div className="w-full p-2 overflow-auto bg-white border rounded-md max-h-28 border-primary/10">
              <div className="flex flex-wrap gap-2">
                {selected.map((name) => (
                  <div
                    key={name}
                    className="flex items-center px-3 py-1 text-sm border rounded-full bg-primary/10 text-primary border-primary/20"
                  >
                    <span className="mr-2">{name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSelectedGeo(name)}
                      className="ml-1 text-xs font-bold text-primary/80 hover:text-primary"
                      aria-label={`Remove ${name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div
          className={`bg-gray-50 border rounded-lg p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-gray-100 shadow-inner ${
            hasError ? "border-red-500" : "border-primary/20"
          }`}
        >
          <div className="space-y-2">
            {allCountries.map((country) => (
              <CountryItem key={country.isoCode} country={country} />
            ))}
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

  // Show all validation errors after submit and scroll to first
  const ValidationEffects = () => {
    const { submitCount, errors, setTouched, isSubmitting, setFieldTouched } =
      useFormikContext();
    useEffect(() => {
      if (submitCount > 0 && errors && Object.keys(errors).length) {
        // Walk errors and set touched on each field using setFieldTouched
        const collectPaths = (obj, parent = "") => {
          Object.keys(obj).forEach((k) => {
            const path = parent ? `${parent}.${k}` : k;
            if (obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])) {
              collectPaths(obj[k], path);
            } else if (obj[k] && typeof obj[k] === "object" && Array.isArray(obj[k])) {
              // arrays: iterate indexes
              obj[k].forEach((item, idx) => {
                if (item && typeof item === "object") {
                  collectPaths(item, `${path}.${idx}`);
                } else if (item) {
                  const bracket = `${path}[${idx}]`;
                  // mark array scalar
                  setFieldTouched(bracket, true, true);
                }
              });
            } else {
              // leaf error - convert dotted indices to bracket notation for Formik field names
              const bracket = path.replace(/\.(\d+)/g, "[$1]");
              setFieldTouched(bracket, true, true);
            }
          });
        };

        collectPaths(errors);

        // find first field using both notations (dotted and bracket) and scroll to it
        // create a selector from first error path
        const firstErrorPath = Object.keys(errors)[0];
        if (firstErrorPath && !isSubmitting) {
          // generate candidate selectors
          const dottedToBracket = (p) => p.replace(/\.(\d+)/g, "[$1]");
          const maybeBracket = dottedToBracket(firstErrorPath);
          const maybeDotted = firstErrorPath;
          const selector = `[name="${maybeBracket}"],[name="${maybeDotted}"],[data-field="${maybeBracket}"],[data-field="${maybeDotted}"]`;
          const el = document.querySelector(selector);
          if (el && el.scrollIntoView) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }
    }, [submitCount]);
    return null;
  };

  const ErrorBanner = () => {
    const { submitCount, errors } = useFormikContext();
    const count = (o) => {
      let c = 0;
      const walk = (x) =>
        Object.values(x || {}).forEach((v) => {
          if (v && typeof v === "object") walk(v);
          else c++;
        });
      walk(o);
      return c;
    };
    const ec = count(errors);
    if (submitCount > 0 && ec > 0) {
      return (
        <div className="p-3 mb-4 text-red-700 border border-red-200 rounded bg-red-50">
          Please fix {ec} highlighted field{ec > 1 ? "s" : ""}.
        </div>
      );
    }
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
      formData.append('workedWithCimamplify', values.workedWithCimamplify);
      
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
      
      // Use POST for creating new profile, PATCH for updating existing
      const method = profile ? 'patch' : 'post';
      const url = `${API_CONFIG.BACKEND_URL}/api/advisors/profile`;
      
      await axios[method](url, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Profile updated successfully!');
      // Refresh profile data and redirect to overview
      await fetchUserData();
      navigate('/advisor-dashboard?tab=overview');
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand to-brand-light">
        <div className="w-32 h-32 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
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
          <div className="flex items-center justify-between mb-4 lg:justify-center">
            <img
              src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop,q=95/mk3JaNVZEltBD9g4/logo-transparency-mnlJLXr4jxIOR470.png"
              alt="Advisor Chooser"
              className="object-contain w-auto h-8"
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md lg:hidden hover:bg-gray-100"
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
              <p className="px-3 mb-3 text-xs font-medium tracking-wider text-gray-500 uppercase">Main Menu</p>

              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between ${
                  activeTab === "leads"
                    ? "bg-gradient-to-r from-third to-primary text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  console.log('Lead Management clicked');
                  setActiveTab("leads");
                  setSidebarOpen(false);
                }}
              >
                <div className="flex items-center space-x-3">
                  <FaChartLine className="w-5 h-5" />
                  <div>
                    <span className="text-sm font-medium">Lead Management</span>
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
                    <span className="text-sm font-medium">Profile Overview</span>
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
                  <span className="text-sm font-medium">Advisor profile</span>
                  <p className="text-xs opacity-70">Update your information</p>
                </div>
              </button>

              <button
                className="flex items-center w-full px-4 py-3 space-x-3 text-left text-gray-700 transition-all duration-200 rounded-lg hover:bg-gray-100"
                onClick={() => {
                  navigate('/advisor-profile');
                  setSidebarOpen(false);
                }}
              >
                <FaCreditCard className="w-5 h-5" />
                <div>
                  <span className="text-sm font-medium">Subscription Details</span>
                  <p className="text-xs opacity-70">Manage subscription and payments</p>
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-6 space-y-4 border-t border-gray-100">
          <button
            className="flex items-center justify-center w-full px-4 py-3 space-x-2 text-red-600 transition-colors duration-200 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-col flex-1 min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200 shadow-sm lg:px-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md lg:hidden hover:bg-gray-100"
            >
              <FaBars className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">Advisor Dashboard</h1>
              {user?.subscription?.status === 'canceled' && user?.subscription?.currentPeriodEnd && (
                <span className="inline-flex items-center gap-2 px-2 py-1 text-xs text-yellow-800 bg-yellow-100 border border-yellow-200 rounded-full">
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
              className="flex items-center gap-3 px-3 py-2 transition-all duration-200 rounded-lg hover:bg-gray-100"
              onClick={() => setProfileDropdownOpen(prev => !prev)}
            >
              <div className="hidden text-right sm:block">
                <div className="flex items-center gap-2">
                  <span className="block text-sm font-semibold text-gray-900">
                    {user?.name || "Loading..."}
                  </span>
                  {profile?.workedWithCimamplify && (
                    <img src="/logo.png" alt="Cimamplify Ventures Partner" className="w-5 h-5" title="Worked with Cimamplify Ventures" />
                  )}
                </div>
                <span className="block text-xs text-gray-500">Advisor Account</span>
              </div>
              <div className="relative">
                <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white rounded-full shadow-md bg-gradient-to-br from-primary to-third">
                  {(user?.name || "A").charAt(0)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto space-y-8 max-w-7xl"
            >
              {!profile && (
                <div className="p-6 text-center bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
                    <FaUser className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900">Advisor Profile Not Found</h3>
                  <p className="max-w-md mx-auto mb-6 text-gray-500">
                    Your advisor profile hasn't been created yet. Complete your profile to start receiving leads and showcase your expertise.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="px-6 py-3 font-medium text-white transition-colors rounded-lg bg-primary hover:bg-primary/90"
                    >
                      Create Profile
                    </button>
                    <button
                      onClick={() => navigate('/advisor-form')}
                      className="px-6 py-3 font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Use Profile Form
                    </button>
                  </div>
                </div>
              )}
              {/* Welcome Header */}
              <div className="p-8 text-white bg-gradient-to-r from-primary via-primary/90 to-third rounded-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="mb-2 text-3xl font-bold">Hey! {user?.name}!</h1>
                    <p className="text-lg text-primary-100">Here's your advisor dashboard overview</p>
                  </div>
                  <div className="hidden md:block">
                    {profile?.logoUrl ? (
                      <div className="flex items-center justify-center w-20 h-20 p-2 rounded-full bg-white/20">
                        <img
                          src={profile.logoUrl}
                          alt="Company Logo"
                          className="object-contain w-full h-full rounded-full"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white/20">
                        <FaUser className="w-10 h-10 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              {profile && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 transition-shadow bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mb-1 text-sm font-medium text-gray-500">Experience</p>
                        <p className="text-2xl font-bold text-gray-900">{profile.yearsExperience} years</p>
                      </div>
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                        <FaCalendarAlt className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Subscription Glimpse */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 transition-shadow bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md md:col-span-2 lg:col-span-1"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mb-1 text-sm font-medium text-gray-500">Subscription</p>
                        <p className="text-sm text-gray-900">
                          {user?.isSubscriptionActive ? 'Active' : 'Inactive'}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
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
                        className="px-3 py-2 text-xs text-white rounded-md bg-primary hover:opacity-90"
                      >
                        Manage
                      </button>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 transition-shadow bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mb-1 text-sm font-medium text-gray-500">Transactions</p>
                        <p className="text-2xl font-bold text-gray-900">{profile.numberOfTransactions}</p>
                      </div>
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                        <FaChartLine className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 transition-shadow bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mb-1 text-sm font-medium text-gray-500">Industries</p>
                        <p className="text-2xl font-bold text-gray-900">{profile.industries?.length || 0}</p>
                      </div>
                      <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                        <FaIndustry className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 transition-shadow bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="mb-1 text-sm font-medium text-gray-500">Geographies</p>
                        <p className="text-2xl font-bold text-gray-900">{profile.geographies?.length || 0}</p>
                      </div>
                      <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                        <FaMapMarkerAlt className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Profile Information Cards */}
              {profile && (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  {/* Company Information */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl"
                  >
                    <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900">
                      <FaBuilding className="mr-3 text-primary" />
                      Company Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                          <FaBuilding className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Company Name</p>
                          <p className="text-lg font-semibold text-gray-900">{profile.companyName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                          <FaPhone className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <p className="text-lg text-gray-900">{profile.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                          <FaGlobe className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Website</p>
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-lg transition-colors text-primary hover:text-third">
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
                    className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl"
                  >
                    <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900">
                      <FaDollarSign className="mr-3 text-primary" />
                     Revenue Range and Performance
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 border border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                        <p className="mb-1 text-sm font-medium text-green-700">Revenue Range</p>
                        <p className="text-xl font-bold text-green-900">
                          {profile.currency} {profile.revenueRange?.min?.toLocaleString()} - {profile.revenueRange?.max?.toLocaleString()}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 text-center rounded-lg bg-blue-50">
                          <p className="text-2xl font-bold text-blue-900">{profile.yearsExperience}</p>
                          <p className="text-sm text-blue-700">Years Experience</p>
                        </div>
                        <div className="p-3 text-center rounded-lg bg-purple-50">
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
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl"
                  >
                    <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900">
                      <FaIndustry className="mr-3 text-primary" />
                      Industries
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(showAllIndustries ? profile.industries : (profile.industries || []).slice(0, 10))?.map((industry, index) => (
                        <span key={index} className="px-3 py-2 text-sm font-medium text-blue-800 bg-blue-100 border border-blue-200 rounded-lg">
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
                    className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl"
                  >
                    <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900">
                      <FaMapMarkerAlt className="mr-3 text-primary" />
                      Geographies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.geographies?.map((geography, index) => (
                        <span key={index} className="px-3 py-2 text-sm font-medium text-green-800 bg-green-100 border border-green-200 rounded-lg">
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
                  className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl"
                >
                  <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900">
                    <FaQuoteLeft className="mr-3 text-primary" />
                    Client Testimonials
                  </h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {profile.testimonials.map((testimonial, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-start space-x-3">
                          <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-primary/10">
                            <FaUser className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="mb-2 font-semibold text-gray-900">{testimonial.clientName}</h4>
                            <p className="mb-3 text-sm italic text-gray-600">"{testimonial.testimonial}"</p>
                            {testimonial.pdfUrl && (
                              <a 
                                href={testimonial.pdfUrl} 
                                download
                                className="inline-flex items-center px-3 py-1 text-xs text-white transition-colors rounded bg-primary hover:bg-primary/90"
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
              className="mx-auto space-y-8 max-w-7xl"
            >
              <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="flex items-center text-2xl font-bold text-gray-900">
                      <FaChartLine className="mr-3 text-primary" />
                      Lead Management
                    </h2>
                    <p className="mt-1 text-gray-600">
                      Manage your lead preferences and keep an eye on performance.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {leadError && (
                      <span className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded-lg bg-red-50">
                        {leadError}
                      </span>
                    )}
                    <button
                      onClick={() => fetchLeadOverview(true)}
                      className="px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={leadsLoading}
                    >
                      {leadsLoading ? 'Refreshing…' : 'Refresh'}
                    </button>
                  </div>
                </div>
                {profile && (
                  <div className="p-6 border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">Lead Reception Status</h3>
                        <p className="text-gray-600">
                          {profile.sendLeads ? (
                            <span className="text-green-700">✅ You are currently receiving new leads from sellers</span>
                          ) : (
                            <span className="text-yellow-700">⏸️ Lead delivery is currently paused</span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
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
                  className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-sm font-medium text-gray-500">Total Leads</p>
                      <p className="text-3xl font-bold text-gray-900">{totalLeads}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {lastLeadDate ? `Last lead on ${lastLeadDate.toLocaleDateString()}` : 'Awaiting first lead'}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                      <FaUser className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-sm font-medium text-gray-500">This Month</p>
                      <p className="text-3xl font-bold text-gray-900">{leadsThisMonth}</p>
                      <p className={`text-sm mt-1 ${monthDeltaColor}`}>{monthDeltaLabel}</p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                      <FaChartLine className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-sm font-medium text-gray-500">This Week</p>
                      <p className="text-3xl font-bold text-gray-900">{leadsThisWeek}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {topLeadType ? `${topLeadType.count} ${topLeadTypeLabel} leads overall` : 'No lead type data yet'}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                      <FaDollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </motion.div>
              </div>
              {monthlyTrend.length > 0 && (
                <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Monthly Lead Trend</h3>
                  <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {monthlyTrend.map((entry, index) => (
                      <div key={index} className="p-3 text-center border border-gray-200 rounded-lg bg-gray-50">
                        <p className="mb-1 text-xs text-gray-500">{entry.month}</p>
                        <p className="text-xl font-semibold text-gray-900">{entry.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-white border border-gray-100 shadow-sm rounded-xl">
                <div className="flex flex-col gap-3 p-6 border-b border-gray-100 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Recent Leads</h3>
                    <p className="mt-1 text-sm text-gray-600">Your latest lead opportunities</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {Math.min(recentLeads.length, 10)} of {leadFilter === 'all' ? totalLeads : recentLeads.length} leads
                  </div>
                </div>
                
                {/* Lead Filter Tabs */}
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex p-1 space-x-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => setLeadFilter('introduction')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        leadFilter === 'introduction'
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Introduction ({allLeads.filter(lead => (lead.type || 'introduction') === 'introduction').length})
                    </button>
                    <button
                      onClick={() => setLeadFilter('direct-list')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        leadFilter === 'direct-list'
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Direct Outreach ({allLeads.filter(lead => (lead.type || 'introduction') === 'direct-list').length})
                    </button>
                    
                  </div>
                </div>
                <div className="p-6">
                  {leadsLoading ? (
                    <div className="py-12 text-sm text-center text-gray-500">Loading leads…</div>
                  ) : recentLeads.length > 0 ? (
                    <div className="overflow-x-auto">
                      {directOutreachLeads.length > 0 && (
                        <div className="px-4 py-3 mb-4 text-xs text-indigo-800 border border-indigo-200 rounded-lg bg-indigo-50 sm:text-sm">
                          {directOutreachLeads.length === 1
                            ? 'One seller chose to reach out directly. Their contact details stay hidden until they request an introduction.'
                            : `${directOutreachLeads.length} sellers chose to reach out directly. Their contact details stay hidden until they request an introduction.`}
                        </div>
                      )}
                      <table className="min-w-full text-sm divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-left text-gray-600">Seller</th>
                            <th className="px-4 py-3 font-semibold text-left text-gray-600">Industry</th>
                            <th className="px-4 py-3 font-semibold text-left text-gray-600">Geography</th>
                            <th className="px-4 py-3 font-semibold text-left text-gray-600">Revenue</th>
                            <th className="px-4 py-3 font-semibold text-left text-gray-600">Email</th>
                            <th className="px-4 py-3 font-semibold text-left text-gray-600">Phone</th>
                            <th className="px-4 py-3 font-semibold text-left text-gray-600">Website</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {recentLeads.slice(0, 10).map((lead) => {
                            const seller = (lead.seller && typeof lead.seller === 'object')
                              ? lead.seller
                              : (lead.sellerId && typeof lead.sellerId === 'object')
                                ? lead.sellerId
                                : {};
                            const leadType = (lead.type || 'introduction').toLowerCase();
                            const isDirectLead = leadType === 'direct-list' || lead.contactHidden;
                            const sellerName = isDirectLead
                              ? 'Seller will reach out directly'
                              : seller.companyName || 'Unknown seller';
                            const contactNameDisplay = !isDirectLead
                              ? seller.contactName
                              : null;
                            const websiteUrl = seller.website
                              ? seller.website.startsWith('http')
                                ? seller.website
                                : `https://${seller.website}`
                              : '';
                            const websiteLabel = seller.website || websiteUrl;
                            const revenueText = formatCurrencyValue(
                              seller.annualRevenue,
                              seller.currency,
                            );
                            const contactEmail = !isDirectLead
                              ? seller.contactEmail || seller.email
                              : null;
                            const phoneNumber = !isDirectLead ? seller.phone : null;
                            return (
                              <tr key={lead._id}>
                                <td className="px-4 py-3 font-medium text-gray-900">
                                  <div className="flex flex-col">
                                    <span>{sellerName}</span>
                                    {contactNameDisplay && (
                                      <span className="text-xs font-normal text-gray-500">
                                        {contactNameDisplay}
                                      </span>
                                    )}
                                    {/* {isDirectLead && (
                                      <span className="mt-1 inline-flex items-center gap-1 self-start rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                                        Direct outreach
                                      </span>
                                    )} */}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{seller.industry || '—'}</td>
                                <td className="px-4 py-3 text-gray-600">{seller.geography || '—'}</td>
                                <td className="px-4 py-3 text-gray-600">{revenueText}</td>
                                <td className="px-4 py-3 text-gray-600">
                                  {contactEmail ? (
                                    <a
                                      href={`mailto:${contactEmail}`}
                                      className="underline text-primary hover:text-third"
                                    >
                                      {contactEmail}
                                    </a>
                                  ) : (
                                    <span className={isDirectLead ? 'text-gray-400 italic' : ''}>
                                      {isDirectLead
                                        ? 'Hidden until introduction requested'
                                        : '—'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {phoneNumber ? (
                                    <a
                                      href={`tel:${phoneNumber}`}
                                      className="text-primary hover:text-third"
                                    >
                                      {phoneNumber}
                                    </a>
                                  ) : (
                                    <span className={isDirectLead ? 'text-gray-400 italic' : ''}>
                                      {isDirectLead
                                        ? 'Hidden until introduction requested'
                                        : '—'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                  {websiteUrl && !isDirectLead ? (
                                    <a
                                      href={websiteUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline text-primary hover:text-third"
                                    >
                                      {websiteLabel}
                                    </a>
                                  ) : (
                                    <span className={isDirectLead ? 'text-gray-400 italic' : ''}>
                                      {isDirectLead
                                        ? 'Hidden until introduction requested'
                                        : '—'}
                                    </span>
                                  )}
                                </td>
                                {/* <td className="px-4 py-3 text-gray-600">
                                  {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : '—'}
                                </td> */}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
                        <FaUser className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="mb-2 text-lg font-medium text-gray-900">No leads yet</h3>
                      <p className="max-w-md mx-auto mb-6 text-gray-500">
                        When sellers match your expertise and criteria, their leads will appear here. Make sure your profile is complete and lead reception is enabled.
                      </p>
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => setActiveTab('settings')}
                          className="px-6 py-3 font-medium text-white transition-colors rounded-lg bg-primary hover:bg-primary/90"
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
                            className="px-6 py-3 font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
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

          {activeTab === 'settings' && (
            <div className="max-w-6xl mx-auto">
              <Formik
                enableReinitialize
                initialValues={{
                  name: profile?.name || user?.name || "",
                  companyName: profile?.companyName || "",
                  phone: profile?.phone || "",
                  website: profile?.website || "",
                  industries: profile?.industries || [],
                  geographies: profile?.geographies || [],
                  yearsExperience: profile?.yearsExperience || "",
                  numberOfTransactions: profile?.numberOfTransactions || "",
                  currency: profile?.currency || "USD",
                  description: profile?.description || "",
                  testimonials: normalizeTestimonials(profile?.testimonials),
                  revenueRange: {
                    min: profile?.revenueRange?.min || "",
                    max: profile?.revenueRange?.max || "",
                  },
                  workedWithCimamplify: profile?.workedWithCimamplify || false,
                }}
                validationSchema={validationSchema}
                onSubmit={onSubmit}
              >
                {({ isSubmitting, values, setFieldValue, submitCount, errors, setTouched, touched }) => (
                  <Form className="space-y-8" key={JSON.stringify(profile?.industries) + '|' + JSON.stringify(profile?.geographies)}>
                    <ValidationEffects />
                    <ErrorBanner />

                    {/* Personal Information */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl"
                    >
                      <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900">
                        <FaUser className="mr-3 text-primary" />
                        Personal Information
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">Full Name</label>
                          <Field
                            name="name"
                            className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-gray-700 ${
                              errors.name && touched.name
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          <ErrorMessage name="name" component="div" className="mt-1 text-sm text-red-500" />
                        </div>
                      </div>

                      <div className="p-6 mt-6 border border-blue-200 shadow-sm rounded-2xl bg-blue-50">
                        <div className="flex items-start">
                          <Field
                            type="checkbox"
                            name="workedWithCimamplify"
                            id="workedWithCimamplify-edit"
                            className="w-4 h-4 mt-1 border-gray-300 rounded text-primary focus:ring-primary"
                          />
                          <div className="ml-3 text-sm">
                            <label htmlFor="workedWithCimamplify-edit" className="font-bold text-blue-800">
                              Have you ever posted a deal at our sister company, CIM Amplify (www.cimamplify.com)?
                            </label>
                            <p className="text-blue-700">You can change this answer in the future once you have posted.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Company Information */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl"
                    >
                      <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900">
                        <FaBuilding className="mr-3 text-primary" />
                        Company Information
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">Company Name</label>
                          <Field
                            name="companyName"
                            className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-gray-700 ${
                              errors.companyName && touched.companyName
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          <ErrorMessage name="companyName" component="div" className="mt-1 text-sm text-red-500" />
                        </div>

                        <div>
                          <label className="flex items-center block mb-2 text-sm font-medium text-gray-700">
                            <FaPhone className="mr-2 text-primary" />
                            Phone
                          </label>
                          <Field
                            name="phone"
                            className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-gray-700 ${
                              errors.phone && touched.phone
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          <ErrorMessage name="phone" component="div" className="mt-1 text-sm text-red-500" />
                        </div>

                        <div className="md:col-span-2">
                          <label className="flex items-center block mb-2 text-sm font-medium text-gray-700">
                            <FaGlobe className="mr-2 text-primary" />
                            Website
                          </label>
                          <Field
                            name="website"
                            className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-gray-700 ${
                              errors.website && touched.website
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          <ErrorMessage name="website" component="div" className="mt-1 text-sm text-red-500" />
                        </div>
                      </div>
                    </motion.div>

                    {/* Industries & Geographies */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl"
                    >
                      <h3 className="mb-6 text-xl font-semibold text-gray-900">Expertise Areas</h3>
                      
                      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        <div>
                          <label className="block mb-3 text-sm font-medium text-gray-700">
                            Industries
                          </label>
                          <IndustryChooser
                            selected={values.industries}
                            onChange={(val) => setFieldValue("industries", val)}
                            hasError={!!(errors.industries && touched.industries)}
                          />
                          <ErrorMessage name="industries" component="div" className="mt-2 text-sm text-red-500" />
                        </div>

                        <div>
                          <label className="block mb-3 text-sm font-medium text-gray-700">
                            Geographies
                          </label>
                          <GeographyChooser
                            selected={values.geographies}
                            onChange={(val) => setFieldValue("geographies", val)}
                            hasError={!!(errors.geographies && touched.geographies)}
                          />
                          <ErrorMessage name="geographies" component="div" className="mt-2 text-sm text-red-500" />
                        </div>
                      </div>
                    </motion.div>

                    {/* Experience & Performance */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl"
                    >
                      <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900">
                        <FaChartLine className="mr-3 text-primary" />
                        Experience & Performance
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <label className="flex items-center block mb-2 text-sm font-medium text-gray-700">
                            <FaCalendarAlt className="mr-2 text-primary" />
                            Years of Experience
                          </label>
                          <Field
                            name="yearsExperience"
                            type="number"
                            className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-gray-700 ${
                              errors.yearsExperience && touched.yearsExperience
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          <ErrorMessage name="yearsExperience" component="div" className="mt-1 text-sm text-red-500" />
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">Number of Transactions</label>
                          <Field
                            name="numberOfTransactions"
                            type="number"
                            className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-gray-700 ${
                              errors.numberOfTransactions && touched.numberOfTransactions
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          <ErrorMessage name="numberOfTransactions" component="div" className="mt-1 text-sm text-red-500" />
                        </div>
                      </div>
                    </motion.div>

                    {/* Revenue Range */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="flex items-center text-xl font-semibold text-gray-900">
                          <FaDollarSign className="mr-3 text-primary" />
                          Revenue Size Range
                        </h3>
                        <div className="w-28">
                          <Field name="currency">
                            {({ field }) => (
                              <select
                                {...field}
                                className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                      
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">Minimum Revenue</label>
                          <Field name="revenueRange.min">
                            {({ field, form }) => (
                              <input
                                {...field}
                                type="text"
                                placeholder="Enter minimum amount"
                                className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-gray-700 ${
                                  form.touched.revenueRange?.min && form.errors.revenueRange?.min
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
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
                          <ErrorMessage name="revenueRange.min" component="div" className="mt-1 text-sm text-red-500" />
                        </div>
                        
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">Maximum Revenue</label>
                          <Field name="revenueRange.max">
                            {({ field, form }) => (
                              <input
                                {...field}
                                type="text"
                                placeholder="Enter maximum amount"
                                className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-gray-700 ${
                                  form.touched.revenueRange?.max && form.errors.revenueRange?.max
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
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
                          <ErrorMessage name="revenueRange.max" component="div" className="mt-1 text-sm text-red-500" />
                        </div>
                      </div>
                    </motion.div>

                    {/* Description */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl"
                    >
                      <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900">
                        <FaFileAlt className="mr-3 text-primary" />
                        Additional Information
                      </h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">Company Description</label>
                          <Field
                            as="textarea"
                            name="description"
                            rows={4}
                            placeholder="Describe your company, services, and expertise..."
                            className={`w-full px-4 py-3 border rounded-lg resize-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-gray-700 ${
                              errors.description && touched.description
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          <ErrorMessage name="description" component="div" className="mt-1 text-sm text-red-500" />
                        </div>
                      </div>
                    </motion.div>

                    {/* Logo Upload */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl"
                    >
                      <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900">
                        <FaFileAlt className="mr-3 text-primary" />
                        Company Logo
                      </h3>
                      
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-full max-w-md">
                          {/* Show existing logo if available */}
                          {profile?.logoUrl && !logoFile && (
                            <div className="mb-4">
                              <div className="flex justify-center mb-2">
                                <img
                                  src={profile.logoUrl}
                                  alt="Current Logo"
                                  className="object-contain border border-gray-200 rounded-lg shadow-sm max-w-32 max-h-32"
                                />
                              </div>
                              <p className="text-sm text-center text-gray-600">Current Logo</p>
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
                            className="flex flex-col items-center justify-center w-full h-32 transition-all duration-200 bg-white border-2 border-dashed rounded-lg cursor-pointer border-primary/30 hover:bg-primary/5"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <FaFileAlt className="w-8 h-8 mb-4 text-primary" />
                              <p className="mb-2 text-sm text-gray-700">
                                <span className="font-semibold">Click to {profile?.logoUrl ? 'change' : 'upload'}</span> company logo
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
                                  className="object-contain border border-gray-200 rounded-lg shadow-sm max-w-32 max-h-32"
                                />
                              </div>
                              <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                                <div className="flex items-center">
                                  <FaCheckCircle className="mr-2 text-green-500" />
                                  <span className="text-sm font-medium text-green-700">
                                    {logoFile.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Introduction Video Upload */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                      className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl"
                    >
                      <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900">
                        <FaFileAlt className="mr-3 text-primary" />
                        Advisor Introduction Video (optional)
                      </h3>

                      <div className="p-4 mb-6 text-blue-800 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <FaInfoCircle className="w-5 h-5 text-blue-400" aria-hidden="true" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-bold">Video Instructions</h3>
                            <div className="mt-2 text-sm">
                              <p>When we present you to a seller this video will be attached. We suggest a quick introduction of your company followed by a story about your favorite company sale.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        <div className="w-full max-w-xl">
                          {/* Existing video preview if available and no new file */}
                          {profile?.introVideoUrl && !introVideoFile && (
                            <div className="mb-4">
                              <div className="relative overflow-hidden bg-black border border-gray-200 rounded-lg shadow-sm aspect-video">
                                <video src={profile.introVideoUrl} controls className="object-contain w-full h-full bg-black" />
                              </div>
                              <p className="mt-2 text-sm text-center text-gray-600">Current intro video</p>
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
                            className="flex flex-col items-center justify-center w-full h-32 transition-all duration-200 bg-white border-2 border-dashed rounded-lg cursor-pointer border-primary/30 hover:bg-primary/5"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <FaFileAlt className="w-8 h-8 mb-2 text-primary" />
                              <p className="mb-1 text-sm text-gray-700">
                                <span className="font-semibold">Click to {profile?.introVideoUrl ? 'change' : 'upload'}</span> intro video
                              </p>
                              <p className="text-xs text-gray-500">MP4, MOV, or WEBM • up to 200MB</p>
                            </div>
                          </label>

                          {introVideoFile && (
                            <div className="mt-4 space-y-3">
                              {introVideoPreview && (
                                <div className="relative overflow-hidden bg-black border border-gray-200 rounded-lg shadow-sm aspect-video">
                                  <video src={introVideoPreview} controls className="object-contain w-full h-full bg-black" />
                                </div>
                              )}
                              <div className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50">
                                <div className="flex items-center">
                                  <FaCheckCircle className="mr-2 text-blue-500" />
                                  <span className="text-sm font-medium text-blue-800">{introVideoFile.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (introVideoPreview) URL.revokeObjectURL(introVideoPreview);
                                    setIntroVideoFile(null);
                                    setIntroVideoPreview('');
                                  }}
                                  className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Testimonials */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl"
                    >
                      <h3 className="flex items-center mb-6 text-xl font-semibold text-gray-900">
                        <FaQuoteLeft className="mr-3 text-primary" />
                        Client Testimonials
                      </h3>
                      
                      <div className="space-y-4">
                        {values.testimonials.map((testimonial, index) => (
                          <div key={index} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-700">Testimonial {index + 1}</h4>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Client Name</label>
                                <Field
                                  name={`testimonials[${index}].clientName`}
                                  className={`w-full px-3 py-2 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-gray-700 ${
                                    errors.testimonials?.[index]?.clientName && touched.testimonials?.[index]?.clientName
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                />
                                <ErrorMessage
                                  name={`testimonials[${index}].clientName`}
                                  component="div"
                                  className="mt-1 text-xs text-red-500"
                                />
                              </div>
                              
                              <div className="md:col-span-2">
                                <label className="block mb-1 text-sm font-medium text-gray-700">Testimonial</label>
                                <Field
                                  as="textarea"
                                  name={`testimonials[${index}].testimonial`}
                                  rows={3}
                                  className={`w-full px-3 py-2 border rounded-lg resize-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-gray-700 ${
                                    errors.testimonials?.[index]?.testimonial && touched.testimonials?.[index]?.testimonial
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                />
                                <ErrorMessage
                                  name={`testimonials[${index}].testimonial`}
                                  component="div"
                                  className="mt-1 text-xs text-red-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-gray-500">
                        Exactly 5 testimonials are required. Update the details in each card to reflect your latest client feedback.
                      </p>
                    </motion.div>

                    {/* Submit Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="flex justify-end pt-6"
                    >
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-4 font-semibold text-white transition-all duration-300 transform shadow-lg bg-gradient-to-r from-primary to-third rounded-xl hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isSubmitting ? "Updating..." : "Update Profile"}
                      </button>
                    </motion.div>
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
