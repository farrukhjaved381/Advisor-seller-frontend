"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import { toast, Toaster } from "react-hot-toast"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { ArrowLeft, Lock, CheckCircle, Shield, Sparkles } from "lucide-react"
import { FaEye, FaEyeSlash } from "react-icons/fa"

const ResetPassword = () => {
  const [token, setToken] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  // Yup validation
  const ResetPasswordSchema = Yup.object().shape({
    newPassword: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .matches(/[a-z]/, "Password must contain at least one lowercase letter")
      .matches(/[0-9]/, "Password must contain at least one number")
      .required("New password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
      .required("Confirm password is required"),
  })

  // Fetch profile using token
  useEffect(() => {
    const fetchProfile = async (authToken) => {
      try {
        const res = await axios.get(
          "https://api.advisorchooser.com/api/auth/profile",
          {
            headers: { Authorization: `Bearer ${authToken}` },
            validateStatus: () => true,
          }
        )
        if (res.status === 200) {
          setEmail(res.data.email || "")
        } else {
          toast.error("Failed to fetch email from token ❌")
        }
      } catch (err) {
        console.error(err)
        toast.error("Network error while fetching profile ❌")
      }
    }

    const params = new URLSearchParams(location.search)
    const tokenFromUrl = params.get("token")

    if (tokenFromUrl) {
      sessionStorage.setItem("reset_token", tokenFromUrl)
      setToken(tokenFromUrl)
      params.delete("token")
      const newSearch = params.toString()
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""
        }`
      window.history.replaceState({}, "", newUrl)
      fetchProfile(tokenFromUrl)
    } else {
      const storedToken = sessionStorage.getItem("reset_token")
      if (storedToken) {
        setToken(storedToken)
        fetchProfile(storedToken)
      }
    }
  }, [location.search])

  // Submit reset password
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    if (!token) {
      toast.error("Reset token missing ❌")
      return
    }

    setLoading(true)
    try {
      const payload = { token, newPassword: values.newPassword }
      const res = await axios.post(
        "https://api.advisorchooser.com/api/auth/reset-password",
        payload,
        { validateStatus: () => true }
      )

      if (res.status === 200 || res.status === 201) {
        setIsSuccess(true)
        toast.success(res.data.message || "Password reset successful ✅")
        resetForm()
        sessionStorage.removeItem("reset_token")
        setEmail("")
        setTimeout(() => navigate("/seller-login"), 1500)
      } else {
        toast.error(res.data?.message || "Failed to reset password ❌")
      }
    } catch (err) {
      console.error(err)
      toast.error("Network error. Please try again later ❌")
    } finally {
      setLoading(false)
      setSubmitting(false)
    }
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

      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <button
          onClick={() => navigate("/advisor-login")}
          className="group flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-8 transition-all duration-200 hover:-translate-x-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-lg p-2 -ml-2 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="text-sm font-semibold">Back to Login</span>
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 relative overflow-hidden hover:shadow-2xl transition-card">
          {loading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 animate-pulse"></div>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-third rounded-xl mb-6 shadow-lg">
              {isSuccess ? (
                <CheckCircle className="w-8 h-8 text-white animate-pulse" />
              ) : (
                <Lock className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-3">
              {isSuccess ? "Password Reset!" : "Reset Password"}
            </h1>
            <p className="text-slate-600 text-base leading-relaxed max-w-sm mx-auto">
              {isSuccess
                ? "Your password has been updated successfully. Redirecting you to login..."
                : email
                  ? `Changing password for: ${email}`
                  : "Enter your new password below to reset your account password."}
            </p>
          </div>

          {/* Form */}
          {!isSuccess && (
            <Formik
              initialValues={{ newPassword: "", confirmPassword: "" }}
              validationSchema={ResetPasswordSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-6">
                  {/* New password */}
                  <div className="space-y-2">
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <Field
                        type={showPassword ? "text" : "password"}
                        name="newPassword"
                        placeholder="Enter new password"
                        className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>
                    <ErrorMessage
                      name="newPassword"
                      component="p"
                      className="text-red-600 text-sm font-medium"
                    />
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Field
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm new password"
                        className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </div>
                    <ErrorMessage
                      name="confirmPassword"
                      component="p"
                      className="text-red-600 text-sm font-medium"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className={`w-full py-3.5 px-4 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSubmitting || loading
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-primary to-third hover:opacity-90 text-white shadow-lg hover:shadow-xl focus:ring-indigo-500/50 transform hover:scale-[1.02] active:scale-[0.98]"
                      }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Resetting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Reset Password</span>
                      </div>
                    )}
                  </button>
                </Form>
              )}
            </Formik>
          )}

          {/* Success */}
          {isSuccess && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg animate-slide-down">
                <p className="text-emerald-800 text-sm font-medium text-center">
                  Your password has been successfully updated.
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
                className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors duration-200 focus:outline-none"
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
              Secure Reset • Strong password required
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

export default ResetPassword
