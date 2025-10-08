"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast, Toaster } from "react-hot-toast"
import { Mail, ArrowLeft, Lock, Sparkles, CheckCircle, AlertCircle, Shield } from "lucide-react"

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [touched, setTouched] = useState(false)
  const [shake, setShake] = useState(false)

  const navigate = useNavigate()

  // Email validation
  const validateEmail = (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) return "Email is required"
    if (!regex.test(value)) return "Please enter a valid email address"
    return ""
  }

  useEffect(() => {
    if (touched && email) {
      const error = validateEmail(email)
      setEmailError(error)
    }
  }, [email, touched])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validation = validateEmail(email)
    setEmailError(validation)
    if (validation) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setLoading(true)

    try {
      const res = await axios.post(
        "http://localhost:3000/api/auth/forgot-password",
        { email },
        { validateStatus: () => true }
      )

      if (res.status === 200 || res.status === 201) {
        setIsSuccess(true)
        toast.success(res.data?.message || "Reset link sent to your email ✅")
        setTimeout(() => navigate("/seller-login"), 1500)
      } else {
        toast.error(res.data?.message || "Something went wrong ❌")
      }
    } catch (err) {
      console.error(err)
      toast.error("Network error. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    if (!touched) setTouched(true)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-100/60 to-indigo-100/40 rounded-full blur-3xl bg-glow"></div>
          <div className="absolute top-40 right-32 w-96 h-96 bg-gradient-to-br from-purple-100/50 to-pink-100/30 rounded-full blur-3xl bg-glow"></div>
          <div className="absolute bottom-32 left-1/3 w-80 h-80 bg-gradient-to-br from-indigo-100/50 to-blue-100/40 rounded-full blur-3xl bg-glow"></div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <button
          onClick={() => navigate("/advisor-login")}
          className="group flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-8 transition-all duration-200 hover:-translate-x-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-lg p-2 -ml-2 hover:bg-slate-50"
          aria-label="Go back to login page"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-sm font-semibold">Back to Login</span>
        </button>

        {/* Card */}
        <div
          className={`bg-white rounded-2xl shadow-xl border border-slate-100 p-8 relative overflow-hidden transition-card hover:shadow-2xl ${
            shake ? "input-error-shake" : ""
          }`}
        >
          {loading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 animate-pulse"></div>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-third rounded-xl mb-6 shadow-lg relative">
              {isSuccess ? (
                <CheckCircle className="w-8 h-8 text-white animate-pulse" />
              ) : (
                <Lock className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">
              {isSuccess ? "Check Your Email" : "Forgot Password?"}
            </h1>
            <p className="text-slate-600 text-base leading-relaxed max-w-sm mx-auto">
              {isSuccess
                ? "We've sent a password reset link to your email. Please check your inbox and follow the instructions."
                : "Enter your email address and we'll send you a reset link."}
            </p>
          </div>

          {/* Form */}
          {!isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-6" aria-busy={loading}>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail
                      className={`h-5 w-5 transition-colors duration-200 ${
                        emailError && touched
                          ? "text-red-400"
                          : email && !emailError && touched
                          ? "text-emerald-500"
                          : "text-slate-400"
                      }`}
                    />
                  </div>

                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={() => setTouched(true)}
                    disabled={loading}
                    autoComplete="email"
                    aria-describedby="email-feedback"
                    className={`w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 ${
                      emailError && touched
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : email && !emailError && touched
                        ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                        : "focus:border-indigo-500 focus:ring-indigo-500/20"
                    } ${loading ? "opacity-50 cursor-not-allowed" : "hover:border-slate-300"}`}
                  />

                  {email && touched && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {emailError ? (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      )}
                    </div>
                  )}
                </div>

                <div
                  className="min-h-[20px]"
                  id="email-feedback"
                  aria-live="polite"
                >
                  {touched &&
                    (emailError ? (
                      <p className="text-red-600 text-sm font-medium animate-slide-down">
                        {emailError}
                      </p>
                    ) : null)}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || emailError || !email}
                className={`w-full py-3.5 px-4 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  loading || emailError || !email
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-primary to-third hover:opacity-90 text-white shadow-lg hover:shadow-xl focus:ring-indigo-500/50 transform hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending Reset Link...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Send Reset Link</span>
                  </div>
                )}
              </button>
            </form>
          )}

          {/* Success */}
          {isSuccess && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg animate-slide-down">
                <p className="text-emerald-800 text-sm font-medium text-center">
                  Didn't receive the email? Check your spam folder or try again
                  in a few minutes.
                </p>
                <p className="text-xs text-slate-500 text-center mt-2">
                  Redirecting you to login in 1.5s...
                </p>
              </div>
              <button
                onClick={() => navigate("/seller-login")}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-third hover:opacity-90 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Return to Login
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Remember your password?{" "}
              <button
                onClick={() => navigate("/advisor-login")}
                className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-1"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full animate-slide-down shadow-sm">
            <Shield className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">
              Protected Reset • Link valid for 15 min
            </span>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20%,
          60% {
            transform: translateX(-6px);
          }
          40%,
          80% {
            transform: translateX(6px);
          }
        }
        .input-error-shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.05);
          }
        }
        .bg-glow {
          animation: float 6s ease-in-out infinite;
        }
        .transition-card {
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  )
}

export default ForgotPassword
