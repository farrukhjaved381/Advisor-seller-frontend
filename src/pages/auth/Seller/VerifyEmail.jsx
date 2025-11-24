import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import { rawGeographyData } from '../../../components/Static/geographyData';
import { rawIndustryData } from '../../../components/Static/industryData';
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

// Map selected industry id to top-level industry label
const mapIndustry = (selectedId) => {
  for (const category of rawIndustryData) {
    if (category.id === selectedId) return category.label;
    if (category.children) {
      const child = category.children.find(c => c.id === selectedId);
      if (child) return category.label; // return parent label
    }
  }
  return "Technology"; // fallback
};

// Map selected geography id to top-level geography label
const mapGeography = (selectedId) => {
  for (const country of rawGeographyData) {
    if (country.id === selectedId) return country.label;
    if (country.children) {
      const child = country.children.find(c => c.id === selectedId);
      if (child) return country.label; // return parent label
    }
  }
  return "North America"; // fallback
};


// ✅ Validation schema
const SellerSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name must not exceed 50 characters")
    .matches(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces")
    .required("Full Name is required"),
  email: Yup.string()
    .email("Invalid email format")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address")
    .required("Email is required"),
  companyName: Yup.string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must not exceed 100 characters")
    .required("Company name is required"),
  phone: Yup.string()
    .matches(/^\+?[1-9]\d{1,14}$/, "Enter a valid phone number with country code")
    .min(10, "Phone number must be at least 10 digits")
    .required("Phone is required"),
  website: Yup.string()
    .matches(/^https?:\/\/.+\..+/, "Website must be a valid URL (https://example.com)")
    .url("Enter a valid website URL")
    .required("Website is required"),
  industry: Yup.string()
    .min(1, "Please select an industry")
    .required("Industry is required"),
  geography: Yup.string()
    .min(1, "Please select a geography")
    .required("Geography is required"),
  annualRevenue: Yup.number()
    .nullable()
    .transform(value => (isNaN(value) || value === null || value === '' ? null : value))
    .min(1000, "Annual revenue must be at least $1,000")
    .max(999999999, "Annual revenue is too large")
    .required("Annual revenue is required")
    .typeError("Annual revenue must be a valid number"),
  currency: Yup.string()
    .oneOf(["USD", "PKR", "EUR", "GBP"], "Please select a valid currency")
    .required("Currency is required"),
  description: Yup.string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must not exceed 1000 characters")
    .matches(/^(?!\s*$).+/, "Description cannot be empty or just whitespace")
    .required("Description is required"),
});

// 🆕 Updated AnimatedInput to take an optional 'prefix' prop
const AnimatedInput = ({ name, type = "text", placeholder, readOnly = false, prefix = "" }) => {
  return (
    <div className="relative w-full">
      {prefix && (
        <span className="absolute left-3 top-4 text-primary/60 peer-focus:text-secondary peer-hover:text-secondary transition-all duration-300 pointer-events-none">
          {prefix}
        </span>
      )}
      <Field
        type={type}
        name={name}
        readOnly={readOnly}
        className={`peer p-4 w-full rounded-xl border-[0.15rem] border-primary/30
          hover:border-primary hover:border-[0.2rem] focus:border-primary
          focus:outline-none transition ease-in-out duration-300
          focus:scale-105 placeholder-transparent bg-white
          read-only:bg-gray-100 read-only:cursor-not-allowed
          ${prefix ? 'pl-8' : ''}`}
      />
      <label
        htmlFor={name}
        className="absolute left-3 px-1 bg-white text-primary font-semibold transition-all
          duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-primary/60
          peer-placeholder-shown:text-base peer-focus:top-[-8px] peer-focus:text-base
          peer-focus:text-secondary rounded-full
          peer-hover:top-[-8px] peer-hover:text-base peer-hover:text-secondary
          peer-[&:not(:placeholder-shown)]:top-[-8px] peer-[&:not(:placeholder-shown)]:text-sm
          peer-[&:not(:not(:placeholder-shown))]:text-secondary"
      >
        {placeholder}
      </label>
      <ErrorMessage
        name={name}
        component="p"
        className="text-red-500 text-sm mt-1"
      />
    </div>
  );
};

// 🆕 RadioFilter Component
const RadioFilter = ({ title, data, fieldName }) => {
  const { values, setFieldValue } = useFormikContext();
  const [query, setQuery] = useState('');
  const [collapsedParents, setCollapsedParents] = useState(new Set(data.map(item => item.id)));
  const [visibleDescriptions, setVisibleDescriptions] = useState(new Set());

  const handleToggleCollapse = (item) => {
    setCollapsedParents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item.id)) newSet.delete(item.id);
      else newSet.add(item.id);
      return newSet;
    });
  };

  const handleToggleDescription = (itemId) => {
    setVisibleDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const filterData = (items, currentQuery) => {
    if (!currentQuery) return items;
    const lowerCaseQuery = currentQuery.toLowerCase();
    return items.filter(item => {
      const itemMatches = item.label.toLowerCase().includes(lowerCaseQuery);
      if (item.children) {
        const filteredChildren = filterData(item.children, currentQuery);
        if (itemMatches || filteredChildren.length > 0) return true;
      }
      return itemMatches;
    });
  };

  const filteredData = filterData(data, query);

  const renderRadios = (items) => (
    <ul className="list-none space-y-2">
      {items.map(item => {
        const isItemParent = item.children && item.children.length > 0;
        const isCollapsed = collapsedParents.has(item.id);
        const isDescriptionVisible = visibleDescriptions.has(item.id);

        return (
          <li key={item.id} className="ml-4">
            <div className="flex items-center space-x-2">
              {isItemParent && (
                <button
                  type="button"
                  onClick={() => handleToggleCollapse(item)}
                  className="p-1 text-gray-500 hover:text-gray-700 transition"
                >
                  {isCollapsed ? <FaChevronRight /> : <FaChevronDown />}
                </button>
              )}
              <label className="flex items-center text-sm font-medium cursor-pointer text-gray-700 hover:text-primary transition-colors duration-200">
                <input
                  type="radio"
                  name={fieldName}
                  value={item.id}
                  checked={values[fieldName] === item.id}
                  onChange={() => setFieldValue(fieldName, item.id)}
                  className="form-radio h-4 w-4 text-primary focus:ring-primary transition-colors duration-200"
                />
                <span className="ml-2">{item.label}</span>
              </label>
              {fieldName === 'industry' && !isItemParent && item.description && (
                <button
                  type="button"
                  onClick={() => handleToggleDescription(item.id)}
                  className="p-1 text-gray-500 hover:text-gray-700 transition"
                >
                  {isDescriptionVisible ? <FaChevronDown /> : <FaChevronRight />}
                </button>
              )}
            </div>
            {fieldName === 'industry' && isDescriptionVisible && (
              <p className="text-xs text-gray-500 mt-1 ml-10 transition-all duration-300 ease-in-out">
                {item.description}
              </p>
            )}
            {isItemParent && !isCollapsed && (
              <ul className="mt-2 pl-4 border-l-2 border-primary/20">
                {renderRadios(item.children)}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="w-full">
      <h3 className="block text-sm font-medium mb-2">{title}</h3>
      <div className="relative mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${title}`}
          className="w-full p-2 pr-10 rounded-xl border-[0.15rem] border-primary/30 focus:border-primary focus:outline-none transition"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto shadow-inner">
        {filteredData.length > 0 ? renderRadios(filteredData) : (
          <p className="text-gray-500 text-sm">No results found for "{query}".</p>
        )}
      </div>

      <ErrorMessage
        name={fieldName}
        component="p"
        className="text-red-500 text-sm mt-1"
      />
    </div>
  );
};

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [emailVerified, setEmailVerified] = useState(null);

  useEffect(() => {
    const verifyEmailAndLogin = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get("token");

      if (!token) return;

      try {
        // Step 1: Verify Email using GET + query string
        const verifyRes = await axios.get(
          `https://api.advisorchooser.com/api/auth/verify-email?token=${token}`,
          { validateStatus: () => true }
        );

        if (verifyRes.status === 200 && verifyRes.data.success) {
          toast.success(verifyRes.data.message || "Email verified successfully ✅");
          setEmailVerified(true);

          // Step 2: Log the user in by calling the login endpoint with the token
          // Note: This assumes your backend has an endpoint to log in with a verification token.
          // If not, you might need to prompt the user to log in manually.
          // For this example, we'll assume a hypothetical endpoint.

          // Step 2: Log the user in by calling the login endpoint with the token
          const loginRes = await axios.post(
            "https://api.advisorchooser.com/api/auth/login-with-token",
            { token },
            { validateStatus: () => true }
          );

          if (loginRes.status === 200 || loginRes.status === 201) {
            const { access_token, refresh_token, user } = loginRes.data;
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", refresh_token);
            localStorage.setItem("user", JSON.stringify(user));
            toast.success("Login successful! Redirecting...");
            navigate("/seller-form");
          } else {
            toast.error(loginRes.data?.message || "Login failed after verification.");
            navigate("/seller-login");
          }

        } else {
          toast.error(verifyRes.data?.message || "Email verification failed ❌");
          setEmailVerified(false);
        }
      } catch (err) {
        console.error("Verification error:", err);
        toast.error("Something went wrong while verifying email ❌");
        setEmailVerified(false);
      }
    };

    verifyEmailAndLogin();
  }, [location.search, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary/10 px-4 relative">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="text-center">
        {emailVerified === null && <p>Verifying your email...</p>}
        {emailVerified === true && <p>Email verified successfully! Redirecting to login...</p>}
        {emailVerified === false && <p>Email verification failed. Please try again or contact support.</p>}
      </div>
    </div>
  );
};

export default VerifyEmail;
