import React, { useState, useEffect } from "react";

const VerifyEmail = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Track progress for each toast
  const [toastProgress, setToastProgress] = useState({});

  // Toast functionality replacement for react-hot-toast
  const TOAST_DURATION = 4000;
  const PROGRESS_INTERVAL = 50;
  const toast = {
    success: (message) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type: 'success' }]);
      setToastProgress(prev => ({ ...prev, [id]: 100 }));
      // Animate progress
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += PROGRESS_INTERVAL;
        setToastProgress(prev => ({ ...prev, [id]: Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100) }));
        if (elapsed >= TOAST_DURATION) {
          clearInterval(interval);
        }
      }, PROGRESS_INTERVAL);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
        setToastProgress(prev => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        clearInterval(interval);
      }, TOAST_DURATION);
    },
    error: (message) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type: 'error' }]);
      setToastProgress(prev => ({ ...prev, [id]: 100 }));
      // Animate progress
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += PROGRESS_INTERVAL;
        setToastProgress(prev => ({ ...prev, [id]: Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100) }));
        if (elapsed >= TOAST_DURATION) {
          clearInterval(interval);
        }
      }, PROGRESS_INTERVAL);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
        setToastProgress(prev => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        clearInterval(interval);
      }, TOAST_DURATION);
    }
  };

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResend = async () => {
    // Validation
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // Replace this with your actual API call using axios
      const response = await fetch(
        "http://localhost:3003/api/auth/resend-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Verification email sent successfully!");
      } else {
        toast.error(data.message || "Failed to send verification email.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleResend();
    }
  };

  const closeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    setToastProgress(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-32 h-32 bg-teal-200 rounded-full opacity-20 -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-green-200 rounded-full opacity-20 translate-x-24 translate-y-24"></div>
        <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-teal-300 rounded-full opacity-10"></div>
      </div>

      {/* Custom Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[400px] max-w-xl w-auto bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 px-4 py-3 ${toast.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
              }`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {toast.type === 'success' ? (
                    <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900 break-words whitespace-pre-line">{toast.message}</p>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${toast.type === 'success' ? 'bg-green-400' : 'bg-red-400'}`}
                      style={{ width: `${toastProgress[toast.id] || 0}%`, transition: 'width 50ms linear' }}
                    ></div>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => closeToast(toast.id)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-md mx-auto relative z-10">

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 border-t-8 border-t-primary">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
            Email Verification
          </h1>

          {/* Description */}
          <div className="text-center mb-8 space-y-4">
            <p className="text-gray-600 leading-relaxed">
              Thank you for registering! Please check your email for a verification message from{' '}
              <span className="font-medium text-teal-600">deals@amp-ven.com</span>.
              Clicking on the link in the email will conclude the verification and bring you back to Advisor Chooser to complete your profile.
            </p>

            <div className="flex items-center justify-center space-x-2 text-sm text-teal-600">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
              </div>
              <span className="font-medium">Don't forget to check your spam folder</span>
            </div>
          </div>

          {/* Resend section */}
          <div className="bg-teal-50 rounded-xl p-6 border border-teal-100 hover:scale-105 ease-in-out duration-300">
            <p className="text-center text-gray-700 mb-4 font-medium">
              If you haven't received the email, you can request a new one below.
            </p>

            <div className="space-y-4">
              <input
                className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white placeholder-gray-400 hover:scale-105 ease-in-out duration-300"
                type="email"
                placeholder="Enter your email to resend"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />

              <button
                onClick={handleResend}
                disabled={loading}
                className="w-full h-12 bg-teal-500 text-white rounded-xl hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>{loading ? "Sending..." : "Resend Verification Email"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span>© 2025 Advisor Chooser</span>
            <span>•</span>
            <span>All rights reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;