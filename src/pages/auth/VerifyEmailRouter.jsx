import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdvisorVerify from './Advisor/AdvisorVerify.jsx';
import SellerVerify from './Seller/VerifyEmail.jsx';

const decodeRoleFromToken = (token) => {
  if (!token) {
    return null;
  }

  try {
    if (typeof window === 'undefined' || typeof window.atob !== 'function') {
      return null;
    }

    const base64Url = token.split('.')[1];
    if (!base64Url) {
      return null;
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    const payload = JSON.parse(jsonPayload);
    return payload.role ? payload.role.toLowerCase() : null;
  } catch (error) {
    console.error('Failed to decode verification token payload', error);
    return null;
  }
};

const VerifyEmailRouter = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const token = searchParams.get('token');

  const role = useMemo(() => {
    if (roleParam) {
      return roleParam.toLowerCase();
    }
    return decodeRoleFromToken(token);
  }, [roleParam, token]);

  if (role === 'advisor') {
    return <AdvisorVerify />;
  }

  return <SellerVerify />;
};

export default VerifyEmailRouter;
