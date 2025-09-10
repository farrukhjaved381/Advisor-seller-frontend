import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdvisorVerify = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        toast.error('Invalid verification link');
        navigate('/');
        return;
      }

      try {
        // Verify the email with the backend
        const response = await axios.get(`https://advisor-seller-backend.vercel.app/api/auth/verify-email?token=${token}`);
        
        if (response.data.success || response.status === 200) {
          // Get user info to determine redirect
          const userInfo = response.data.user;
          
          toast.success('Email verified successfully! Please login to continue.');
          
          // Redirect based on user role
          if (userInfo && userInfo.role === 'advisor') {
            navigate('/advisor-login');
          } else if (userInfo && userInfo.role === 'seller') {
            navigate('/seller-login');
          } else {
            // Fallback - redirect to main page
            navigate('/');
          }
        } else {
          toast.error('Email verification failed');
          navigate('/');
        }
      } catch (error) {
        console.error('Verification error:', error);
        toast.error('Email verification failed');
        navigate('/');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying your email...</h2>
        <p className="text-gray-600">Please wait while we verify your account.</p>
      </div>
    </div>
  );
};

export default AdvisorVerify;