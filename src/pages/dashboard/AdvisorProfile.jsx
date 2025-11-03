import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaHistory,
  FaCreditCard,
  FaBars,
  FaTimes,
  FaChartLine,
  FaUser,
  FaCog,
  FaSignOutAlt,
} from 'react-icons/fa';

const formatDate = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const centsToUsd = (cents) => {
  const n = Number(cents || 0) / 100;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function AdvisorProfile() {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [advisorProfile, setAdvisorProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/advisor-login');
        return;
      }
      try {
        const authHeaders = { Authorization: `Bearer ${token}` };

        // Fetch profile and payment history in parallel for faster render
        const [profileRes, histRes] = await Promise.all([
          axios.get(`${API_CONFIG.BACKEND_URL}/api/auth/profile`, {
            headers: authHeaders,
          }),
          axios.get(`${API_CONFIG.BACKEND_URL}/api/payment/history`, {
            headers: authHeaders,
            validateStatus: () => true,
          }),
        ]);

        setUser(profileRes.data);
        const subFromProfile = profileRes.data?.subscription;
        let sub = subFromProfile || null;

        if (histRes.status >= 200 && histRes.status < 300) {
          setHistory(histRes.data.paymentHistory || []);
          if (histRes.data.subscription) sub = histRes.data.subscription;
        } else {
          console.warn('[AdvisorProfile] history API non-2xx:', histRes.status, histRes.data);
        }
        setSubscription(sub);

        try {
          const advisorRes = await axios.get(
            `${API_CONFIG.BACKEND_URL}/api/advisors/profile`,
            {
              headers: authHeaders,
              validateStatus: () => true,
            },
          );
          if (advisorRes.status >= 200 && advisorRes.status < 300) {
            setAdvisorProfile(advisorRes.data);
          } else {
            setAdvisorProfile(null);
          }
        } catch (advisorError) {
          console.warn('[AdvisorProfile] advisor profile fetch failed', advisorError);
          setAdvisorProfile(null);
        }
      } catch (e) {
        console.error('[AdvisorProfile] profile/history fetch failed', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription at period end?')) return;
    try {
      setBusy(true);
      const token = localStorage.getItem('access_token');
      const res = await axios.post(`${API_CONFIG.BACKEND_URL}/api/payment/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.subscription) setSubscription(res.data.subscription);
      console.log('Cancel response', res.data);
    } catch (e) {
      // optionally notify
    } finally {
      setBusy(false);
    }
  };

  const handleResume = async () => {
    try {
      setBusy(true);
      const token = localStorage.getItem('access_token');
      const res = await axios.post(`${API_CONFIG.BACKEND_URL}/api/payment/resume`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.subscription) setSubscription(res.data.subscription);
      console.log('Resume response', res.data);
    } catch (e) {
      // optionally notify
    } finally {
      setBusy(false);
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
      // ignore
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      navigate('/advisor-login');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-32 h-32 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const now = new Date();
  const end = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  const start = subscription?.currentPeriodStart ? new Date(subscription.currentPeriodStart) : null;
  // Find the most recent payment date from history
  const lastPaymentAt = (history || []).reduce((acc, h) => {
    const d = h?.createdAt ? new Date(h.createdAt) : null;
    return !d ? acc : (!acc || d > acc ? d : acc);
  }, null);
  // Derive a display start when backend start is missing or incorrectly set in the future
  let displayStart = start;
  if (end) {
    if (!displayStart || (displayStart > now)) {
      if (lastPaymentAt && lastPaymentAt <= now && lastPaymentAt <= end) {
        displayStart = lastPaymentAt;
      } else {
        // Fallback to 1 year before end when no reliable start available
        displayStart = new Date(new Date(end).setFullYear(end.getFullYear() - 1));
      }
    }
  }
  
  const handleLogoClick = () => {
    window.location.href = "https://www.advisorchooser.com";
};

  const displayEnd = displayStart ? new Date(new Date(displayStart).setFullYear(displayStart.getFullYear() + 1)) : end;
  const subscriptionStatus = subscription?.status || 'none';
  const fallbackActive = (user?.isSubscriptionActive ?? false) || (!!displayEnd && displayEnd > now);
  const isPastDue = subscriptionStatus === 'past_due';
  const isActive = subscriptionStatus === 'active' || (!isPastDue && fallbackActive);
  const isCanceled = subscriptionStatus === 'canceled';
  const cancelAtPeriodEnd = Boolean(subscription?.cancelAtPeriodEnd);
  const isExpired = subscriptionStatus === 'expired' || (!isActive && !isPastDue && user?.isPaymentVerified);
  const billing = user?.billing;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
  <div
    className="fixed inset-0 z-40 left-72 bg-black/30 lg:hidden"
    onClick={() => setSidebarOpen(false)}
  />
)}
      {/* Sidebar */}
      <aside
        className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:static inset-y-0 left-0 z-30 w-72 bg-white flex flex-col border-r border-gray-200 shadow-sm transition-transform duration-300 ease-in-out
      `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
          <div className="flex items-center">
            <img
              src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop,q=95/mk3JaNVZEltBD9g4/logo-transparency-mnlJLXr4jxIOR470.png"
              alt="Advisor Chooser"
              className="object-contain w-auto h-8"
               onClick={handleLogoClick}
            />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-md lg:hidden hover:bg-gray-100">
            <FaTimes className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation (mirrors dashboard) */}
        <nav className="flex-1 px-6 py-6">
          <div className="space-y-6">
            {/* Main Menu */}
            <div className="space-y-1">
              <p className="px-3 mb-3 text-xs font-medium tracking-wider text-gray-500 uppercase">Main Menu</p>

              <button
                className={"w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between text-gray-700 hover:bg-gray-100"}
                onClick={() => navigate('/advisor-dashboard?tab=leads')}
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
                className={"w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between text-gray-700 hover:bg-gray-100"}
                onClick={() => navigate('/advisor-dashboard?tab=overview')}
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
                className={"w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 text-gray-700 hover:bg-gray-100"}
                onClick={() => navigate('/advisor-dashboard?tab=settings')}
              >
                <FaCog className="w-5 h-5" />
                <div>
                  <span className="text-sm font-medium">Advisor profile</span>
                  <p className="text-xs opacity-70">Update your information</p>
                </div>
              </button>
            </div>

            {/* Profile & Billing (matches dashboard link) */}
            <button
              className="flex items-center w-full px-4 py-3 space-x-3 text-left text-white transition-all duration-200 rounded-lg shadow-sm bg-gradient-to-r from-third to-primary"
            >
              <FaCreditCard className="w-5 h-5" />
              <div>
                <span className="text-sm font-medium">Subscription Details</span>
                <p className="text-xs opacity-70">Manage subscription and payments</p>
              </div>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            className="flex items-center justify-center w-full px-4 py-3 space-x-2 text-red-600 transition-colors duration-200 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200 shadow-sm lg:px-8">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md lg:hidden hover:bg-gray-100">
              <FaBars className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 lg:text-2xl">Subscription Details</h1>
          </div>
          <div className="relative">
            <button
              className="flex items-center gap-3 px-3 py-2 transition-all duration-200 rounded-lg hover:bg-gray-100"
              onClick={() => setProfileDropdownOpen(prev => !prev)}
            >
              <div className="hidden text-right sm:block">
                <div className="flex items-center justify-end gap-2">
                  <span className="block text-sm font-semibold text-gray-900">{user?.name || 'Loading...'}</span>
                  {advisorProfile?.workedWithCimamplify && (
                    <img
                      src="/logo.png"
                      alt="CIM Amplify Advisor"
                      className="w-5 h-5"
                      title="This advisor uses CIM Amplify"
                    />
                  )}
                </div>
                <span className="block text-xs text-gray-500">Advisor Account</span>
              </div>
              <div className="relative">
                <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white rounded-full shadow-md bg-gradient-to-br from-primary to-third">
                  {(user?.name || 'A').charAt(0)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Membership Status</h2>
              <p className="text-gray-600">Manage your membership and view payment history.</p>
            </div>

            {/* Subscription Status */}
            <div className="p-6 mb-8 bg-white border border-gray-100 shadow-sm rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <FaCheckCircle className="text-xl text-green-600" />
                    ) : isExpired ? (
                    <FaTimesCircle className="text-xl text-red-600" />
                  ) : (
                    <FaExclamationTriangle className="text-xl text-yellow-600" />
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">
                      {isActive ? 'Subscription Active' : isExpired ? 'Subscription Expired' : 'Subscription Pending'}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <FaCalendarAlt />
                      <span>Current period: {formatDate(displayStart)} – {formatDate(displayEnd)}</span>
                    </div>
                    {cancelAtPeriodEnd && isActive && end && end > now && (
  <div className="mt-2 text-sm text-yellow-700">
    Canceled. You retain access until {formatDate(end)}.
  </div>
)}
                    {isPastDue && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                        <FaExclamationTriangle />
                        Automatic renewal failed. Update your card to restore access.
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  {isActive && !cancelAtPeriodEnd && (
                    <button onClick={handleCancel} disabled={busy}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                      Cancel at Period End
                    </button>
                  )}
                  {isActive && cancelAtPeriodEnd && (
                    <button onClick={handleResume} disabled={busy}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                      Resume Subscription
                    </button>
                  )}
                </div>
              </div>

            </div>

            <div className="p-6 mb-8 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <FaCreditCard className="text-primary" />
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Saved payment method</h3>
                  <p className="text-sm text-gray-600">We use this card for automatic renewals at the end of each subscription period.</p>
                </div>
              </div>
              {billing?.cardLast4 ? (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div>
                    <div className="text-sm text-gray-600">Default card</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {(billing.cardBrand || 'Card').toUpperCase()} •••• {billing.cardLast4}
                    </div>
                    {billing.expMonth && billing.expYear && (
                      <div className="mt-1 text-xs text-gray-500">
                        Expires {String(billing.expMonth).padStart(2, '0')}/{billing.expYear}
                      </div>
                    )}
                    {billing.updatedAt && (
                      <div className="mt-1 text-xs text-gray-400">
                        Updated {formatDate(billing.updatedAt)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/advisor-change-card')}
                    className="px-4 py-2 text-sm transition-colors border rounded-lg border-primary text-primary hover:bg-primary/5"
                  >
                    Update card
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 p-4 text-sm text-yellow-800 border border-yellow-200 rounded-lg sm:flex-row sm:items-center sm:justify-between bg-yellow-50">
                  <span>
                    No credit card on file yet. Add one now to enable seamless automatic renewals when your subscription ends or your trial period expires.
                  </span>
                  <button
                    onClick={() => navigate('/advisor-add-card')}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg shadow-sm bg-primary hover:bg-primary/90"
                  >
                    Add credit card
                  </button>
                </div>
              )}
            </div>

            {/* History */}
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <FaHistory className="text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
              </div>
              {history.length === 0 ? (
                <div className="text-sm text-gray-600">No payments recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 border-b">
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Description</th>
                        <th className="py-2 pr-4">Amount</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice().reverse().map((h, idx) => {
                        const pid = h.paymentId || h.id || h._id || '';
                        return (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-2 pr-4">{formatDate(h.createdAt)}</td>
                            <td className="py-2 pr-4">{h.description || 'Payment'}</td>
                            <td className="py-2 pr-4">{centsToUsd(h.amount)} {String(h.currency || 'usd').toUpperCase()}</td>
                            <td className="py-2 pr-4 capitalize">{h.status}</td>
                            <td className="py-2 pr-4 truncate max-w-[220px]" title={pid}>{pid}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}