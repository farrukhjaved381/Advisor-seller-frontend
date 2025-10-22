import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/common/Header";
import Footer from "../../../components/common/Footer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const SellerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (!loading) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      
      // Update password strength if password field changes
      if (name === 'password') {
        setPasswordStrength(checkPasswordStrength(value));
      }
    }
  };

  // Password Strength Checker
  const checkPasswordStrength = (value) => {
    if (!value) return '';
    let strength = 0;
    if (value.length >= 8) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[a-z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) strength++;

    if (strength <= 2) return 'Weak';
    if (strength === 3 || strength === 4) return 'Medium';
    if (strength === 5) return 'Strong';
    return '';
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error("Last name is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid email format");
      return false;
    }
    if (!formData.password.trim()) {
      toast.error("Password is required");
      return false;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }
    if (!/[A-Z]/.test(formData.password)) {
      toast.error("Password must contain at least one uppercase letter");
      return false;
    }
    if (!/[0-9]/.test(formData.password)) {
      toast.error("Password must contain at least one number");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const finalData = {
      ...formData,
      name: formData.firstName + " " + formData.lastName,
      role: "seller",
    };
    delete finalData.firstName;
    delete finalData.lastName;

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:3003/api/auth/register",
        finalData
      );

      if (res.data) {
        localStorage.setItem("access_token", res.data.access_token);
        localStorage.setItem("refresh_token", res.data.refresh_token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        toast.success("Registration successful! Please check your email to verify.");
        setTimeout(() => {
          navigate("/continue");
        }, 1500);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "Registration failed!");
      } else {
        toast.error("Something went wrong. Try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="w-screen min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col overflow-x-hidden">
      <ToastContainer 
        position="top-center" 
        autoClose={3000}
        toastOptions={{
          style: {
            background: '#fff',
            color: '#17252a',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
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
            src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
            alt="Professional seller workspace with modern setup" 
            className="object-cover h-full w-full transform hover:scale-105 transition-transform duration-700" 
          />
          
          {/* Floating Welcome Card */}
          <div className="absolute top-4 left-4 md:top-8 md:left-8 z-20 w-[90%] md:w-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-xl max-w-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-4 h-4 bg-gradient-to-r from-primary to-third rounded-full animate-pulse"></div>
                <span className="text-secondary font-bold text-base md:text-lg">Join Our Community!</span>
              </div>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                Start your selling journey with our powerful platform and reach millions of customers.
              </p>
            </div>
          </div>
          
          {/* Features Badge */}
          <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-20">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 md:p-4 shadow-xl">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-secondary font-semibold text-xs md:text-sm">Verified Platform</span>
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
            className="relative z-10 w-full sm:w-[90%] md:w-[85%] max-w-2xl bg-white/70 backdrop-blur-sm rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/20"
          >
            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center bg-gradient-to-r from-primary/10 to-third/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                New Seller Registration
              </div>
              
              <h2 className="text-3xl font-black text-secondary mb-2">
                Create Your Account
              </h2>
              <p className="text-gray-600 font-medium">
                Join thousands of successful sellers today
              </p>
            </div>

            {/* Name Fields Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-secondary font-semibold text-sm mb-3">
                  First Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Enter first name"
                    className="w-full h-12 rounded-xl px-4 pl-11 bg-white/80 backdrop-blur-sm border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300 hover:border-gray-300 disabled:opacity-50"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-secondary font-semibold text-sm mb-3">
                  Last Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Enter last name"
                    className="w-full h-12 rounded-xl px-4 pl-11 bg-white/80 backdrop-blur-sm border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300 hover:border-gray-300 disabled:opacity-50"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-secondary font-semibold text-sm mb-3">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Enter your email"
                  className="w-full h-12 rounded-xl px-4 pl-11 bg-white/80 backdrop-blur-sm border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300 hover:border-gray-300 disabled:opacity-50"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-secondary font-semibold text-sm mb-3">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Create a strong password"
                  className="w-full h-12 rounded-xl px-4 pl-11 pr-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-300 hover:border-gray-300 disabled:opacity-50"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEye className="w-5 h-5" /> : <FaEyeSlash className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {/* {formData.password && passwordStrength && (
                <div className="flex items-center mt-3">
                  <div className="flex space-x-1 mr-3">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 w-6 rounded-full transition-colors ${
                          (passwordStrength === 'Weak' && i === 0) ||
                          (passwordStrength === 'Medium' && i <= 1) ||
                          (passwordStrength === 'Strong' && i <= 2)
                            ? passwordStrength === 'Weak'
                              ? 'bg-red-400'
                              : passwordStrength === 'Medium'
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength === 'Weak'
                        ? 'text-red-500'
                        : passwordStrength === 'Medium'
                        ? 'text-yellow-600'
                        : 'text-green-500'
                    }`}
                  >
                    {passwordStrength} Password
                  </span>
                </div>
              )} */}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-14 rounded-xl font-semibold text-white text-lg transition-all duration-300 flex items-center justify-center mb-6 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary to-third hover:shadow-2xl hover:shadow-primary/25 transform hover:scale-105 active:scale-95'
              }`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Create My Account</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>

            {/* Login link */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/seller-login')}
                  className="text-primary hover:text-third font-semibold transition-colors duration-200 hover:underline"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
      
    </div>
  );
};

export default SellerRegister;