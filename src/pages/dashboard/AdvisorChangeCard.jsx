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
} from 'react-icons/fa';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      '::placeholder': { color: '#9ca3af' },
      fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    invalid: {
      color: '#ef4444',
    },
  },
};

const ChangeCardForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSetupIntent = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/advisor-login');
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
        toast.error('Unable to start card update. Please try again.');
        navigate('/advisor-profile', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchSetupIntent();
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret) {
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

      const paymentMethodId =
        typeof setupIntent?.payment_method === 'string'
          ? setupIntent.payment_method
          : setupIntent?.payment_method?.id;

      if (!paymentMethodId) {
        toast.error('Stripe did not return a payment method. Please try again.');
        setSubmitting(false);
        return;
      }

      const token = localStorage.getItem('access_token');
      const res = await axios.post(
        `${API_CONFIG.BACKEND_URL}/api/payment/update-payment-method`,
        { paymentMethodId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data?.subscription) {
        toast.success('Card updated and membership renewed.');
      } else if (res.data?.autoChargeFailed) {
        toast.success('Card updated. We will retry your renewal shortly.');
      } else {
        toast.success('Card updated successfully.');
      }
      navigate('/advisor-profile', { replace: true });
    } catch (error) {
      console.error('[AdvisorChangeCard] update card failed', error);
      toast.error(
        error?.response?.data?.message || 'Unable to update card. Please try again.',
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="animate-spin text-3xl text-primary" />
      </div>
    );
  }

  if (!clientSecret) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <Toaster position="top-center" />
      <div className="max-w-lg mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/advisor-profile"
            className="inline-flex items-center text-sm text-primary hover:text-third"
          >
            <FaArrowLeft className="mr-2" /> Back to subscription
          </Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-third text-white flex items-center justify-center">
              <FaCreditCard />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Update credit card</h1>
              <p className="text-sm text-gray-600">Save a new card for automatic subscription renewals.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card details
              </label>
              <div className="border border-gray-300 rounded-lg px-3 py-3 bg-white shadow-sm">
                <CardElement options={cardElementOptions} />
              </div>
              <div className="flex items-center text-xs text-gray-500 mt-2 gap-2">
                <FaLock />
                Securely processed by Stripe. We never store your full card number.
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !stripe}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-third text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin" /> Updating...
                </>
              ) : (
                'Save card'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const AdvisorChangeCard = () => (
  <Elements stripe={stripePromise}>
    <ChangeCardForm />
  </Elements>
);

export default AdvisorChangeCard;
