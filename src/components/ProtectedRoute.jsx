import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ children, requiredRole, requiresPayment = false }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);

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

      const response = await axios.get('https://advisor-seller-backend.vercel.app/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      let userData = response.data;

      if (userData.role === 'seller' && !userData.isProfileComplete) {
        try {
          const profileResponse = await axios.get(
            'https://advisor-seller-backend.vercel.app/api/sellers/profile',
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
      if (requiresPayment && userData.role === 'advisor' && !userData.isPaymentVerified) {
        setLoading(false);
        return;
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

    // Only check payment verification for non-dashboard routes
    if (!user.isPaymentVerified) {
      if (pathname !== '/advisor-payments' && pathname !== '/adviser-payment') {
        return <Navigate to="/advisor-payments" replace />;
      }
    } else {
      // Payment verified - let individual components handle their own flow
      // Dashboard will check profile completion internally
      if (pathname === '/advisor-dashboard' || pathname === '/edit-advisor-profile') {
        return children;
      }
      
      // For form route, allow access
      if (pathname === '/advisor-form') {
        return children;
      }
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

  return children;
};

export default ProtectedRoute;
