import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/common/Header";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Email Validation
  const validateEmail = (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return "Email is required";
    if (!regex.test(value)) return "Please enter a valid email address";
    return "";
  };

  // Password Validation
  const validatePassword = (value) => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters long";
    return "";
  };

  // Password Strength Checker
  const checkPasswordStrength = (value) => {
    let strength = 0;
    if (value.length >= 8) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[a-z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) strength++;

    if (strength <= 2) return "Weak";
    if (strength === 3 || strength === 4) return "Medium";
    if (strength === 5) return "Strong";
    return "";
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
    setPasswordStrength(checkPasswordStrength(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    setEmailError(emailValidation);
    setPasswordError(passwordValidation);

    if (!emailValidation && !passwordValidation) {
      setLoading(true);
      try {
        // Login request
        const res = await axios.post(
          "https://advisor-seller-backend.vercel.app/api/auth/login",
          { email, password },
          { withCredentials: true, validateStatus: () => true }
        );

        if (res.status === 200 || res.status === 201) {
          toast.success("Login successful ✅");

          const accessToken = res.data.access_token;
          localStorage.setItem("access_token", accessToken);

          if (res.data.refresh_token) {
            localStorage.setItem("refresh_token", res.data.refresh_token);
          }
          if (res.data.user) {
            localStorage.setItem("user", JSON.stringify(res.data.user));
          }

          // Get CSRF token with Authorization header
          const csrfRes = await axios.get(
            "https://advisor-seller-backend.vercel.app/api/auth/csrf-token",
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              withCredentials: true,
              validateStatus: () => true,
            }
          );

          if (csrfRes.status === 200 || csrfRes.status === 201) {
            localStorage.setItem("x-csrf-token", csrfRes.data.csrfToken);
          } else {
            toast.error(csrfRes.data?.message || "Failed to fetch CSRF token");
          }

          console.log("Login Bearer token:", localStorage.getItem("access_token"));
          console.log("Login CSRF token:", localStorage.getItem("x-csrf-token"));

          // Fetch fresh user data to get current profile status
          const userRes = await axios.get(
            "https://advisor-seller-backend.vercel.app/api/auth/profile",
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          
          const user = userRes.data;
          console.log('User data from API:', user);
          localStorage.setItem("user", JSON.stringify(user));

          // If email is not verified, show specific message and stop
          if (user.role === 'advisor' && user.isEmailVerified === false) {
            toast.error('Please verify your email first.');
            setLoading(false);
            return;
          }

          if (user.role === "advisor") {
            if (!user.isPaymentVerified) {
              navigate("/advisor-payments");
            } else {
              // Check if advisor profile exists by trying to fetch it
              try {
                const profileRes = await axios.get(
                  "https://advisor-seller-backend.vercel.app/api/advisors/profile",
                  { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                
                if (profileRes.status === 200 && profileRes.data) {
                  console.log('Profile exists, redirecting to dashboard');
                  window.location.href = '/advisor-dashboard';
                  return;
                }
              } catch (profileErr) {
                console.log('No profile found, redirecting to form');
              }
              
              navigate("/advisor-form");
            }
          } else if (user.role === "seller") {
            navigate("/seller-dashboard");
          } else {
            navigate("/"); // fallback
          }
        } else if (res.status === 401) {
          const msg = res.data?.message || 'Incorrect email or password';
          toast.error(msg + " ❌");
        } else {
          toast.error(res.data?.message || "Something went wrong");
        }
      } catch (err) {
        console.error("Login error:", err);
        toast.error("Network error. Please try again later.");
      } finally {
        setLoading(false);
      }
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
            background: "#fff",
            color: "#17252a",
            borderRadius: "12px",
            padding: "16px",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          },
        }}
      />
<Header />
      {/* Main Content */}
      <div className="flex-grow w-full flex flex-col md:flex-row items-stretch pt-10 md:pt-20">
        {/* Left Side - Image */}
        <div className="w-full md:w-[45%] relative overflow-hidden min-h-[260px] md:min-h-0 h-64 md:h-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-third/30 z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80"
            alt="Professional advisor workspace"
            className="object-cover h-full w-full transform hover:scale-105 transition-transform duration-700"
          />

          {/* Floating Welcome Card */}
          <div className="absolute top-4 left-4 md:top-8 md:left-8 z-20 w-[90%] md:w-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-xl max-w-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-4 h-4 bg-gradient-to-r from-primary to-third rounded-full animate-pulse"></div>
                <span className="text-secondary font-bold text-base md:text-lg">
                  Welcome Back!
                </span>
              </div>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                Access your advisor dashboard and manage your account seamlessly.
              </p>
            </div>
          </div>

          {/* Security Badge */}
          <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-20">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 md:p-4 shadow-xl">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 md:w-5 md:h-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-secondary font-semibold text-xs md:text-sm">
                  Secure Login
                </span>
              </div>
            </div>
          </div>

          {/* Decorative Pattern */}
          <div className="absolute bottom-0 left-0 right-0 h-16 md:h-32 bg-gradient-to-t from-secondary/10 to-transparent z-10"></div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-[55%] flex justify-center items-center min-h-[340px] md:min-h-screen bg-gradient-to-bl from-white to-gray-50/50 relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-16 md:top-32 right-8 md:right-32 w-24 md:w-40 h-24 md:h-40 bg-primary rounded-full blur-3xl"></div>
            <div className="absolute bottom-16 md:bottom-32 left-8 md:left-20 w-32 md:w-56 h-32 md:h-56 bg-third rounded-full blur-3xl"></div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="relative z-10 w-full sm:w-[90%] md:w-[70%] max-w-md bg-white/70 backdrop-blur-sm rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/20"
          >
            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center bg-gradient-to-r from-primary/10 to-third/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Advisor Portal
              </div>

              <h2 className="text-3xl font-black text-secondary mb-2">
                Welcome Back!
              </h2>
              <p className="text-gray-600 font-medium">
                Sign in to your advisor account
              </p>
            </div>

            {/* Email Field */}
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-secondary font-semibold text-sm mb-3"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={loading}
                  placeholder="Enter your email"
                  className={`w-full h-12 rounded-xl px-4 pl-11 bg-white/80 backdrop-blur-sm border-2 focus:ring-2 outline-none transition-all duration-300 ${
                    emailError
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-primary focus:ring-primary/20 hover:border-gray-300"
                  }`}
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
              {emailError && (
                <div className="flex items-center mt-2 text-red-500 text-sm">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {emailError}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-secondary font-semibold text-sm mb-3"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={handlePasswordChange}
                  disabled={loading}
                  placeholder="Enter your password"
                  className={`w-full h-12 rounded-xl px-4 pl-11 pr-12 bg-white/80 backdrop-blur-sm border-2 focus:ring-2 outline-none transition-all duration-300 ${
                    passwordError
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-primary focus:ring-primary/20 hover:border-gray-300"
                  }`}
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <FaEye className="w-5 h-5" />
                  ) : (
                    <FaEyeSlash className="w-5 h-5" />
                  )}
                </button>
              </div>

              {passwordError && (
                <div className="flex items-center mt-2 text-red-500 text-sm">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {passwordError}
                </div>
              )}

              {/* {password && !passwordError && (
                <div className="flex items-center mt-2">
                  <div className="flex space-x-1 mr-3">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 w-6 rounded-full transition-colors ${
                          (passwordStrength === "Weak" && i === 0) ||
                          (passwordStrength === "Medium" && i <= 1) ||
                          (passwordStrength === "Strong" && i <= 2)
                            ? passwordStrength === "Weak"
                              ? "bg-red-400"
                              : passwordStrength === "Medium"
                              ? "bg-yellow-400"
                              : "bg-green-400"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength === "Weak"
                        ? "text-red-500"
                        : passwordStrength === "Medium"
                        ? "text-yellow-600"
                        : "text-green-500"
                    }`}
                  >
                    {passwordStrength} Password
                  </span>
                </div>
              )} */}
            </div>

            {/* Forgot Password */}
            <div className="text-right mb-6">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-primary hover:text-third font-medium text-sm transition-colors duration-200 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-14 rounded-xl font-semibold text-white text-lg transition-all duration-300 flex items-center justify-center ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary to-third hover:shadow-2xl hover:shadow-primary/25 transform hover:scale-105 active:scale-95"
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Sign In to Account</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
              )}
            </button>

            {/* Sign up link */}
            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/advisor-register")}
                  className="text-primary hover:text-third font-semibold transition-colors duration-200 hover:underline"
                >
                  Create Account
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
