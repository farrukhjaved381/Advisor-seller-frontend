import axios from 'axios';

let subscriptionRedirectInProgress = false;

// Reset redirect flag after navigation
setTimeout(() => {
  subscriptionRedirectInProgress = false;
}, 5000);

export const setupAxiosInterceptors = () => {
  axios.defaults.withCredentials = true;

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const errorData = error?.response?.data;

      if (status === 402 && !subscriptionRedirectInProgress) {
        console.log('402 intercepted - TEMPORARILY DISABLED REDIRECT');
        return Promise.reject(error);

        subscriptionRedirectInProgress = true;
        try {
          sessionStorage.setItem('subscriptionExpiredNotice', 'true');
          if (errorData?.message) {
            sessionStorage.setItem('subscriptionExpiredMessage', errorData.message);
          }
        } catch (storageError) {
          // ignore storage failures
        }

        // Don't remove tokens - user should stay logged in
        // Just redirect to payment page
        const redirectTo = errorData?.redirectTo || '/advisor-payments';
        const hasPaymentMethod = errorData?.hasPaymentMethod;
        const intent = hasPaymentMethod ? 'update-card' : 'add-card';

        // TEMPORARILY DISABLED
        // console.log('Redirecting to:', `${redirectTo}?intent=${intent}`);
        // window.location.href = `${redirectTo}?intent=${intent}`;
      }
      return Promise.reject(error);
    },
  );
};

export default setupAxiosInterceptors;