import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import AdvisorPayments from './pages/auth/Advisor/AdvisorPayments';

// ✅ Load Stripe using the environment variable from .env
// Make sure your .env has: VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function App() {
  return (
    <Elements stripe={stripePromise}>
      <div className="header-logos">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h1 className="text-center">Vite + React + Stripe</h1>

      {/* Stripe Payment Component */}
      <AdvisorPayments />
    </Elements>
  );
}

export default App;
