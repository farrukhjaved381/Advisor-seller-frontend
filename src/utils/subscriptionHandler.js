import axios from 'axios';
import toast from 'react-hot-toast';

// Global subscription expiry handler
export const setupSubscriptionInterceptor = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 402) {
        // Check if user still has access despite canceled subscription
        const user = (() => {
          try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
        })();

        console.log('Subscription handler 402 - TEMPORARILY DISABLED REDIRECT');
        return Promise.reject(error);

        const hasPaymentMethod = error?.response?.data?.hasPaymentMethod || false;

        try {
          sessionStorage.setItem('subscriptionExpiredNotice', 'true');
          if (hasPaymentMethod) {
            sessionStorage.setItem('autoRenewalFailed', 'true');
          }
        } catch (e) {
          // ignore storage errors
        }

        const message = hasPaymentMethod
          ? 'Your membership expired and auto-renewal failed. Redirecting to update payment method...'
          : 'Your membership has expired. Redirecting to payment page...';

        toast.error(message, { id: 'subscription-expired', duration: 4000 });

        const redirectUrl = hasPaymentMethod
          ? '/advisor-change-card?expired=true'
          : '/advisor-payments?intent=reactivate';

        // TEMPORARILY DISABLED
        // setTimeout(() => {
        //   window.location.replace(redirectUrl);
        // }, 2000);
      }

      return Promise.reject(error);
    }
  );
};