import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Email validation
  const validateEmail = (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return 'Email is required';
    if (!regex.test(value)) return 'Please enter a valid email address';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateEmail(email);
    setEmailError(validation);
    if (validation) return;

    setLoading(true);

    try {
      // POST forgot-password request
      const res = await axios.post(
        'https://advisor-seller-backend.vercel.app/api/auth/forgot-password',
        { email },
        { validateStatus: () => true }
      );

      if (res.status === 200 || res.status === 201) {
        toast.success(res.data?.message || 'Reset link sent to your email ✅');

        // Redirect to /reset-password after 1.5s
        setTimeout(() => navigate('/seller-login'), 1500);
      } else {
        toast.error(res.data?.message || 'Something went wrong ❌');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-primary to-primary-50 px-4">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md flex flex-col items-center gap-6">
        <h2 className="text-3xl font-bold text-center text-black">Forgot Password</h2>
        <p className="text-center text-gray-600">
          Enter your email to receive a reset password link.
        </p>

        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-primary ${emailError ? 'border-red-500' : 'border-primary'
              }`}
          />
          {emailError && <span className="text-red-500 text-sm">{emailError}</span>}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 mt-2 rounded-xl text-white font-semibold ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary/70 hover:bg-primary'
              }`}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <span
          className="text-primary hover:text-primary-800 cursor-pointer mt-4"
          onClick={() => navigate('/auth')}
        >
          Back to Login
        </span>
      </div>
    </div>
  );
};

export default ForgotPassword;
