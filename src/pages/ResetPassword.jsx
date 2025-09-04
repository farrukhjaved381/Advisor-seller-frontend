import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPassword = () => {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Formik validation schema
  const ResetPasswordSchema = Yup.object().shape({
    newPassword: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
      .matches(/[0-9]/, 'Password must contain at least one number')
      .required('New password is required'),
  });

  // Extract token from URL or sessionStorage & fetch email from API
  useEffect(() => {
    const fetchProfile = async (authToken) => {
      try {
        const res = await axios.get(
          'https://advisor-seller-backend.vercel.app/api/auth/profile',
          {
            headers: { Authorization: `Bearer ${authToken}` },
            validateStatus: () => true,
          }
        );

        if (res.status === 200) {
          setEmail(res.data.email || '');
        } else {
          toast.error('Failed to fetch email from token ❌');
        }
      } catch (err) {
        console.error(err);
        toast.error('Network error while fetching profile ❌');
      }
    };

    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get('token');

    if (tokenFromUrl) {
      sessionStorage.setItem('reset_token', tokenFromUrl);
      setToken(tokenFromUrl);

      // Remove token from URL
      params.delete('token');
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
      window.history.replaceState({}, '', newUrl);

      fetchProfile(tokenFromUrl);
    } else {
      const storedToken = sessionStorage.getItem('reset_token');
      if (storedToken) {
        setToken(storedToken);
        fetchProfile(storedToken);
      }
    }
  }, [location.search]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    if (!token) {
      toast.error('Reset token missing ❌');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        token,
        newPassword: values.newPassword,
      };

      const res = await axios.post(
        'https://advisor-seller-backend.vercel.app/api/auth/reset-password',
        payload,
        { validateStatus: () => true }
      );

      if (res.status === 200 || res.status === 201) {
        toast.success(res.data.message || 'Password reset successful ✅');
        resetForm();
        sessionStorage.removeItem('reset_token');
        setEmail('');
        toast('Please go back to login page to sign in 🔑', { icon: '🔒' });
      } else {
        toast.error(res.data?.message || 'Failed to reset password ❌');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error. Please try again later ❌');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="w-screen min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-primary to-primary-50 px-4">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md flex flex-col items-center gap-6">
        <h2 className="text-3xl font-bold text-center text-black">Reset Password</h2>

        {email && (
          <p className="text-gray-700 text-center">
            Changing password for: <strong>{email}</strong>
          </p>
        )}

        <Formik
          initialValues={{ newPassword: '' }}
          validationSchema={ResetPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="w-full flex flex-col gap-4">
              <div className="relative">
                <Field
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 rounded-lg border-2 border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-600"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
                <ErrorMessage
                  name="newPassword"
                  component="p"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || loading}
                className={`w-full py-3 mt-2 rounded-xl text-white font-semibold ${
                  isSubmitting || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary/70 hover:bg-primary'
                }`}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ResetPassword;
