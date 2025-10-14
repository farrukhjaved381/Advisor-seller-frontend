import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/common/Header";
import Footer from "../../../components/common/Footer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const AdvisorRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (!loading) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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
      role: "advisor",
    };
    delete finalData.firstName;
    delete finalData.lastName;

    try {
      setLoading(true);
      console.log("Final payload being sent:", finalData);
      const res = await axios.post(
        "http://localhost:3000/api/auth/register",
        finalData
      );

      if (res.data) {
        // Don't store tokens immediately - user needs to verify email first
        toast.success("Registration successful! Please check your email to verify your account.");
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
  <div className="flex flex-col w-screen min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-50 to-white">
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
      <div className="flex flex-col items-stretch flex-grow w-full pt-10 md:flex-row md:pt-20">
        {/* Left Side - Image */}
        <div className="w-full md:w-[45%] relative overflow-hidden min-h-[260px] md:min-h-0 h-64 md:h-[100vh]">
          <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary/20 to-third/30"></div>
          <img 
            src="/handshake.png"
            alt="Professional advisor consultation workspace" 
            className="object-cover w-full h-full transition-transform duration-700 transform hover:scale-105" 
          />
          
          {/* Floating Welcome Card */}
          <div className="absolute top-4 left-4 md:top-8 md:left-8 z-20 w-[90%] md:w-auto">
            <div className="max-w-sm p-4 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl md:p-6">
              <div className="flex items-center mb-3 space-x-3">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-primary to-third animate-pulse"></div>
                <span className="text-base font-bold text-secondary md:text-lg">Expand Your Pipeline!</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-600 md:text-sm">
                Connect with business owners who are serious about selling and understand the value of professional M&A guidance.
              </p>
            </div>
          </div>
          
          {/* Features Badge */}
          <div className="absolute z-20 bottom-4 right-4 md:bottom-8 md:right-8">
            <div className="p-2 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl md:p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-500 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-secondary md:text-sm">Expert Network</span>
              </div>
            </div>
          </div>
          
          {/* Decorative Pattern */}
          <div className="absolute bottom-0 left-0 right-0 z-10 h-16 md:h-32 bg-gradient-to-t from-secondary/10 to-transparent"></div>
        </div>
        
        {/* Right Side - Form */}
        <div className="w-full md:w-[55%] flex justify-center items-center min-h-[340px] md:min-h-screen bg-gradient-to-bl from-white to-gray-50/50 relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute w-24 h-24 rounded-full top-16 md:top-32 right-8 md:right-32 md:w-40 md:h-40 bg-primary blur-3xl"></div>
            <div className="absolute w-32 h-32 rounded-full bottom-16 md:bottom-32 left-8 md:left-20 md:w-56 md:h-56 bg-third blur-3xl"></div>
          </div>
          
          <form
            onSubmit={handleSubmit}
            className="relative z-10 w-full sm:w-[90%] md:w-[85%] max-w-2xl bg-white/70 backdrop-blur-sm rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/20"
          >
            {/* Header Section */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center px-4 py-2 mb-4 text-sm font-semibold rounded-full bg-gradient-to-r from-primary/10 to-third/10 text-primary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Advisor Registration
              </div>
              
              <h2 className="mb-2 text-3xl font-black text-secondary">
                Join the Only M&A Advisor Matching Service

              </h2>
              <p className="font-medium text-gray-600">
               Get matched with business owners actively seeking M&A representation
              </p>
            </div>

            {/* Name Fields Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block mb-3 text-sm font-semibold text-secondary">
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
                    className="w-full h-12 px-4 transition-all duration-300 border-2 border-gray-200 outline-none rounded-xl pl-11 bg-white/80 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-gray-300 disabled:opacity-50"
                  />
                  <svg className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block mb-3 text-sm font-semibold text-secondary">
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
                    className="w-full h-12 px-4 transition-all duration-300 border-2 border-gray-200 outline-none rounded-xl pl-11 bg-white/80 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-gray-300 disabled:opacity-50"
                  />
                  <svg className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="mb-6">
              <label htmlFor="email" className="block mb-3 text-sm font-semibold text-secondary">
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
                  placeholder="Enter your professional email"
                  className="w-full h-12 px-4 transition-all duration-300 border-2 border-gray-200 outline-none rounded-xl pl-11 bg-white/80 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-gray-300 disabled:opacity-50"
                />
                <svg className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label htmlFor="password" className="block mb-3 text-sm font-semibold text-secondary">
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
                  placeholder="Create a secure password"
                  className="w-full h-12 px-4 pr-12 transition-all duration-300 border-2 border-gray-200 outline-none rounded-xl pl-11 bg-white/80 backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-gray-300 disabled:opacity-50"
                />
                <svg className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute text-gray-500 transition-colors transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEye className="w-5 h-5" /> : <FaEyeSlash className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {/* {formData.password && passwordStrength && (
                <div className="flex items-center mt-3">
                  <div className="flex mr-3 space-x-1">
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
                  <div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Continue to Verification</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>

            {/* Login link */}
            <div className="pt-6 text-center border-t border-gray-200">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/advisor-login')}
                  className="font-semibold transition-colors duration-200 text-primary hover:text-third hover:underline"
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

export default AdvisorRegister;