import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Global exit guard for seller routes (except seller form)
const SellerExitGuard = ({ enabled }) => {
  useEffect(() => {
    if (!enabled) return;
    // Flag so pages can detect a global guard exists
    window.__SELLER_EXIT_GUARD_ACTIVE = true;

    const isEnabled = () => {
      if (!enabled) return false;
      if (typeof window === 'undefined') return false;
      const path = window.location?.pathname || '';
      if (path === '/seller-form') return false;
      const token = localStorage.getItem('access_token');
      if (!token) return false; // disabled after profile delete/logout
      return true;
    };

    // beforeunload: native confirmation
    const beforeUnloadHandler = (e) => {
      if (isEnabled()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', beforeUnloadHandler);

    // popstate: block back/forward
    try { window.history.pushState({ _guard: true }, document.title, window.location.href); } catch {}
    const onPopState = () => {
      if (!isEnabled()) return;
      try { window.history.pushState({ _guard: true }, document.title, window.location.href); } catch {}
      alert("Don't exit without deleting the profile. Please delete your profile to leave the dashboard.");
      // toast is optional here; toast library may not be loaded at this layer
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      window.removeEventListener('popstate', onPopState);
      delete window.__SELLER_EXIT_GUARD_ACTIVE;
    };
  }, [enabled]);
  return null;
};

const ProtectedRoute = ({ children, requiredRole, requiresPayment = false }) => {
  const cached = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })();
  const hasToken = (() => {
    try { return !!localStorage.getItem('access_token'); } catch { return false; }
  })();
  // Optimistic render when we have cached user and token
  const [loading, setLoading] = useState(!cached || !hasToken);
  const [user, setUser] = useState(cached);
  const [authorized, setAuthorized] = useState(!!cached && hasToken);

  useEffect(() => {
    checkAuth();
  }, [window.location.pathname]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_CONFIG.BACKEND_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let userData = response.data;

      if (userData.role === 'seller' && !userData.isProfileComplete) {
        try {
          const profileResponse = await axios.get(
            `${API_CONFIG.BACKEND_URL}/api/sellers/profile`,
            { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
          );

          if (profileResponse.status >= 200 && profileResponse.status < 300 && profileResponse.data) {
            userData = { ...userData, isProfileComplete: true };
          }
        } catch (sellerProfileError) {
          console.error('Failed to verify seller profile completion:', sellerProfileError);
        }
      }

      setUser(userData);
      
      // Clear old form data if profile is incomplete to start fresh
      if (userData.role === 'advisor' && !userData.isProfileComplete) {
        sessionStorage.removeItem('advisor-profile');
      }
      
      // Update localStorage with fresh data
      localStorage.setItem('user', JSON.stringify(userData));

      // Check role
      if (requiredRole && userData.role !== requiredRole) {
        setLoading(false);
        return;
      }

      // Check payment verification for advisors
      if (requiresPayment && userData.role === 'advisor') {
        // Check if user has active subscription or access until period end
        let hasPayment = false;
        
        if (userData.isPaymentVerified) {
          hasPayment = true;
        }
        // Check if subscription is canceled but user has access until period end
        else if (userData.subscription?.status === 'canceled' && userData.subscription?.currentPeriodEnd) {
          const periodEnd = new Date(userData.subscription.currentPeriodEnd);
          const now = new Date();
          hasPayment = periodEnd > now;
        }
        
        if (!hasPayment) {
          setLoading(false);
          return;
        }
      }

      setAuthorized(true);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    // Not logged in
    if (requiredRole === 'advisor') {
      return <Navigate to="/advisor-login" replace />;
    } else if (requiredRole === 'seller') {
      return <Navigate to="/seller-login" replace />;
    }
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Wrong role
    if (user.role === 'advisor') {
      return <Navigate to="/advisor-dashboard" replace />;
    } else if (user.role === 'seller') {
      return <Navigate to="/seller-dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Advisor specific redirection logic
  if (user.role === 'advisor') {
    const { pathname } = window.location;
    
    // Check if user has active subscription or access until period end
    let hasAccess = false;
    
    console.log('ProtectedRoute checking access for user:', user);
    
    // First check if subscription is explicitly active
    if (typeof user.isSubscriptionActive === 'boolean' && user.isSubscriptionActive) {
      hasAccess = true;
      console.log('Access granted: isSubscriptionActive = true');
    }
    // If subscription is canceled but user has access until period end
    else if (user.subscription?.status === 'canceled' && user.subscription?.currentPeriodEnd) {
      const periodEnd = new Date(user.subscription.currentPeriodEnd);
      const now = new Date();
      hasAccess = periodEnd > now;
      console.log('Canceled subscription check:', { periodEnd, now, hasAccess });
    }
    // Fallback to payment verification for legacy users
    else if (user.isPaymentVerified) {
      hasAccess = true;
      console.log('Access granted: isPaymentVerified = true');
    }
    
    console.log('Final access decision:', hasAccess);
    
    // Allow certain pages even when inactive
    const allowWhenInactive = ['/advisor-payments', '/adviser-payment', '/advisor-form'];
    
    if (!hasAccess) {
      if (!allowWhenInactive.includes(pathname)) {
        console.log('ProtectedRoute redirecting to payments, pathname:', pathname);
        return <Navigate to="/advisor-payments" replace />;
      }
    }
    
    // If has access, allow normal advisor pages
    if (pathname === '/advisor-dashboard' || pathname === '/edit-advisor-profile' || pathname === '/advisor-form') {
      return children;
    }
  }

  if (!authorized) {
    return <Navigate to="/" replace />;
  }

  if (user.role === 'seller') {
    const { pathname } = window.location;
    if (!user.isProfileComplete && pathname !== '/seller-form') {
      return <Navigate to="/seller-form" replace />;
    }

    if (user.isProfileComplete && pathname === '/seller-form') {
      return <Navigate to="/seller-dashboard" replace />;
    }
  }

  // Apply exit guard to all seller routes except seller form
  const shouldGuard = user.role === 'seller' && window.location.pathname !== '/seller-form';
  return (
    <>
      {shouldGuard && <SellerExitGuard enabled />}
      {children}
    </>
  );
};

export default ProtectedRoute;