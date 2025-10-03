import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { API_CONFIG } from '../../config/api';
import {
  FaCreditCard,
  FaLock,
  FaArrowLeft,
  FaSpinner,
  FaChevronLeft, // Using a different icon for 'Back' link for better flow
} from 'react-icons/fa';

// Stripe setup
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#1f2937",
      "::placeholder": { color: "#9ca3af" },
      fontFamily:
        '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    invalid: {
      color: "#ef4444", // Tailwind red-500
    },
  },
  hidePostalCode: true,
  autocomplete: "off",
};

// Change Card Form Component
const ChangeCardForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const validateToken = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/advisor-login');
      return null;
    }
    return token;
  };

  useEffect(() => {
    const fetchSetupIntent = async () => {
      try {
        const token = validateToken();
        if (!token) {
          return;
        }
        const res = await axios.post(
          `${API_CONFIG.BACKEND_URL}/api/payment/setup-intent`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setClientSecret(res.data?.clientSecret || null);
      } catch (error) {
        console.error('[AdvisorChangeCard] setup intent failed', error);
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'Unable to start card Add. Please try again.';
        toast.error(errorMessage);
        if (error?.response?.status === 401) {
          navigate('/advisor-login');
        } else {
          navigate('/advisor-profile', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSetupIntent();
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret) {
      toast.error('Payment system not ready. Please try again.');
      return;
    }
    const token = validateToken();
    if (!token) {
      return;
    }
    setSubmitting(true);
    const cardElement = elements.getElement(CardElement);
    try {
      const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        toast.error(error.message || 'Unable to verify card.');
        setSubmitting(false);
        return;
      }

      const paymentMethodId = setupIntent?.payment_method;
      if (typeof paymentMethodId !== 'string') {
        toast.error('Invalid payment method received. Please try again.');
        setSubmitting(false);
        return;
      }

      const res = await axios.post(
        `${API_CONFIG.BACKEND_URL}/api/payment/update-payment-method`,
        { paymentMethodId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data?.subscription) {
        toast.success('Card addedd and membership renewed.');
      } else if (res.data?.autoChargeFailed) {
        toast.success('Card added. We will retry your renewal shortly.');
      } else {
        toast.success('Card added successfully.');
      }
      navigate('/advisor-profile', { replace: true });
    } catch (error) {
      console.error('[AdvisorChangeCard] add card failed', error);
      const errorMessage =
        error?.response?.data?.message || 'Unable to add card. Please try again.';
      toast.error(errorMessage);
      setSubmitting(false);
      if (error?.response?.status === 401) {
        navigate('/advisor-login');
      }
    }
  };

  // --- UI/UX Improvements ---

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <FaSpinner className="animate-spin text-4xl text-primary mb-4" />
        <p className="text-lg text-gray-700 font-medium">Loading payment form...</p>
        <p className="text-sm text-gray-500 mt-1">Establishing secure connection.</p>
      </div>
    );
  }

  // Error State (clientSecret missing)
  if (!clientSecret && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-red-200 max-w-sm">
          <p className="text-2xl text-red-600 font-bold mb-4">Connection Failed ⚠️</p>
          <p className="text-gray-700 mb-6">We couldn't load the secure payment form. Please check your connection and try again.</p>
          <Link
            to="/advisor-profile"
            className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-third transition"
          >
            <FaArrowLeft className="mr-2" /> Return to Profile
          </Link>
        </div>
      </div>
    );
  }

  // Main Form UI
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8"> {/* Lighter background */}
      <Toaster position="top-center" />
      <div className="max-w-md mx-auto">
        
        {/* Back Link - Positioned subtly at the top */}
        <div className="mb-6">
          <Link
            to="/advisor-profile"
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary transition group"
          >
            <FaChevronLeft className="mr-1.5 h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
            Back to Profile
          </Link>
        </div>

        {/* Card Container - Enhanced Styling */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 space-y-8">
          
          {/* Header Section */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-third text-white flex items-center justify-center text-xl shadow-md">
              <FaCreditCard />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Add Payment Card</h1>
              <p className="text-sm text-gray-500 mt-0.5">Securely add your card for seamless subscription renewal.</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Card Details
              </label>
              {/* Card Element Wrapper - Cleaner border and padding */}
              <div className="border border-gray-300 focus-within:border-primary rounded-xl px-4 py-3 bg-gray-50 transition shadow-inner">
                <CardElement options={cardElementOptions} />
              </div>
              
              {/* Security Message - Clearer and more prominent */}
              <div className="flex items-center text-xs text-gray-500 mt-3 p-3 bg-gray-100 rounded-lg border border-gray-200">
                <FaLock className="mr-2 text-primary" />
                <span className="font-medium">Secure Payment:</span> Details are safely managed by Stripe. Your full card number is never stored on our servers.
              </div>
            </div>

            {/* Submit Button - Enhanced visual feedback for disabled/loading */}
            <button
              type="submit"
              disabled={submitting || !stripe || !clientSecret}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-third text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin text-lg" /> Processing...
                </>
              ) : (
                'Save New Card'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main wrapper
const AdvisorChangeCard = () => (
  <Elements stripe={stripePromise}>
    <ChangeCardForm />
  </Elements>
);

export default AdvisorChangeCard;