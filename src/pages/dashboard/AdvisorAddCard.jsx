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
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
        <FaSpinner className="mb-4 text-4xl animate-spin text-primary" />
        <p className="text-lg font-medium text-gray-700">Loading payment form...</p>
        <p className="mt-1 text-sm text-gray-500">Establishing secure connection.</p>
      </div>
    );
  }

  // Error State (clientSecret missing)
  if (!clientSecret && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
        <div className="max-w-sm p-8 text-center bg-white border border-red-200 shadow-lg rounded-xl">
          <p className="mb-4 text-2xl font-bold text-red-600">Connection Failed ⚠️</p>
          <p className="mb-6 text-gray-700">We couldn't load the secure payment form. Please check your connection and try again.</p>
          <Link
            to="/advisor-profile"
            className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white transition border border-transparent rounded-md bg-primary hover:bg-third"
          >
            <FaArrowLeft className="mr-2" /> Return to Profile
          </Link>
        </div>
      </div>
    );
  }

  // Main Form UI
  return (
    <div className="min-h-screen px-4 py-12 bg-gray-100 sm:px-6 lg:px-8"> {/* Lighter background */}
      <Toaster position="top-center" />
      <div className="max-w-md mx-auto">
        
        {/* Back Link - Positioned subtly at the top */}
        <div className="mb-6">
          <Link
            to="/advisor-profile"
            className="inline-flex items-center text-sm font-medium text-gray-600 transition hover:text-primary group"
          >
            <FaChevronLeft className="mr-1.5 h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
            Back to Profile
          </Link>
        </div>

        {/* Card Container - Enhanced Styling */}
        <div className="p-8 space-y-8 bg-white border border-gray-200 shadow-xl rounded-2xl">
          
          {/* Header Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 text-xl text-white shadow-md rounded-xl bg-gradient-to-br from-primary to-third">
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
              <label className="block mb-3 text-sm font-semibold text-gray-700">
                Card Details
              </label>
              {/* Card Element Wrapper - Cleaner border and padding */}
              <div className="px-4 py-3 transition border border-gray-300 shadow-inner focus-within:border-primary rounded-xl bg-gray-50">
                <CardElement options={cardElementOptions} />
              </div>
              
              {/* Security Message - Clearer and more prominent */}
              <div className="flex items-center p-3 mt-3 text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded-lg">
                <FaLock className="mr-2 text-primary" />
                <span className="font-medium">Secure Payment:</span> Details are safely managed by Stripe. Your full card number is never stored on our servers.
              </div>
            </div>

            {/* Submit Button - Enhanced visual feedback for disabled/loading */}
            <button
              type="submit"
              disabled={submitting || !stripe || !clientSecret}
              className="flex items-center justify-center w-full gap-2 py-3 text-lg font-bold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-primary to-third rounded-xl hover:shadow-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <FaSpinner className="text-lg animate-spin" /> Processing...
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