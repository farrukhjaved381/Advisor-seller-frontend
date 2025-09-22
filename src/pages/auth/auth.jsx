import React, { useState } from 'react';
import Header from '../../components/common/Header';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Footer from '../../components/common/Footer';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    // Email Validation
    const validateEmail = (value) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) return 'Email is required';
        if (!regex.test(value)) return 'Please enter a valid email address';
        return '';
    };

    // Password Validation
    const validatePassword = (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters long';
        return '';
    };

    // Password Strength Checker (optional for login, but keeping UI)
    const checkPasswordStrength = (value) => {
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
            try {
                const res = await axios.post(
                    "https://advisor-seller-backend.vercel.app/api/auth/login",
                    { email, password },
                    { validateStatus: () => true } // ✅ prevent axios from throwing automatically
                );

                // Explicitly check status codes
                if (res.status === 200) {
                    const { access_token, refresh_token, user } = res.data;

                    if (user?.isEmailVerified) {
                        toast.success("Login successful ✅");

                        // Save tokens & user data
                        localStorage.setItem("access_token", access_token);
                        localStorage.setItem("refresh_token", refresh_token);
                        localStorage.setItem("user", JSON.stringify(user));

                        // redirect based on role
                        if (user.role === "seller") navigate("/seller-dashboard");
                        else if (user.role === "buyer") navigate("/buyer-dashboard");
                        else navigate("/");
                    } else {
                        toast.error("Please check your email to verify your account.");
                    }
                } else if (res.status === 401) {
                    toast.error(
                        "You are not authorized. Please check your email for the verification link 📧"
                    );
                } else {
                    toast.error(res.data?.message || "Something went wrong");
                }
            } catch (err) {
                console.error("Login error:", err);
                toast.error("Network error. Please try again later.");
            }
        }
    };


    return (
        <div className="w-screen min-h-screen bg-white flex flex-col overflow-x-hidden">
            <Toaster position="top-center" reverseOrder={false} />
            <Header />
            <div className="flex-grow w-full flex items-stretch">
                <div id="left" className="w-[45%] bg-white h-screen ">
                    <img src="/login.png" alt="login-img" className="object-contain" />
                </div>
                <div id="right" className="w-[75%] flex justify-center items-center h-screen ">
                    <form
                        onSubmit={handleSubmit}
                        className="text-center w-[60%] min-h-[60%] flex flex-col justify-start items-center gap-6 py-10 px-4"
                    >
                        <h2 className="text-3xl font-bold">Welcome!</h2>

                        {/* Email Field */}
                        <div className="w-full flex flex-col items-start">
                            <label htmlFor="email" className="font-semibold text-lg">
                                Email Address
                            </label>
                            <input
                                type="text"
                                id="email"
                                value={email}
                                onChange={handleEmailChange}
                                className={`w-full h-12 rounded-lg px-3 border-2 focus:ring-2 outline-none ${emailError
                                    ? 'border-red-500'
                                    : 'border-primary/30 focus:border-primary focus:ring-primary'
                                    }`}
                            />
                            {emailError && <span className="text-red-500 text-sm mt-1">{emailError}</span>}
                        </div>

                        {/* Password Field */}
                        <div className="w-full flex flex-col items-start relative">
                            <label htmlFor="password" className="font-semibold text-lg">
                                Password
                            </label>
                            <div className="w-full relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className={`w-full h-12 rounded-lg px-3 pr-10 border-2 focus:ring-2 outline-none ${passwordError
                                        ? 'border-red-500'
                                        : 'border-primary/30 focus:border-primary focus:ring-primary'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            {passwordError && <span className="text-red-500 text-sm mt-1">{passwordError}</span>}

                            {/* Password Strength */}
                            {password && !passwordError && (
                                <span
                                    className={`text-sm mt-1 ${passwordStrength === 'Weak'
                                        ? 'text-red-500'
                                        : passwordStrength === 'Medium'
                                            ? 'text-yellow-500'
                                            : 'text-green-500'
                                        }`}
                                >
                                    Strength: {passwordStrength}
                                </span>
                            )}
                        </div>

                        {/* Forgot Password */}
                        <span className="text-primary w-full text-right mt-2 ease-in-out duration-300 hover:text-secondary hover:scale-105 cursor-pointer"
                        onClick={() => navigate("/forgot-password")}>
                            Forgot Password?
                        </span>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full h-14 text-lg font-medium text-white active:bg-secondary bg-primary/80 rounded-2xl mt-6 hover:bg-primary cursor-pointer hover:scale-105 ease-in-out duration-300"
                        >
                            Login my account
                        </button>

                        <p className="mt-4 w-full text-center">
                            Don't have an account?{' '}
                            <span onClick={() => navigate("/seller-register")}  className="text-primary hover:text-secondary cursor-pointer">signup</span>
                        </p>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Auth;
