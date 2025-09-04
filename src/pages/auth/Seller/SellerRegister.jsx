import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/common/Header";
import Footer from "../../../components/common/Footer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { motion } from "framer-motion"; // ✅ added

const SellerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ loading state

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
      role: "seller",
    };
    delete finalData.firstName;
    delete finalData.lastName;

    try {
      setLoading(true); // ✅ start loader
      const res = await axios.post(
        "https://advisor-seller-backend.vercel.app/api/auth/register",
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
      setLoading(false); // ✅ stop loader
    }
  };

  return (
    <div className="w-screen min-h-screen bg-white flex flex-col overflow-x-hidden">
      <Header />
      <div className="flex-grow w-full flex items-stretch">
        <div id="left" className="w-[45%] bg-white h-screen">
          <img
            src="src/assets/login.png"
            alt="login-img"
            className="object-contain w-full"
          />
        </div>

        {/* Right Section with Animated Background */}
        <div id="right" className="w-[75%] relative flex justify-center items-center h-screen overflow-hidden">
          {/* 🔥 Animated Background Blobs */}
          {/* 🔥 Animated Background Blobs */}
          <motion.div
            className="absolute top-10 left-20 w-72 h-72 bg-primary/60 rounded-full blur-3xl"
            animate={{ x: [0, 100, -100, 0], y: [0, -80, 80, 0], opacity: [0.6, 0.9, 0.6] }}
            transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute bottom-20 right-32 w-96 h-96 bg-secondary/60 rounded-full blur-3xl"
            animate={{ x: [50, -150, 150, 50], y: [50, 100, -100, 50], opacity: [0.5, 0.8, 0.5] }}
            transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
          />

          <motion.div
            className="absolute top-1/2 left-1/3 w-60 h-60 bg-pink-500/50 rounded-full blur-3xl"
            animate={{ x: [-100, 120, -120, -100], y: [100, -120, 120, 100], opacity: [0.4, 0.7, 0.4] }}
            transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
          />


          {/* Foreground Content */}
          <div className="w-[65%] h-[60%] mt-20 flex flex-col justify-between items-center overflow-y-auto p-10 relative z-10">
            <h2 className="text-4xl font-bold relative bottom-10">
              Seller Registration
            </h2>

            <form
              className="w-full flex flex-col gap-10 justify-center items-center"
              onSubmit={handleSubmit}
            >
              <div className="flex gap-10 w-full">
                {/* First Name */}
                <div className="relative w-full">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading}
                    className="peer p-4 w-full rounded-xl ease-in-out duration-300 border-[0.15rem] border-primary/30 hover:border-primary hover:border-[0.2rem]
                    focus:border-primary focus:outline-none transition cursor-pointer focus:scale-105
                    placeholder-transparent disabled:opacity-50"
                    placeholder="First Name"
                  />
                  <label
                    htmlFor="firstName"
                    className="absolute left-3 px-1 bg-white text-primary font-semibold transition-all 
                    duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-primary/60 peer-placeholder-shown:text-base 
                    peer-focus:top-[-8px] peer-focus:text-base peer-focus:text-secondary rounded-full
                    peer-hover:top-[-8px] peer-hover:text-base peer-hover:text-secondary
                    peer-[&:not(:placeholder-shown)]:top-[-8px] peer-[&:not(:placeholder-shown)]:text-sm peer-[&:not(:placeholder-shown)]:text-secondary"
                  >
                    First Name
                  </label>
                </div>

                {/* Last Name */}
                <div className="relative w-full">
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading}
                    className="peer p-4 w-full rounded-xl ease-in-out duration-300 border-[0.15rem] border-primary/30 hover:border-primary hover:border-[0.2rem]
                    focus:border-primary focus:outline-none transition cursor-pointer focus:scale-105
                    placeholder-transparent disabled:opacity-50"
                    placeholder="Last Name"
                  />
                  <label
                    htmlFor="lastName"
                    className="absolute left-3 px-1 bg-white text-primary font-semibold transition-all 
                    duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-primary/60 peer-placeholder-shown:text-base 
                    peer-focus:top-[-8px] peer-focus:text-base peer-focus:text-secondary rounded-full
                    peer-hover:top-[-8px] peer-hover:text-base peer-hover:text-secondary
                    peer-[&:not(:placeholder-shown)]:top-[-8px] peer-[&:not(:placeholder-shown)]:text-sm peer-[&:not(:placeholder-shown)]:text-secondary"
                  >
                    Last Name
                  </label>
                </div>
              </div>

              {/* Email */}
              <div className="relative w-full">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className="peer p-4 w-full rounded-xl ease-in-out duration-300 border-[0.15rem] border-primary/30 hover:border-primary hover:border-[0.2rem] 
                  focus:border-primary focus:outline-none transition cursor-pointer focus:scale-105
                  placeholder-transparent disabled:opacity-50"
                  placeholder="Email Address"
                />
                <label
                  htmlFor="email"
                  className="absolute left-3 px-1 bg-white text-primary font-semibold transition-all 
                  duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-primary/60 peer-placeholder-shown:text-base 
                  peer-focus:top-[-8px] peer-focus:text-base peer-focus:text-secondary rounded-full
                  peer-hover:top-[-8px] peer-hover:text-base peer-hover:text-secondary
                  peer-[&:not(:placeholder-shown)]:top-[-8px] peer-[&:not(:placeholder-shown)]:text-sm peer-[&:not(:placeholder-shown)]:text-secondary"
                >
                  Email Address
                </label>
              </div>

              {/* Password */}
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className="peer p-4 w-full rounded-xl ease-in-out duration-300 border-[0.15rem] border-primary/30 hover:border-primary hover:border-[0.2rem] 
                  focus:border-primary focus:outline-none transition cursor-pointer focus:scale-105
                  placeholder-transparent disabled:opacity-50"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary text-xl focus:outline-none transition-colors duration-200"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={loading}
                >
                  {showPassword ? (
                    <FaEye className="transition-all duration-200" />
                  ) : (
                    <FaEyeSlash className="transition-all duration-200" />
                  )}
                </button>
                <label
                  htmlFor="password"
                  className="absolute left-3 px-1 bg-white text-primary font-semibold transition-all 
                  duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-primary/60 peer-placeholder-shown:text-base 
                  peer-focus:top-[-8px] peer-focus:text-base peer-focus:text-secondary rounded-full
                  peer-hover:top-[-8px] peer-hover:text-base peer-hover:text-secondary
                  peer-[&:not(:placeholder-shown)]:top-[-8px] peer-[&:not(:placeholder-shown)]:text-sm peer-[&:not(:placeholder-shown)]:text-secondary"
                >
                  Password
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="bg-primary w-[70%] text-white p-4 text-xl font-bold rounded-xl 
                hover:bg-primary hover:scale-105 ease-in-out duration-300 
                hover:shadow-lg hover:shadow-primary/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex justify-center items-center gap-2">
                    <span className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></span>
                    Registering...
                  </div>
                ) : (
                  "Register"
                )}
              </button>
              <span>Already have an account? <span className="text-primary cursor-pointer" onClick={() => navigate('/seller-login')}>Login</span></span>
            </form>
          </div>
        </div>
      </div>
      <Footer />
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default SellerRegister;
