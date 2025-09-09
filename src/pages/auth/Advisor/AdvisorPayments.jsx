// AdvisorPayments.jsx
import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast, Toaster } from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
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

// -------------------- Stripe --------------------
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY).catch(err => {
  console.error('Failed to load Stripe:', err);
  return null;
});

// -------------------- CSRF Helper (CRITICALLY REVISED) --------------------
class SecureAPI {
  static BACKEND_URL = "https://advisor-seller-backend.vercel.app";
  static #csrfToken = null; // In-memory cache for the CSRF token

  static getCsrfTokenFromCookie() {
    console.log('All cookies:', document.cookie);
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      console.log('Cookie found:', name, '=', value);
      if (name === 'csrf-token') {
        return decodeURIComponent(value);
      }
    }
    console.log('csrf-token cookie not found');
    return null;
  }

  static async getCSRFToken() {
    // First try to get CSRF token from cookie (set during login)
    const cookieCsrfToken = this.getCsrfTokenFromCookie();
    if (cookieCsrfToken) {
      SecureAPI.#csrfToken = cookieCsrfToken;
      console.log("Using CSRF token from cookie:", SecureAPI.#csrfToken);
      return SecureAPI.#csrfToken;
    }

    // Fallback to localStorage
    const storedCsrfToken = localStorage.getItem('x-csrf-token');
    if (storedCsrfToken) {
      SecureAPI.#csrfToken = storedCsrfToken;
      console.log("Using CSRF token from storage:", SecureAPI.#csrfToken);
      return SecureAPI.#csrfToken;
    }

    if (SecureAPI.#csrfToken) {
      console.log("Using cached CSRF token from memory:", SecureAPI.#csrfToken);
      return SecureAPI.#csrfToken;
    }

    console.warn("No CSRF token available. User needs to login first.");
    return null; // Return null instead of throwing error
  }

  // New method to clear the CSRF token cache
  static clearCsrfToken() {
    SecureAPI.#csrfToken = null;
    sessionStorage.removeItem('csrfToken');
    console.log("CSRF token cache cleared from memory.");
  }

  // Method to set CSRF token from login
  static setCsrfToken(token) {
    SecureAPI.#csrfToken = token;
    sessionStorage.setItem('csrfToken', token);
    console.log("CSRF token set from login:", token);
  }

  static async secureRequest(url, options = {}) {
    const csrfToken = await this.getCSRFToken();
    // Get JWT token from where it's actually stored after login
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('access_token') || sessionStorage.getItem('token');
    
    console.log('JWT Token for request:', token ? 'Present' : 'Missing');
    
    const defaultHeaders = {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
      ...(token && { "Authorization": `Bearer ${token}` })
    };
    
    console.log('Sending CSRF token:', csrfToken);
    console.log('JWT Token present:', !!token);

    return fetch(`${this.BACKEND_URL}${url}`, {
      ...options,
      credentials: "include",
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });
  }
}

// -------------------- Validation Schema --------------------
const PaymentSchema = Yup.object().shape({
  firstName: Yup.string().matches(/^[A-Za-z]+$/, "Only alphabets allowed").min(2).max(20).required("First name is required"),
  lastName: Yup.string().matches(/^[A-Za-z]+$/, "Only alphabets allowed").min(2).max(20).required("Last name is required"),
  country: Yup.string().required("Country is required"),
  postalCode: Yup.string().matches(/^[0-9]{4,10}$/, "Invalid postal code").required("Postal code is required"),
  coupon: Yup.string().matches(/^[A-Za-z0-9]*$/, "Only letters & numbers allowed").notRequired(),
});

// -------------------- Inner Form Component --------------------
const AdvisorPaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [amount, setAmount] = useState(500000); // Amount in cents ($5000)
  const [couponApplied, setCouponApplied] = useState(false);
  const [originalAmount] = useState(500000);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [cardReady, setCardReady] = useState(false);

  // You might want to get the user's email from a global auth context
  // For now, assuming a placeholder or a way to pass it down
  const userEmail = "test@example.com"; // TODO: Replace with actual user email from context

  // Apply coupon (CSRF handled by SecureAPI.secureRequest)
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
          // Direct redirect to advisor-form
          setTimeout(() => {
            window.location.href = '/advisor-form';
          }, 2000);
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
    setSubmitting(true);
    if (!stripe || !elements) {
      toast.error("Stripe.js has not loaded yet. Please try again.");
      setSubmitting(false);
      return;
    }

    try {
      // 1️⃣ Create PaymentIntent with backend (CSRF handled by SecureAPI)
      const intentPayload = values.coupon?.trim() ? { couponCode: values.coupon.trim() } : {};
      const intentRes = await SecureAPI.secureRequest("/api/payment/create-intent", {
        method: "POST",
        body: JSON.stringify(intentPayload),
      });

      if (!intentRes.ok) {
        const errorData = await intentRes.json().catch(() => ({ message: "Unknown error" }));
        toast.error(errorData.message || "Failed to create payment intent ❌");
        setSubmitting(false);
        return;
      }
      const intentData = await intentRes.json();
      const clientSecret = intentData.clientSecret;

      if (!clientSecret) {
        toast.error("Failed to get client secret from backend ❌");
        setSubmitting(false);
        return;
      }

      const cardElement = elements.getElement(CardElement);

      // 2️⃣ Confirm payment on Stripe (CLIENT-SIDE) using CardElement
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { 
          card: cardElement, 
          billing_details: { 
              name: `${values.firstName} ${values.lastName}`,
              email: userEmail, // IMPORTANT: Ensure this is the actual logged-in user's email
              address: {
                  country: values.country,
                  postal_code: values.postalCode,
              }
          } 
        },
        // The return_url is more critical for PaymentElement or redirects.
        // For CardElement with confirmCardPayment, the result is usually immediate
        // without a full page redirect.
      });

      if (confirmError) {
        toast.error(confirmError.message || "Payment failed during Stripe confirmation ❌");
        console.error("Stripe client-side confirmation error:", confirmError);
        setSubmitting(false);
        return;
      }

      // Log the status after client-side confirmation for debugging
      console.log("Stripe client-side PaymentIntent status:", paymentIntent?.status);

      // 3️⃣ If Stripe client-side payment succeeded, tell your backend (with CSRF)
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const confirmBackendRes = await SecureAPI.secureRequest("/api/payment/confirm", {
          method: "POST",
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id // Use the ID returned by Stripe
          }),
        });

        if (!confirmBackendRes.ok) {
          const errorData = await confirmBackendRes.json().catch(() => ({ message: "Unknown backend confirmation error" }));
          toast.error(errorData.message || "Payment confirmed by Stripe, but backend failed to update profile ❌");
          console.error("Backend confirmation failed:", errorData);
          setSubmitting(false);
          return;
        }

        toast.success("Payment confirmed! 🎉 Redirecting to create your profile...");
        resetForm();
        // Direct redirect to advisor-form
        setTimeout(() => {
          window.location.href = '/advisor-form';
        }, 2000);
      } else {
        toast.error(`Stripe payment not succeeded. Current status: ${paymentIntent?.status || 'unknown'} ❌`);
      }
    } catch (err) {
      console.error("Payment process error:", err);
      toast.error("An unexpected error occurred during payment ❌");
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
          <p className="text-gray-600">Join our exclusive network of professional advisors</p>
        </div>
        
        {/* Pricing Display */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center justify-center space-x-4">
            {couponApplied && (
              <div className="text-right">
                <p className="text-sm text-gray-500 line-through">${(originalAmount / 100).toFixed(2)}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-800">${(amount / 100).toFixed(2)}</p>
              <p className="text-sm text-gray-500">One-time setup fee</p>
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
        initialValues={{ firstName: "", lastName: "", country: "", postalCode: "", coupon: "" }}
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <div className={`relative border-2 rounded-lg transition-colors ${
                    errors.country && touched.country 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 hover:border-blue-300 focus-within:border-blue-500'
                  }`}>
                    <div className="flex items-center px-4 py-3">
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
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <div className={`relative border-2 rounded-lg transition-colors ${
                    errors.postalCode && touched.postalCode 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200 hover:border-blue-300 focus-within:border-blue-500'
                  }`}>
                    <div className="flex items-center px-4 py-3">
                      <FaMapMarkerAlt className="mr-3 text-gray-400" />
                      <Field 
                        name="postalCode" 
                        placeholder="Enter postal code" 
                        className="w-full outline-none bg-transparent text-gray-800"
                      />
                    </div>
                  </div>
                  <ErrorMessage name="postalCode" component="p" className="text-red-500 text-sm flex items-center">
                    <span className="ml-1">⚠️</span>
                    <span className="ml-1">{errors.postalCode}</span>
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
                        placeholder="Enter promo code (optional)" 
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
                    Complete Payment • ${(amount / 100).toFixed(2)}
                  </>
                )}
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="text-center space-y-2 pt-4 border-t border-gray-200">
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
            </div>
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
        
        // Try to initialize CSRF token (optional for non-logged users)
        const csrfToken = await SecureAPI.getCSRFToken();
        if (!csrfToken) {
          console.log('No CSRF token available - user needs to login first');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize:", err);
        setStripeError('Failed to initialize payment system. Please refresh the page.');
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
          <div className="mt-8 text-center space-y-4">
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
            
          </div>
        </div>
      </div>
    </Elements>
  );
};

export default AdvisorPayments;