// AdvisorPayments.jsx
import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast, Toaster } from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { FaUser, FaGlobe, FaMapMarkerAlt, FaGift } from "react-icons/fa";

// -------------------- Stripe --------------------
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// -------------------- CSRF Helper (CRITICALLY REVISED) --------------------
class SecureAPI {
  static BACKEND_URL = "https://advisor-seller-backend-7to2psxx7-farrukhjaved381s-projects.vercel.app";
  static #csrfToken = null; // In-memory cache for the CSRF token

  static async getCSRFToken() {
    if (SecureAPI.#csrfToken) {
      console.log("Using cached CSRF token from memory:", SecureAPI.#csrfToken);
      return SecureAPI.#csrfToken;
    }

    try {
      const response = await fetch(`${this.BACKEND_URL}/api/auth/csrf-token`, {
        credentials: "include", // This sends the HttpOnly session cookie
      });
      if (!response.ok) {
        // Log more details from the backend if possible
        const errorText = await response.text();
        throw new Error(`Failed to fetch CSRF token: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      if (data.csrfToken) {
        SecureAPI.#csrfToken = data.csrfToken; // Store in in-memory cache
        console.log("CSRF token fetched and stored in memory:", SecureAPI.#csrfToken);
        return SecureAPI.#csrfToken;
      }
      throw new Error("CSRF token not found in response data");
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      toast.error("Security Error: Could not load. Please check your login status.");
      // Potentially redirect to login here if there's a strong assumption of auth
      throw error; // Re-throw to propagate the error
    }
  }

  // New method to clear the CSRF token cache
  static clearCsrfToken() {
    SecureAPI.#csrfToken = null;
    console.log("CSRF token cache cleared from memory.");
    // If you had a JWT in localStorage (which we moved to HttpOnly), you'd clear it here too.
  }

  static async secureRequest(url, options = {}) {
    const csrfToken = await this.getCSRFToken(); // Always get the current/fresh token
    const defaultHeaders = {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken, // THIS IS THE CRUCIAL HEADER
    };

    return fetch(`${this.BACKEND_URL}${url}`, {
      ...options,
      credentials: "include", // Ensure cookies are sent
      headers: {
        ...defaultHeaders,
        ...options.headers, // Allow overriding headers
      },
    });
  }
}

// -------------------- Validation Schema --------------------
const PaymentSchema = Yup.object().shape({
  firstName: Yup.string().matches(/^[A-Za-z]+$/, "Only alphabets allowed").min(2).max(20).required(),
  lastName: Yup.string().matches(/^[A-Za-z]+$/, "Only alphabets allowed").min(2).max(20).required(),
  country: Yup.string().required("Country is required"),
  postalCode: Yup.string().matches(/^[0-9]{4,10}$/, "Invalid postal code").required(),
  coupon: Yup.string().matches(/^[A-Za-z0-9]*$/, "Only letters & numbers allowed").notRequired(),
});

// -------------------- Inner Form Component --------------------
const AdvisorPaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [amount, setAmount] = useState(5000); // Amount in cents
  const [couponApplied, setCouponApplied] = useState(false);

  // You might want to get the user's email from a global auth context
  // For now, assuming a placeholder or a way to pass it down
  const userEmail = "test@example.com"; // TODO: Replace with actual user email from context

  // Apply coupon (CSRF handled by SecureAPI.secureRequest)
  const handleApplyCoupon = async (coupon) => {
    if (!coupon?.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    try {
      // Check if it's a free trial coupon first
      if (coupon.trim().toUpperCase() === 'FREETRIAL2024') {
        const response = await SecureAPI.secureRequest("/api/payment/redeem-coupon", {
          method: "POST",
          body: JSON.stringify({ code: coupon.trim() }),
        });

        const data = await response.json();
        if (response.ok) {
          toast.success("Free trial activated! 🎉 You can now create your profile.");
          // Redirect to profile creation
          setTimeout(() => {
            window.location.href = '/advisor/create-profile';
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

        toast.success("Payment confirmed and profile activated! 🎉");
        resetForm();
        // Redirect user to create advisor profile or success page
        // window.location.href = '/advisor/create-profile'; // Example redirect
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
    <Formik
      initialValues={{ firstName: "", lastName: "", country: "", postalCode: "", coupon: "" }}
      validationSchema={PaymentSchema}
      onSubmit={handleSubmitPayment}
    >
      {({ values, isSubmitting }) => (
        <Form className="flex flex-col gap-4">
          {/* Name Fields */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center border rounded-lg px-3 py-2">
              <FaUser className="mr-2 text-gray-500" />
              <Field name="firstName" placeholder="John" className="w-full outline-none" />
            </div>
            <div className="flex-1 flex items-center border rounded-lg px-3 py-2">
              <FaUser className="mr-2 text-gray-500" />
              <Field name="lastName" placeholder="Doe" className="w-full outline-none" />
            </div>
          </div>
          <ErrorMessage name="firstName" component="p" className="text-red-500 text-sm" />
          <ErrorMessage name="lastName" component="p" className="text-red-500 text-sm" />

          {/* Country */}
          <div className="flex items-center border rounded-lg px-3 py-2">
            <FaGlobe className="mr-2 text-gray-500" />
            <Field as="select" name="country" className="w-full outline-none">
              <option value="">Select country*</option>
              <option value="Pakistan">Pakistan</option>
              <option value="USA">USA</option>
              <option value="UK">UK</option>
            </Field>
          </div>
          <ErrorMessage name="country" component="p" className="text-red-500 text-sm" />

          {/* Postal Code */}
          <div className="flex items-center border rounded-lg px-3 py-2">
            <FaMapMarkerAlt className="mr-2 text-gray-500" />
            <Field name="postalCode" placeholder="12345" className="w-full outline-none" />
          </div>
          <ErrorMessage name="postalCode" component="p" className="text-red-500 text-sm" />

          {/* Card Element */}
          <div className="border rounded-lg px-3 py-2">
            <CardElement options={{ hidePostalCode: true }} />
          </div>

          {/* Coupon */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center border rounded-lg px-3 py-2">
              <FaGift className="mr-2 text-gray-500" />
              <Field name="coupon" placeholder="DISCOUNT50" className="w-full outline-none" />
            </div>
            <button
              type="button"
              onClick={() => handleApplyCoupon(values.coupon)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Apply
            </button>
          </div>

          {/* Setup Coupons for Testing */}
          <button
            type="button"
            onClick={async () => {
              try {
                const response = await fetch(`${SecureAPI.BACKEND_URL}/api/payment/setup-coupons`);
                if (response.ok) {
                  toast.success("Test coupons created! Try: FREETRIAL2024, DISCOUNT50, SAVE1000");
                } else {
                  toast.error("Failed to setup coupons");
                }
              } catch (err) {
                toast.error("Error setting up coupons");
              }
            }}
            className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition mb-2"
          >
            Setup Test Coupons (Dev Only)
          </button>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !stripe || !elements}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {isSubmitting ? "Processing..." : `Pay $${(amount / 100).toFixed(2)}`}
          </button>
        </Form>
      )}
    </Formik>
  );
};

// -------------------- Wrapper Component (Revised) --------------------
const AdvisorPayments = () => {
  // useEffect to ensure CSRF token is fetched initially for the current session.
  // This is crucial for authentication and CSRF to be in sync.
  useEffect(() => {
    const fetchCsrfTokenForSession = async () => {
      try {
        await SecureAPI.getCSRFToken();
      } catch (err) {
        console.error("Failed to initialize CSRF token on mount:", err);
        // Display an error or redirect to login if CSRF token cannot be fetched
        // This indicates a potential problem with the current user's session
        toast.error("Could not securely initialize payment form. Please log in again.");
        // Example: setTimeout(() => window.location.href = '/login', 3000);
      }
    };

    fetchCsrfTokenForSession();

    // IMPORTANT: Integrate SecureAPI.clearCsrfToken() and SecureAPI.getCSRFToken()
    // with your global login/logout/session management context.
    // E.g., if you have an AuthContext that handles login/logout:
    // AuthContext.onLogin(() => { SecureAPI.clearCsrfToken(); SecureAPI.getCSRFToken(); });
    // AuthContext.onLogout(() => { SecureAPI.clearCsrfToken(); });

  }, []); // Empty dependency array means this runs once on mount, like a global init

  return (
    <Elements stripe={stripePromise}>
      <div className="w-full min-h-screen flex justify-center items-center bg-gray-100 p-6">
        <Toaster
          position="top-center"
          toastOptions={{ style: { minWidth: "400px", maxWidth: "600px" } }}
        />
        <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Advisor Payments</h1>
          <AdvisorPaymentForm />
        </div>
      </div>
    </Elements>
  );
};

export default AdvisorPayments;