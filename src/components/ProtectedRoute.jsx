import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ children, requiredRole, requiresPayment = false }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

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

      const userData = response.data;
      setUser(userData);

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

  if (requiresPayment && user.role === 'advisor' && !user.isPaymentVerified) {
    // Advisor hasn't paid
    return <Navigate to="/advisor-payments" replace />;
  }

  if (!authorized) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;