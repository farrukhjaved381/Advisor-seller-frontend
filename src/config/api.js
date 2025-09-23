// API Configuration
// Allows override via Vite env: VITE_API_URL and VITE_FRONTEND_URL
const envBackend = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : undefined;
const envFrontend = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FRONTEND_URL
  ? import.meta.env.VITE_FRONTEND_URL
  : undefined;

export const API_CONFIG = {
  BACKEND_URL: envBackend || "https://advisor-seller-backend.vercel.app",
  FRONTEND_URL: envFrontend || "https://frontend-five-pied-17.vercel.app"
};

export default API_CONFIG;
