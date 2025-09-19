import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaEnvelopeOpenText, FaShieldAlt } from 'react-icons/fa';

const AdvisorVerify = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('advisor');
  const [loginStatus, setLoginStatus] = useState('idle');
  const tokenRef = useRef(null);

  const attemptSilentLogin = useCallback(
    async (token) => {
      setLoginStatus('pending');

      try {
        const loginRes = await axios.post(
          'https://advisor-seller-backend.vercel.app/api/auth/login-with-token',
          { token },
          { validateStatus: () => true },
        );

        if (loginRes.status >= 200 && loginRes.status < 300) {
          const { access_token, refresh_token, user } = loginRes.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          localStorage.setItem('user', JSON.stringify(user));
          setRole(user?.role || 'advisor');
          setUserName((previous) => user?.name || previous || 'Advisor');
          setLoginStatus('success');
          return true;
        }

        setLoginStatus('error');
        toast.error(
          loginRes.data?.message ||
            'We verified your email but could not sign you in automatically.',
        );
        return false;
      } catch (error) {
        console.error('Token login failed:', error);
        setLoginStatus('error');
        toast.error(
          'We verified your email but could not sign you in automatically. Please login manually.',
        );
        return false;
      }
    },
    [],
  );

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      tokenRef.current = token;

      if (!token) {
        toast.error('Invalid verification link');
        setStatus('error');
        return;
      }

      try {
        const response = await axios.get(
          `https://advisor-seller-backend.vercel.app/api/auth/verify-email?token=${token}`,
          { validateStatus: () => true },
        );

        if (response.status >= 200 && response.status < 300 && response.data.success) {
          const userInfo = response.data.user || {};
          setUserName(userInfo.name || 'Advisor');
          setRole(userInfo.role || 'advisor');
          setStatus('success');
          toast.success(response.data.message || 'Email verified successfully!');
          await attemptSilentLogin(token);
        } else {
          throw new Error(response.data?.message || 'Email verification failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Email verification failed. Please request a new link.';
        toast.error(message);
        setStatus('error');
      }
    };

    verifyEmail();
  }, [attemptSilentLogin, searchParams]);

  const handleProceed = useCallback(async () => {
    if (role !== 'advisor') {
      navigate('/');
      return;
    }

    if (loginStatus !== 'success') {
      const token = tokenRef.current;

      if (!token) {
        toast.error('Session expired. Please log in to continue.');
        navigate('/advisor-login');
        return;
      }

      const loginSucceeded = await attemptSilentLogin(token);
      if (!loginSucceeded) {
        navigate('/advisor-login');
        return;
      }
    }

    navigate('/advisor-payments');
  }, [attemptSilentLogin, loginStatus, navigate, role]);

  const whitelistTips = useMemo(
    () => [
      {
        title: 'Whitelist Meaning',
        body:
          'Whitelisting an email address adds it to an approved list so messages arrive in your inbox instead of spam. If you are missing messages from us, these steps will help.',
      },
      {
        title: 'Need More Help?',
        body:
          'If messages from Advisor Chooser still do not appear, ask your IT team to whitelist @amp-ven.com so your organization always receives important updates.',
      },
    ],
    [],
  );

  const providerGuides = useMemo(
    () => [
      {
        title: 'Gmail (Desktop)',
        steps: [
          'Open Gmail and click the gear icon > “See all settings”.',
          'Choose “Filters and Blocked Addresses” then “Create a new filter”.',
          'In the From field, add @amp-ven.com and click “Create filter”.',
          'Select “Never send to spam” (and add labels or stars if desired), then confirm.',
        ],
      },
      {
        title: 'Gmail (Mobile App)',
        steps: [
          'Open Gmail and go to the spam or junk folder.',
          'Tap “Edit”, select messages that are not spam, then tap “Move”.',
          'Choose “Primary” or “Inbox” so future emails land correctly.',
        ],
      },
      {
        title: 'Outlook (Desktop)',
        steps: [
          'Click “Settings” > “View all Outlook settings”.',
          'Navigate to “Junk email” and open “Safe senders and domains”.',
          'Add @amp-ven.com and select “Save” to keep our emails in your inbox.',
        ],
      },
      {
        title: 'Outlook (Mobile App)',
        steps: [
          'Open Outlook and select the message to trust.',
          'Tap the three dots > “Move to focused inbox”.',
          'Choose “Move this and all future messages” so everything from us is prioritized.',
        ],
      },
    ],
    [],
  );

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center text-white">
          <div className="h-16 w-16 border-4 border-white/30 border-t-third rounded-full mx-auto animate-spin mb-6" />
          <h2 className="text-2xl font-semibold">Validating your verification link…</h2>
          <p className="text-white/70 mt-2">Hang tight while we confirm your email address.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-blue-50 px-6">
        <div className="max-w-xl w-full bg-white/90 backdrop-blur border border-rose-200 rounded-3xl shadow-2xl p-10 text-center">
          <FaShieldAlt className="mx-auto text-rose-500 w-12 h-12 mb-4" />
          <h2 className="text-2xl font-bold text-rose-600 mb-3">Verification Link Expired or Invalid</h2>
          <p className="text-gray-600 mb-6">
            The verification link you used is no longer valid. Please request a new email or contact support if you continue to have trouble.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-full bg-primary text-white font-semibold shadow-lg shadow-primary/40 hover:bg-primary/90 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-white/10 backdrop-blur border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-third px-8 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-widest text-white/70 mb-2">Email Verified</p>
              <h1 className="text-3xl md:text-4xl font-extrabold">
                Welcome aboard, {userName}!
              </h1>
              <p className="mt-3 text-white/80 text-base md:text-lg leading-relaxed max-w-2xl">
                Your Advisor Chooser account is ready. Activate your membership with a quick payment and you&apos;ll be guided straight into your profile setup so sellers can discover you.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-3">
              <button
                type="button"
                onClick={handleProceed}
                disabled={loginStatus === 'pending'}
                className={`inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-primary font-semibold shadow-lg shadow-black/20 transition ${
                  loginStatus === 'pending' ? 'opacity-70 cursor-not-allowed' : 'hover:bg-white/90'
                }`}
              >
                {loginStatus === 'pending'
                  ? 'Preparing your account…'
                  : 'Proceed to Membership Payment'}
              </button>
              <p className="text-white/70 text-sm md:text-base max-w-md text-center md:text-right">
                Your advisor dashboard and profile form unlock immediately after payment confirmation.
              </p>
              {loginStatus === 'error' && (
                <p className="text-rose-200 text-sm md:text-base max-w-md text-center md:text-right">
                  We verified your email but need you to sign in again. We will guide you through the login page if required.
                </p>
              )}
            </div>
          </div>

          <div className="px-8 py-10 bg-white text-slate-900">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
              <div className="flex items-center gap-3">
                <FaEnvelopeOpenText className="text-primary w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Important: Check Your Inbox (and Spam)</h2>
                  <p className="text-slate-600">If our email landed in Junk or Spam, follow these quick steps to whitelist Advisor Chooser.</p>
                </div>
              </div>
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                Add @amp-ven.com to your trusted senders
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {whitelistTips.map((card) => (
                <div
                  key={card.title}
                  className="h-full rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-md"
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">{card.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">How to Whitelist Advisor Chooser Emails</h3>
              <div className="grid gap-6 lg:grid-cols-2">
                {providerGuides.map((guide) => (
                  <div
                    key={guide.title}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <h4 className="text-lg font-semibold text-primary mb-4">{guide.title}</h4>
                    <ul className="space-y-3 text-slate-600 text-sm leading-relaxed">
                      {guide.steps.map((step, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="mt-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h4 className="text-lg font-semibold text-slate-900 mb-2">Still Not Receiving Our Messages?</h4>
              <p className="text-slate-600 leading-relaxed">
                We’re here to help. If you’ve followed the steps above and emails are still missing, please reach out to your IT department and ask them to whitelist <span className="font-semibold text-primary">@amp-ven.com</span> so every notification reaches you.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 text-white/70 text-center text-sm py-6">
            © 2025 Advisor Chooser. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorVerify;

