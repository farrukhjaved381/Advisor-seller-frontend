// AdvisorPayments.jsx
import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast, Toaster } from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  FaUser, 
  FaGlobe, 
  FaMapMarkerAlt, 
  FaGift, 
  FaCreditCard, 
  FaShieldAlt,
  FaLock,
  FaCheckCircle,
  FaSpinner
} from "react-icons/fa";
import { API_CONFIG } from "../../../config/api";

// -------------------- URL Params --------------------
const getSearchParams = () => new URLSearchParams(window.location.search);

// -------------------- Stripe --------------------
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY).catch(err => {
  console.error('Failed to load Stripe:', err);
  return null;
});

// -------------------- CSRF Helper (CRITICALLY REVISED) --------------------
class SecureAPI {
  static BACKEND_URL = API_CONFIG.BACKEND_URL;

  static getToken() {
    return (
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('access_token') ||
      sessionStorage.getItem('token') ||
      null
    );
  }

  static async secureRequest(path, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const body = options.body
      ? typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body)
      : undefined;

    return fetch(`${this.BACKEND_URL}${path}`, {
      ...options,
      headers,
      body,
      credentials: 'include',
    });
  }
}

// -------------------- Validation Schema --------------------
const PaymentSchema = Yup.object().shape({
  firstName: Yup.string().matches(/^[A-Za-z]+$/, "Only alphabets allowed").min(2).max(20).required("First name is required"),
  lastName: Yup.string().matches(/^[A-Za-z]+$/, "Only alphabets allowed").min(2).max(20).required("Last name is required"),
  country: Yup.string().required("Country is required"),
  coupon: Yup.string().matches(/^[A-Za-z0-9]*$/, "Only letters & numbers allowed").notRequired(),
});

// -------------------- Inner Form Component --------------------
const AdvisorPaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [amount, setAmount] = useState(500000); // Amount in cents ($5000)
  const [couponApplied, setCouponApplied] = useState(false);
  const [originalAmount] = useState(500000);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const params = getSearchParams();
  const returnTo = params.get('return') || '/advisor-profile';
  const intent = params.get('intent') || 'activate'; // 'renew' | 'resubscribe' | 'activate'

  // Autofill user info from localStorage if available
  let userEmail = null;
  let defaultFirstName = "";
  let defaultLastName = "";
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.email) userEmail = user.email;
      if (user.name) {
        const [first, ...rest] = user.name.split(' ');
        defaultFirstName = first || "";
        defaultLastName = rest.join(' ') || "";
      } else {
        if (user.firstName) defaultFirstName = user.firstName;
        if (user.lastName) defaultLastName = user.lastName;
      }
    }
  } catch (e) {
    // ignore
  }

  // Fetch current state (profile / verification)
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const prof = await fetch(`${API_CONFIG.BACKEND_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (prof.ok) {
          const data = await prof.json();
          setIsVerified(!!data.isPaymentVerified);
          if (data.role === 'advisor') {
            // if API exposes isProfileComplete
            if (typeof data.isProfileComplete === 'boolean') {
              setHasProfile(data.isProfileComplete);
            } else {
              // fallback: try advisors/profile
              const prof2 = await fetch(`${API_CONFIG.BACKEND_URL}/api/advisors/profile`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
              });
              setHasProfile(prof2.ok);
            }
          }
        }
      } catch {}
    })();
  }, []);

  const validateToken = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/advisor-login', { replace: true });
      return null;
    }
    return token;
  };

  const redirectAfterPayment = () => {
    // If user already has profile or came for renewal/resubscribe, go to returnTo
    if (hasProfile || isVerified || intent === 'renew' || intent === 'resubscribe') {
      window.location.href = returnTo || '/advisor-profile';
    } else {
      // Fresh activation flow
      window.location.href = '/advisor-form';
    }
  };

  // Helper to format amount with commas
  const formatAmount = (amt) => {
    return amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const handleApplyCoupon = async (coupon) => {
    if (!coupon?.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsApplyingCoupon(true);

    try {
      // Check if it's a free trial coupon first
      if (coupon.trim().toUpperCase() === 'FREETRIAL2024') {
        const response = await SecureAPI.secureRequest("/api/payment/redeem-coupon", {
          method: "POST",
          body: JSON.stringify({ code: coupon.trim() }),
        });

        const data = await response.json();
        if (response.ok) {
          toast.success("Free trial activated! 🎉 Redirecting to create your profile...");
          setTimeout(() => {
            redirectAfterPayment();
          }, 1500);
          return;
        } else {
          toast.error(data.message || "Failed to redeem free trial coupon ❌");
          return;
        }
      }

      // Regular coupon for discount
      const payload = { couponCode: coupon.trim() };
      const response = await SecureAPI.secureRequest("/api/payment/create-intent", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok && data.amount !== undefined) {
        setAmount(data.amount);
        setCouponApplied(true);
        toast.success(`Coupon applied! New amount: $${(data.amount / 100).toFixed(2)}`);
      } else {
        toast.error(data.message || "Failed to apply coupon ❌");
      }
    } catch (err) {
      console.error("Apply coupon error:", err);
      toast.error("Error applying coupon ❌");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Handle payment submission
  const handleSubmitPayment = async (values, { setSubmitting, resetForm }) => {
    const token = validateToken();
    if (!token) {
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    if (!stripe || !elements) {
      toast.error("Stripe.js has not loaded yet. Please try again.");
      setSubmitting(false);
      return;
    }

    const resolvedEmail = userEmail || (() => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed?.email || null;
        }
      } catch (error) {
        console.error('Failed to resolve user email from storage', error);
      }
      return null;
    })();

    try {
      const cardElement = elements.getElement(CardElement);

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${values.firstName} ${values.lastName}`,
          email: resolvedEmail,
          address: {
            country: values.country,
          },
        },
      });

      if (pmError) {
        toast.error(pmError.message || 'Unable to verify card.');
        console.error('Stripe createPaymentMethod error:', pmError);
        setSubmitting(false);
        return;
      }

      const paymentMethodId = paymentMethod?.id;
      if (!paymentMethodId) {
        toast.error('Stripe did not return a valid payment method. Please try again.');
        setSubmitting(false);
        return;
      }

      const subscriptionRes = await axios.post(
        `${API_CONFIG.BACKEND_URL}/api/payment/create-subscription`,
        {
          paymentMethodId,
          couponCode: values.coupon?.trim() || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      let {
        subscriptionId,
        clientSecret: subscriptionClientSecret,
        status,
      } = subscriptionRes.data || {};
      console.log('[AdvisorPayments] subscription response', subscriptionRes.data);

      if (subscriptionClientSecret) {
        const paymentResult = await stripe.confirmCardPayment(
          subscriptionClientSecret,
        );
        if (paymentResult.error) {
          toast.error(
            paymentResult.error.message || 'Authentication was not completed.',
          );
          setSubmitting(false);
          return;
        }
        status = paymentResult.paymentIntent?.status || status;
      }

      if (subscriptionId) {
        try {
          const finalizeRes = await axios.post(
            `${API_CONFIG.BACKEND_URL}/api/payment/finalize-subscription`,
            { subscriptionId },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          status = finalizeRes.data?.status || status;
        } catch (error) {
          console.error('Finalize subscription failed:', error);
          toast.error(
            error?.response?.data?.message ||
              'Subscription payment completed, but we could not finalize your account. Please contact support.',
          );
          setSubmitting(false);
          return;
        }
      }

      if (!['active', 'trialing'].includes(status)) {
        toast.error(
          'We received your card details, but the subscription is not active yet. Please contact support to complete activation.',
        );
        setSubmitting(false);
        return;
      }

      toast.success(
        status === 'trialing'
          ? 'Subscription activated. Enjoy your trial period!'
          : 'Subscription activated successfully. Redirecting...',
      );

      resetForm();
      setTimeout(() => {
        redirectAfterPayment();
      }, 1200);
    } catch (err) {
      console.error('Payment process error:', err?.response?.data || err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'An unexpected error occurred during payment.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-third rounded-full flex items-center justify-center">
          <FaShieldAlt className="text-white text-2xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Advisor Membership</h1>
          <p className="text-gray-600">Help us to get in front of "Off Market" and convince sellers to use you</p>
        </div>
        
        {/* Pricing Display */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center justify-center space-x-4">
            {couponApplied && (
              <div className="text-right">
                <p className="text-sm text-gray-500 line-through">${formatAmount(originalAmount / 100)} USD</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-800">${formatAmount(amount / 100)} USD</p>
              <p className="text-sm text-gray-500">Yearly Subscription</p>
            </div>
            {couponApplied && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                <FaCheckCircle className="inline mr-1" />
                Discount Applied
              </div>
            )}
          </div>
        </div>
      </div>

      <Formik
        initialValues={{
          firstName: defaultFirstName,
          lastName: defaultLastName,
          country: "",
          coupon: ""
        }}
        validationSchema={PaymentSchema}
        onSubmit={handleSubmitPayment}
      >
        {({ values, isSubmitting, errors, touched }) => (
          <Form className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaUser className="mr-2 text-blue-500" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <div className={`relative border-2 rounded-lg transition-colors ${
                    errors.firstName && touched.firstName 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 hover:border-blue-300 focus-within:border-blue-500'
                  }`}>
                    <div className="flex items-center px-4 py-3">
                      <FaUser className="mr-3 text-gray-400" />
                      <Field 
                        name="firstName" 
                        placeholder="Enter first name" 
                        className="w-full outline-none bg-transparent text-gray-800"
                      />
                    </div>
                  </div>
                  <ErrorMessage name="firstName" component="p" className="text-red-500 text-sm flex items-center">
                    <span className="ml-1">⚠️</span>
                    <span className="ml-1">{errors.firstName}</span>
                  </ErrorMessage>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <div className={`relative border-2 rounded-lg transition-colors ${
                    errors.lastName && touched.lastName 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 hover:border-blue-300 focus-within:border-blue-500'
                  }`}>
                    <div className="flex items-center px-4 py-3">
                      <FaUser className="mr-3 text-gray-400" />
                      <Field 
                        name="lastName" 
                        placeholder="Enter last name" 
                        className="w-full outline-none bg-transparent text-gray-800"
                      />
                    </div>
                  </div>
                  <ErrorMessage name="lastName" component="p" className="text-red-500 text-sm flex items-center">
                    <span className="ml-1">⚠️</span>
                    <span className="ml-1">{errors.lastName}</span>
                  </ErrorMessage>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-blue-500" />
                Location Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <div className={`relative border-2 rounded-lg transition-colors ${
                    errors.country && touched.country 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 hover:border-blue-300 focus-within:border-blue-500'
                  }`}>
                    <div className="flex items-center px-4 py-3 w-full">
                      <FaGlobe className="mr-3 text-gray-400" />
                      <Field as="select" name="country" className="w-full outline-none bg-transparent text-gray-800">
                        <option value="">Select your country</option>
                        <option value="PK">🇵🇰 Pakistan</option>
                        <option value="US">🇺🇸 United States</option>
                        <option value="GB">🇬🇧 United Kingdom</option>
                        <option value="CA">🇨🇦 Canada</option>
                        <option value="AU">🇦🇺 Australia</option>
                      </Field>
                    </div>
                  </div>
                  <ErrorMessage name="country" component="p" className="text-red-500 text-sm flex items-center">
                    <span className="ml-1">⚠️</span>
                    <span className="ml-1">{errors.country}</span>
                  </ErrorMessage>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaCreditCard className="mr-2 text-blue-500" />
                Payment Information
              </h3>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Card Details</label>
                <div className="border-2 rounded-lg px-4 py-4 transition-colors border-gray-200 hover:border-blue-300 focus-within:border-blue-500 bg-white">
                  {stripe ? (
                    <CardElement 
                      options={{ 
                        hidePostalCode: true,
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#374151',
                            fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
                            fontSmoothing: 'antialiased',
                            '::placeholder': {
                              color: '#9CA3AF',
                            },
                          },
                          invalid: {
                            color: '#EF4444',
                            iconColor: '#EF4444'
                          },
                        },
                      }} 
                      onReady={() => {
                        console.log('CardElement ready');
                        setCardReady(true);
                      }}
                      onChange={(event) => {
                        if (event.error) {
                          console.error('CardElement error:', event.error);
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-12">
                      <FaSpinner className="animate-spin mr-2 text-blue-500" />
                      <p className="text-gray-500">Loading secure payment form...</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <FaLock className="mr-2" />
                  <span>Your payment information is encrypted and secure</span>
                </div>
              </div>
            </div>

            {/* Coupon Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaGift className="mr-2 text-green-500" />
                Promotional Code
              </h3>
              
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <div className="border-2 rounded-lg transition-colors border-gray-200 hover:border-green-300 focus-within:border-green-500">
                    <div className="flex items-center px-4 py-3">
                      <FaGift className="mr-3 text-gray-400" />
                      <Field 
                        name="coupon" 
                        placeholder="Enter promo code" 
                        className="w-full outline-none bg-transparent text-gray-800"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyCoupon(values.coupon)}
                  disabled={isApplyingCoupon || !values.coupon?.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isApplyingCoupon ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Applying...
                    </>
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>
            </div>


            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !stripe || !elements || !cardReady}
                className="w-full bg-gradient-to-r from-primary to-third text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center text-lg"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-3" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <FaLock className="mr-3" />
                    Complete Payment • {formatAmount(amount / 100)} USD
                  </>
                )}
              </button>
            </div>

            {/* Next Step - Complete Profile */}
            <div className="mt-5 flex flex-col items-center justify-center">
              <div className="w-full max-w-md bg-blue-50 border border-blue-100 rounded-xl shadow p-3 flex flex-col items-center">
                <div className="flex items-center mb-1">
                  <FaCheckCircle className="text-green-500 text-lg mr-1" />
                  <span className="text-base font-semibold text-blue-900">Next step</span>
                </div>
                <span className="text-base font-bold text-secondary">Complete your profile</span>
                <span className="text-xs text-gray-500 mt-1 text-center">After payment, you'll finish your advisor profile to activate your account.</span>
                <span className="inline-block bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-1 rounded mt-2"></span>
              </div>
            </div>

            {/* Trust Indicators */}
            {/* <div className="text-center space-y-2 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <FaShieldAlt className="mr-1" />
                  <span>256-bit SSL Encryption</span>
                </div>
                <div className="flex items-center">
                  <FaLock className="mr-1" />
                  <span>PCI Compliant</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Powered by Stripe • Your payment information is never stored on our servers
              </p>
            </div> */}
          </Form>
        )}
      </Formik>
    </div>
  );
};

// -------------------- Wrapper Component (Enhanced) --------------------
const AdvisorPayments = () => {
  const [stripeError, setStripeError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Test Stripe loading
        const stripe = await stripePromise;
        if (!stripe) {
          setStripeError('Failed to load Stripe. Please refresh the page.');
          return;
        }
        console.log('Stripe loaded successfully');
      } catch (err) {
        console.error("Failed to initialize:", err);
        setStripeError('Failed to initialize payment system. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <FaSpinner className="animate-spin text-white text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Initializing Payment System</h2>
            <p className="text-gray-600">Please wait while we prepare your secure checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (stripeError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-6">
        <div className="max-w-md w-full bg-white shadow-2xl rounded-3xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <FaShieldAlt className="text-red-500 text-2xl" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-red-600">Payment System Error</h1>
          <p className="text-gray-600 mb-6">{stripeError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6">
        <Toaster
          position="top-center"
          toastOptions={{ 
            style: { 
              minWidth: "300px", 
              maxWidth: "500px",
              borderRadius: "12px",
              fontSize: "14px",
              padding: "12px 16px"
            },
            duration: 4000,
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#ffffff',
              },
            }
          }}
        />
        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow-2xl rounded-3xl overflow-hidden">
            <div className="px-8 py-10 sm:px-12 sm:py-12">
              <AdvisorPaymentForm />
            </div>
          </div>
          
          {/* Additional Trust Signals */}
          {/* <div className="mt-8 text-center space-y-4">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaShieldAlt className="text-blue-500 text-xs" />
                </div>
                <span>Bank-level Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="text-green-500 text-xs" />
                </div>
                <span>Instant Activation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <FaUser className="text-purple-500 text-xs" />
                </div>
                <span>24/7 Support</span>
              </div>
            </div>
            
          </div> */}
        </div>
      </div>
    </Elements>
  );
};

export default AdvisorPayments;
