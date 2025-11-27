// AdvisorPayments.jsx
import React, { useState, useEffect, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast, Toaster } from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
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
  FaSpinner,
} from "react-icons/fa";
import { API_CONFIG } from "../../../config/api";

// -------------------- URL Params --------------------
const getSearchParams = () => new URLSearchParams(window.location.search);

// -------------------- Stripe --------------------
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
).catch((err) => {
  console.error("Failed to load Stripe:", err);
  return null;
});

// -------------------- CSRF Helper (CRITICALLY REVISED) --------------------
class SecureAPI {
  static BACKEND_URL = API_CONFIG.BACKEND_URL;

  static getToken() {
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("access_token") ||
      sessionStorage.getItem("token") ||
      null
    );
  }

  static async secureRequest(path, options = {}) {
    const token = this.getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const body = options.body
      ? typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body)
      : undefined;

    return fetch(`${this.BACKEND_URL}${path}`, {
      ...options,
      headers,
      body,
      credentials: "include",
    });
  }
}

// -------------------- Validation Schema --------------------
const PaymentSchema = Yup.object().shape({
  firstName: Yup.string()
    .matches(/^[A-Za-z]+$/, "Only alphabets allowed")
    .min(2)
    .max(20)
    .required("First name is required"),
  lastName: Yup.string()
    .matches(/^[A-Za-z]+$/, "Only alphabets allowed")
    .min(2)
    .max(20)
    .required("Last name is required"),
  country: Yup.string().required("Country is required"),
  coupon: Yup.string()
    .matches(/^[A-Za-z0-9]*$/, "Only letters & numbers allowed")
    .notRequired(),
});

// -------------------- Inner Form Component --------------------
const AdvisorPaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (sessionStorage.getItem('subscriptionExpiredNotice')) {
        toast.error('Your membership has expired. Please update your billing to continue.');
        sessionStorage.removeItem('subscriptionExpiredNotice');
      }
    } catch (error) {
      // ignore storage errors
    }
  }, []);

  const [amount, setAmount] = useState(500000); // Amount in cents ($5000)
  const [couponApplied, setCouponApplied] = useState(false);
  const [originalAmount] = useState(500000);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const params = getSearchParams();
  const returnTo = params.get("return") || "/advisor-profile";
  const intent = params.get("intent") || "activate"; // 'renew' | 'resubscribe' | 'activate'

  // Autofill user info from localStorage if available
  let userEmail = null;
  let defaultFirstName = "";
  let defaultLastName = "";
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.email) userEmail = user.email;
      if (user.name) {
        const [first, ...rest] = user.name.split(" ");
        defaultFirstName = first || "";
        defaultLastName = rest.join(" ") || "";
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
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const prof = await fetch(`${API_CONFIG.BACKEND_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (prof.ok) {
          const data = await prof.json();
          setIsVerified(!!data.isPaymentVerified);
          if (data.role === "advisor") {
            // if API exposes isProfileComplete
            if (typeof data.isProfileComplete === "boolean") {
              setHasProfile(data.isProfileComplete);
            } else {
              // fallback: try advisors/profile
              const prof2 = await fetch(
                `${API_CONFIG.BACKEND_URL}/api/advisors/profile`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  credentials: "include",
                }
              );
              setHasProfile(prof2.ok);
            }
          }
        }
      } catch { }
    })();
  }, []);

  const validateToken = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/advisor-login", { replace: true });
      return null;
    }
    return token;
  };

  const redirectAfterPayment = () => {
    // If user already has profile or came for renewal/resubscribe, go to returnTo
    if (
      hasProfile ||
      isVerified ||
      intent === "renew" ||
      intent === "resubscribe"
    ) {
      window.location.href = returnTo || "/advisor-profile";
    } else {
      // Fresh activation flow
      window.location.href = "/advisor-form";
    }
  };

  // Helper to format amount with commas
  const formatAmount = (amt) => {
    return amt.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  const handleApplyCoupon = async (coupon) => {
    if (!coupon?.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsApplyingCoupon(true);

    try {
      // Check if it's a free trial coupon first
      if (coupon.trim().toUpperCase() === "FREETRIAL2024") {
        const response = await SecureAPI.secureRequest(
          "/api/payment/redeem-coupon",
          {
            method: "POST",
            body: JSON.stringify({ code: coupon.trim() }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          toast.success(
            "Free trial activated! 🎉 Redirecting to create your profile..."
          );
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
      const response = await SecureAPI.secureRequest(
        "/api/payment/create-intent",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (response.ok && data.amount !== undefined) {
        setAmount(data.amount);
        setCouponApplied(true);
        toast.success(
          `Coupon applied! New amount: $${(data.amount / 100).toFixed(2)}`
        );
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
    console.log('Payment submission started');
    const token = validateToken();
    console.log('Token validation result:', !!token);
    if (!token) {
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    console.log('Stripe initialization check:', { stripe: !!stripe, elements: !!elements });
    if (!stripe || !elements) {
      toast.error("Stripe.js has not loaded yet. Please try again.");
      setSubmitting(false);
      return;
    }

    const resolvedEmail =
      userEmail ||
      (() => {
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const parsed = JSON.parse(stored);
            return parsed?.email || null;
          }
        } catch (error) {
          console.error("Failed to resolve user email from storage", error);
        }
        return null;
      })();

    try {
      const cardElement = elements.getElement(CardElement);

      const { error: pmError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
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
        toast.error(pmError.message || "Unable to verify card.");
        console.error("Stripe createPaymentMethod error:", pmError);
        setSubmitting(false);
        return;
      }

      const paymentMethodId = paymentMethod?.id;
      if (!paymentMethodId) {
        toast.error(
          "Stripe did not return a valid payment method. Please try again."
        );
        setSubmitting(false);
        return;
      }

      console.log('Attempting to create subscription with:', {
        url: `${API_CONFIG.BACKEND_URL}/api/payment/create-subscription`,
        paymentMethodId,
        couponCode: values.coupon?.trim() || undefined
      });
      const subscriptionRes = await axios.post(
        `${API_CONFIG.BACKEND_URL}/api/payment/create-subscription`,
        {
          paymentMethodId,
          couponCode: values.coupon?.trim() || undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let {
        subscriptionId,
        clientSecret: subscriptionClientSecret,
        status,
      } = subscriptionRes.data || {};
      console.log(
        "[AdvisorPayments] subscription response",
        subscriptionRes.data
      );

      if (subscriptionClientSecret) {
        const paymentResult = await stripe.confirmCardPayment(
          subscriptionClientSecret
        );
        if (paymentResult.error) {
          toast.error(
            paymentResult.error.message || "Authentication was not completed."
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
            { headers: { Authorization: `Bearer ${token}` } }
          );
          status = finalizeRes.data?.status || status;
        } catch (error) {
          console.error("Finalize subscription failed:", error);
          toast.error(
            error?.response?.data?.message ||
            "Subscription payment completed, but we could not finalize your account. Please contact support."
          );
          setSubmitting(false);
          return;
        }
      }

      if (!["active", "trialing"].includes(status)) {
        toast.error(
          "We received your card details, but the subscription is not active yet. Please contact support to complete activation."
        );
        setSubmitting(false);
        return;
      }

      toast.success(
        status === "trialing"
          ? "Subscription activated. Enjoy your trial period!"
          : "Subscription activated successfully. Redirecting..."
      );

      resetForm();
      setTimeout(() => {
        redirectAfterPayment();
      }, 1200);
    } catch (err) {
      console.error("Payment process error:", err?.response?.data || err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "An unexpected error occurred during payment.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-primary to-third">
          <FaShieldAlt className="text-2xl text-white" />
        </div>
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            Advisor Membership
          </h1>
          <p className="text-gray-600">
            Help us to get in front of "Off Market" and convince sellers to use
            you
          </p>
        </div>

        {/* Pricing Display */}
        <div className="p-6 border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
          <div className="flex items-center justify-center space-x-4">
            {couponApplied && (
              <div className="text-right">
                <p className="text-sm text-gray-500 line-through">
                  ${formatAmount(originalAmount / 100)} USD
                </p>
              </div>
            )}
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-800">
                ${formatAmount(amount / 100)} USD
              </p>
              <p className="text-sm text-gray-500">Yearly Subscription</p>
            </div>
            {couponApplied && (
              <div className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
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
          coupon: "",
        }}
        validationSchema={PaymentSchema}
        onSubmit={handleSubmitPayment}
      >
        {({ values, isSubmitting, errors, touched }) => (
          <Form className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="flex items-center text-lg font-semibold text-gray-800">
                <FaUser className="mr-2 text-blue-500" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <div
                    className={`relative border-2 rounded-lg transition-colors ${errors.firstName && touched.firstName
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 hover:border-blue-300 focus-within:border-blue-500"
                      }`}
                  >
                    <div className="flex items-center px-4 py-3">
                      <FaUser className="mr-3 text-gray-400" />
                      <Field
                        name="firstName"
                        placeholder="Enter first name"
                        className="w-full text-gray-800 bg-transparent outline-none"
                      />
                    </div>
                  </div>
                  <ErrorMessage
                    name="firstName"
                    component="p"
                    className="flex items-center text-sm text-red-500"
                  >
                    <span className="ml-1">⚠️</span>
                    <span className="ml-1">{errors.firstName}</span>
                  </ErrorMessage>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <div
                    className={`relative border-2 rounded-lg transition-colors ${errors.lastName && touched.lastName
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 hover:border-blue-300 focus-within:border-blue-500"
                      }`}
                  >
                    <div className="flex items-center px-4 py-3">
                      <FaUser className="mr-3 text-gray-400" />
                      <Field
                        name="lastName"
                        placeholder="Enter last name"
                        className="w-full text-gray-800 bg-transparent outline-none"
                      />
                    </div>
                  </div>
                  <ErrorMessage
                    name="lastName"
                    component="p"
                    className="flex items-center text-sm text-red-500"
                  >
                    <span className="ml-1">⚠️</span>
                    <span className="ml-1">{errors.lastName}</span>
                  </ErrorMessage>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="flex items-center text-lg font-semibold text-gray-800">
                <FaMapMarkerAlt className="mr-2 text-blue-500" />
                Location Details
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="col-span-1 space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <div
                    className={`relative border-2 rounded-lg transition-colors ${errors.country && touched.country
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 hover:border-blue-300 focus-within:border-blue-500"
                      }`}
                  >
                    <div className="flex items-center w-full px-4 py-3">
                      <FaGlobe className="mr-3 text-gray-400" />
                      {/* Country Select */}
                      <Field
                        as="select"
                        name="country"
                        className="w-full text-gray-800 bg-transparent outline-none"
                      >
                        <option value="">Select your country</option>
                        <option value="US">🇺🇸 United States</option>
                        <option value="CA">🇨🇦 Canada</option>
                        <option value="MX">🇲🇽 Mexico</option>
                        <option value="GB">🇬🇧 United Kingdom</option>
                        <option value="AU">🇦🇺 Australia</option>
                        <option value="BR">🇧🇷 Brazil</option>
                        <option value="CH">🇨🇭 Switzerland</option>
                        <option value="CN">🇨🇳 China</option>
                        <option value="HK">🇭🇰 Hong Kong</option>
                        <option value="IN">🇮🇳 India</option>
                        <option value="JP">🇯🇵 Japan</option>
                        <option value="KR">🇰🇷 South Korea</option>
                        <option value="NO">🇳🇴 Norway</option>
                        <option value="NZ">🇳🇿 New Zealand</option>
                        <option value="PK">🇵🇰 Pakistan</option>
                        <option value="RU">🇷🇺 Russia</option>
                        <option value="SE">🇸🇪 Sweden</option>
                        <option value="SG">🇸🇬 Singapore</option>
                        <option value="TR">🇹🇷 Turkey</option>
                        <option value="ZA">🇿🇦 South Africa</option>
                      </Field>
                    </div>
                  </div>
                  <ErrorMessage
                    name="country"
                    component="p"
                    className="flex items-center text-sm text-red-500"
                  >
                    <span className="ml-1">⚠️</span>
                    <span className="ml-1">{errors.country}</span>
                  </ErrorMessage>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="flex items-center text-lg font-semibold text-gray-800">
                <FaCreditCard className="mr-2 text-blue-500" />
                Payment Information
              </h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Card Details
                </label>
                <div className="px-4 py-4 transition-colors bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 focus-within:border-blue-500">
                  {stripe ? (
                    <CardElement
                      options={{
                        hidePostalCode: true,
                        style: {
                          base: {
                            fontSize: "16px",
                            color: "#374151",
                            fontFamily:
                              '"Inter", "Segoe UI", system-ui, sans-serif',
                            fontSmoothing: "antialiased",
                            "::placeholder": {
                              color: "#9CA3AF",
                            },
                          },
                          invalid: {
                            color: "#EF4444",
                            iconColor: "#EF4444",
                          },
                        },
                        // 👇 This prevents browser autofill suggestions
                        disableLink: true, // disables "Autofill" link
                      }}
                      onReady={() => {
                        console.log("CardElement ready");
                        setCardReady(true);
                      }}
                      onChange={(event) => {
                        if (event.error) {
                          console.error("CardElement error:", event.error);
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-12">
                      <FaSpinner className="mr-2 text-blue-500 animate-spin" />
                      <p className="text-gray-500">
                        Loading secure payment form...
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <FaLock className="mr-2" />
                  <span>Your payment information is encrypted and secure</span>
                </div>
              </div>
            </div>

            {/* Coupon Section */}
            <div className="space-y-4">
              <h3 className="flex items-center text-lg font-semibold text-gray-800">
                <FaGift className="mr-2 text-green-500" />
                Promotional Code
              </h3>

              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <div className="transition-colors border-2 border-gray-200 rounded-lg hover:border-green-300 focus-within:border-green-500">
                    <div className="flex items-center px-4 py-3">
                      <FaGift className="mr-3 text-gray-400" />
                      <Field
                        name="coupon"
                        placeholder="Enter promo code"
                        className="w-full text-gray-800 bg-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyCoupon(values.coupon)}
                  disabled={isApplyingCoupon || !values.coupon?.trim()}
                  className="flex items-center px-6 py-3 font-medium text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isApplyingCoupon ? (
                    <>
                      <FaSpinner className="mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    "Apply"
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
                    <FaSpinner className="mr-3 animate-spin" />
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
            <div className="flex flex-col items-center justify-center mt-5">
              <div className="flex flex-col items-center w-full max-w-md p-3 border border-blue-100 shadow bg-blue-50 rounded-xl">
                <div className="flex items-center mb-1">
                  <FaCheckCircle className="mr-1 text-lg text-green-500" />
                  <span className="text-base font-semibold text-blue-900">
                    Next step
                  </span>
                </div>
                <span className="text-base font-bold text-secondary">
                  Complete your profile
                </span>
                <span className="mt-1 text-xs text-center text-gray-500">
                  After payment, you'll finish your advisor profile to activate
                  your account.
                </span>
                <span className="inline-block bg-blue-100 text-blue-700 text-[11px] font-semibold px-2 py-1 rounded mt-2"></span>
              </div>
            </div>

            {/* Trust Indicators */}
            {/* <div className="pt-4 space-y-2 text-center border-t border-gray-200">
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
  const [showRequirementsModal, setShowRequirementsModal] = useState(true);
  const modalCloseBtnRef = useRef(null);

  // Focus the close button when modal opens, handle Escape to close, and prevent background scroll
  useEffect(() => {
    if (!showRequirementsModal) return;

    const prevOverflow = document.body.style.overflow;
    // Prevent background scrolling while modal is open
    document.body.style.overflow = "hidden";

    // Focus the dismiss button for keyboard users
    const timer = setTimeout(() => {
      try {
        modalCloseBtnRef.current?.focus();
      } catch {
        // ignore focus errors in some browsers
        console.debug("Modal focus failed");
      }
    }, 50);

    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        setShowRequirementsModal(false);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow || "";
    };
  }, [showRequirementsModal]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Test Stripe loading
        const stripe = await stripePromise;
        if (!stripe) {
          setStripeError("Failed to load Stripe. Please refresh the page.");
          return;
        }
        console.log("Stripe loaded successfully");
      } catch (err) {
        console.error("Failed to initialize:", err);
        setStripeError(
          "Failed to initialize payment system. Please refresh the page."
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <FaSpinner className="text-2xl text-white animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Initializing Payment System
            </h2>
            <p className="text-gray-600">
              Please wait while we prepare your secure checkout...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (stripeError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="w-full max-w-md p-8 text-center bg-white shadow-2xl rounded-3xl">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full">
            <FaShieldAlt className="text-2xl text-red-500" />
          </div>
          <h1 className="mb-4 text-2xl font-bold text-red-600">
            Payment System Error
          </h1>
          <p className="mb-6 text-gray-600">{stripeError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 font-semibold text-white transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 sm:p-6">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              minWidth: "300px",
              maxWidth: "500px",
              borderRadius: "12px",
              fontSize: "14px",
              padding: "12px 16px",
            },
            duration: 4000,
            success: {
              iconTheme: {
                primary: "#10B981",
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#ffffff",
              },
            },
          }}
        />
        <div className="w-full max-w-2xl px-4 mx-auto sm:px-6 md:px-8 lg:px-0">
          {/* Requirements Modal */}
          {showRequirementsModal && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="requirements-title"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-50 bg-black/40 backdrop-blur-md sm:p-6 animate-fadeIn"
              style={{
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .modal-content {
          animation: slideUp 0.4s ease-out;
        }
        .requirement-item {
          animation: slideUp 0.5s ease-out backwards;
        }
        .requirement-item:nth-child(1) { animation-delay: 0.1s; }
        .requirement-item:nth-child(2) { animation-delay: 0.2s; }
        .requirement-item:nth-child(3) { animation-delay: 0.3s; }

        /* Hide scrollbar but keep scroll functionality */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }

        /* Optional: smooth scroll feel (mobile-like physics) */
        .smooth-scroll {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>

              <div className="w-full max-w-lg sm:max-w-xl md:max-w-2xl p-6 sm:p-8 md:p-10 text-left bg-white shadow-2xl modal-content rounded-3xl overflow-y-auto no-scrollbar smooth-scroll max-h-[90vh]">
                {/* Header */}
                <div className="flex flex-col items-center mb-6 text-center">
                  <div className="flex items-center justify-center mb-4 rounded-full shadow-lg w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600">
                    <FaShieldAlt className="text-xl text-white sm:text-2xl" />
                  </div>
                  <h2 id="requirements-title" className="text-xl font-bold text-gray-900 sm:text-2xl">
                    Advisor Requirements
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 sm:text-base">
                    Please review the following qualifications
                  </p>
                </div>

                {/* Requirements */}
                <div className="mb-6 space-y-4">
                  {[
                    {
                      color: 'green',
                      title: 'Experience Required',
                      desc: 'Minimum ',
                      highlight: '5 years',
                      descEnd: ' of practicing as a M&A Advisor, Broker, or Investment Banker'
                    },
                    {
                      color: 'green',
                      title: 'Transaction History',
                      desc: 'Successfully completed at least ',
                      highlight: '10 company sale transactions',
                      descEnd: ''
                    },
                    {
                      color: 'green',
                      title: 'Client Testimonials',
                      desc: 'You will be required to provide ',
                      highlight: '1 customer testimonials',
                      descEnd: ' from previous customers'
                    }
                  ].map((req, i) => (
                    <div
                      key={i}
                      className={`flex flex-col sm:flex-row sm:items-start p-4 border-2 border-${req.color}-100 requirement-item rounded-xl bg-${req.color}-50 hover:bg-${req.color}-100 hover:border-${req.color}-200 transition-all duration-300`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-0 sm:mr-3 bg-green-500 rounded-full flex-shrink-0`}>
                        <FaCheckCircle className="text-sm text-white sm:text-base" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 sm:text-base md:text-lg">{req.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-gray-700 sm:text-sm md:text-base">
                          {req.desc}
                          <span className={`font-bold text-${req.color}-600`}>{req.highlight}</span>
                          {req.descEnd}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Note */}
                <div className="p-3 mb-6 border-l-4 border-blue-500 rounded-r-lg sm:p-4 bg-blue-50">
                  <p className="text-xs text-gray-700 sm:text-sm">
                    <span className="font-semibold text-blue-900">Important:</span> These requirements ensure we maintain the highest quality standards for our advisor network.
                  </p>
                </div>

                {/* Button */}
                <div className="flex justify-center">
                  <button
                    ref={modalCloseBtnRef}
                    onClick={() => setShowRequirementsModal(false)}
                    className="w-full px-6 py-3 text-sm font-semibold text-white transition-all duration-300 transform shadow-lg sm:w-auto sm:px-8 sm:py-4 sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                  >
                    I Understand & Agree to Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Payment Form */}
          <div
            className="overflow-hidden bg-white shadow-2xl rounded-3xl"
            aria-hidden={showRequirementsModal ? 'true' : 'false'}
          >
            <div className="px-4 py-8 sm:px-8 sm:py-10 md:py-12">
              <AdvisorPaymentForm />
            </div>
          </div>
        </div>


      </div>
    </Elements>
  );
};

export default AdvisorPayments;
