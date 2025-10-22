import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import Header from '../../../components/common/Header';


const SellerAuth = () => {
  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      localStorage.setItem('access_token', '');
    }
    if (!localStorage.getItem('refresh_token')) {
      localStorage.setItem('refresh_token', '');
    }
    if (!localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify({}));
    }
  }, []);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return 'Email is required';
    if (!regex.test(value)) return 'Please enter a valid email address';
    return '';
  };

  const handleEmailChange = (event) => {
    const value = event.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationResult = validateEmail(email.trim());
    setEmailError(validationResult);
    if (validationResult) return;

    setLoading(true);
    try {
      console.log('[SellerAuth] Sending seller email auth request', email.trim());
      const response = await axios.post(
        'https://api.advisorchooser.com/api/auth/seller-login',
        { email: email.trim() },
        { withCredentials: true, validateStatus: () => true },
      );

      console.log('[SellerAuth] seller email auth response status', response.status, response.data);
      if (response.status < 200 || response.status >= 300) {
        toast.error(response.data?.message || 'Unable to authenticate email');
        return;
      }

      const { access_token: accessToken, refresh_token: refreshToken, user } = response.data;

      localStorage.setItem('access_token', accessToken || '');
      localStorage.setItem('refresh_token', refreshToken || '');
      localStorage.setItem('user', JSON.stringify(user || {}));

      toast.success('Welcome!');

      try {
        console.log('[SellerAuth] Fetching profile after seller email auth');
        const profileResponse = await axios.get(
          'https://api.advisorchooser.com/api/auth/profile',
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        console.log('[SellerAuth] profile response', profileResponse.status, profileResponse.data);
        const userData = profileResponse.data;
        localStorage.setItem('user', JSON.stringify(userData));

        if (userData?.isProfileComplete) {
          navigate('/seller-dashboard');
        } else {
          navigate('/seller-form');
        }
      } catch (profileError) {
        console.error('Failed to fetch seller profile status:', profileError);
        navigate('/seller-form');
      }
    } catch (error) {
      console.error('Seller login error:', error);
      toast.error('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col overflow-x-hidden">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#17252a',
            borderRadius: '12px',
            padding: '16px',
            boxShadow:
              '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        }}
      />
      <Header />
      <div className="flex-grow w-full flex flex-col md:flex-row items-stretch pt-10 md:pt-20">
        <div className="w-full md:w-[45%] relative overflow-hidden min-h-[260px] md:min-h-0 h-64 md:h-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-third/30 z-10" />
          <img
            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
            alt="Professional seller workspace"
            className="object-cover h-full w-full transform hover:scale-105 transition-transform duration-700"
          />

          {/* <div className="absolute top-4 left-4 md:top-8 md:left-8 z-20 w-[90%] md:w-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-xl max-w-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-4 h-4 bg-gradient-to-r from-primary to-third rounded-full animate-pulse" />
                <span className="text-secondary font-bold text-base md:text-lg">Discover Your Advisor Matches</span>
              </div>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                Enter your business email to see the best matching advisors for you.
              </p>
            </div>
          </div> */}

          {/* <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-20">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 md:p-4 shadow-xl">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-secondary font-semibold text-xs md:text-sm">Secure Access</span>
              </div>
            </div>
          </div> */}
        </div>

        <div className="w-full md:w-[55%] flex justify-center items-center bg-gradient-to-bl from-white to-gray-50/50 relative px-4 py-10 md:py-0">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 md:top-20 md:left-20 w-20 h-20 md:w-32 md:h-32 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 md:bottom-32 md:right-20 w-32 h-32 md:w-48 md:h-48 bg-third rounded-full blur-3xl" />
          </div>

          <div className="w-full max-w-md bg-white/80 backdrop-blur-lg shadow-2xl rounded-3xl p-8 md:p-10 relative z-10">
            <div className="mb-8">
              {/* <div className="inline-flex items-center bg-primary/10 text-primary px-3 py-2 rounded-full text-sm font-semibold mb-4">
                Quick Access
              </div> */}
              <h2 className="text-3xl font-bold text-secondary mb-2">Advisor Matching</h2>
              <p className="text-gray-600">
                To begin, enter your email address.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <label htmlFor="seller-email" className="block text-sm font-semibold text-secondary mb-2">
                  Email Address
                </label>
                <input
                  id="seller-email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    emailError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary'
                  } focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200`}
                  placeholder="you@company.com"
                  disabled={loading}
                  autoComplete="email"
                />
                {emailError && <p className="mt-2 text-sm text-red-500">{emailError}</p>}
              </div>
<button
  type="submit"
  disabled={loading}
  className="w-full bg-gradient-to-r from-primary to-third text-white font-semibold py-3 rounded-xl hover:shadow-xl transition-transform duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? 'Checking...' : 'Next Step → Your Company Details'}
</button>
            </form>

            {/* <div className="mt-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
              A quick way to see matching advisors tailored to you.
            </div> */}
          </div>
        </div>
      </div>

     
    </div>
  );
};

export default SellerAuth;