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
  fullName: Yup.string().required("Full Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  companyName: Yup.string()
    .min(3, "Company name must be at least 3 characters")
    .required("Company name is required"),
  phone: Yup.string()
    .matches(/^\+?[0-9\- ]+$/, "Enter a valid phone number")
    .required("Phone is required"),
  website: Yup.string()
    .url("Enter a valid website URL (https://example.com)")
    .required("Website is required"),
  industry: Yup.string().required("Industry is required"),
  geography: Yup.string().required("Geography is required"),
  annualRevenue: Yup.number()
    .required("Annual revenue is required")
    .positive("Annual revenue must be positive"),

  currency: Yup.string().required("Currency is required"),
  description: Yup.string()
    .min(10, "Description must be at least 10 characters")
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

const SellerForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [emailVerified, setEmailVerified] = useState(null);

  // Initialize profile from localStorage (iterable)
  const getProfileData = () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return {};
    try {
      const parsedUser = JSON.parse(storedUser);
      // List of form fields to autofill from user object
      const autofillFields = ["fullName", "email", "companyName", "phone", "website", "industry", "geography", "minRevenue", "maxRevenue", "currency", "description"];
      const profile = {};
      autofillFields.forEach(key => {
        if (parsedUser[key] !== undefined) profile[key] = parsedUser[key];
        // Special mapping for fullName from name
        if (key === "fullName" && parsedUser.name) profile.fullName = parsedUser.name;
        if (key === "email" && parsedUser.email) profile.email = parsedUser.email;
      });
      return profile;
    } catch (err) {
      console.error("Error parsing user from localStorage:", err);
      return {};
    }
  };

  const [profile] = useState(getProfileData());


  // ✅ Show popup then loader then main form
  useEffect(() => {
    const timer1 = setTimeout(() => setShowLoader(true), 3000);
    const timer2 = setTimeout(() => setShowPopup(false), 5000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // ------------------- Verify Email on Page Load using token from URL -------------------
  const [emailError, setEmailError] = useState(null);

  useEffect(() => {
    const verifyEmailAndFetchProfile = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get("token");

      if (!token) return;

      try {
        // Step 1: Verify Email using GET + query string
        const verifyRes = await axios.get(
          `https://advisor-seller-backend.vercel.app/api/auth/verify-email?token=${token}`,
          { validateStatus: () => true }
        );

        if (verifyRes.status === 200 && verifyRes.data.success) {
          toast.success(verifyRes.data.message || "Email verified successfully ✅");
          setEmailVerified(true);

          // Fetch profile
          const profileRes = await axios.get(
            "https://advisor-seller-backend.vercel.app/api/auth/profile",
            { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
          );

          if (profileRes.status === 200) {
            const user = profileRes.data;
            localStorage.setItem("user", JSON.stringify(user));

            // Navigate based on role
            if (user.role === "seller") {
              navigate("/verify-email");          // ✅ updated route
            } else {
              navigate("/adviser-payment");      // ✅ updated route
            }
          } else {
            toast.error("Failed to fetch profile ❌");
          }
        }
        else {
          toast.error(verifyRes.data?.message || "Email verification failed ❌");
          setEmailVerified(false);
        }
      } catch (err) {
        console.error("Verification/Profile error:", err);
        toast.error("Something went wrong while verifying email or fetching profile ❌");
        setEmailVerified(false);
      }
    };

    verifyEmailAndFetchProfile();
  }, [location.search]);




  // ------------------- Formik Initial Values -------------------
  const initialValues = {
    fullName: profile.fullName || "",
    email: profile.email || "",
    companyName: "",
    phone: "",
    website: "",
    industry: "",
    geography: "",
    annualRevenue: "",
    currency: "USD",
    description: "",
  };


  // ------------------- Submit Handler -------------------
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        toast.error("Please login first to create profile.");
        navigate("/seller-login");
        return;
      }

      const payload = {
        companyName: values.companyName,
        phone: values.phone,
        website: values.website,
        industry: mapIndustry(values.industry),   // map to top-level label
        geography: mapGeography(values.geography), // map to top-level label
        annualRevenue: Number(values.annualRevenue), // ensure it's a number
        currency: values.currency,
        description: values.description,
      };


      const res = await axios.post(
        "https://advisor-seller-backend.vercel.app/api/sellers/profile",
        payload,
        { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
      );

      if (res.status === 201 || res.status === 200) {
        toast.success("Seller profile created successfully! Redirecting to dashboard...");
        resetForm();
        // Direct redirect to seller dashboard
        window.location.href = '/seller-dashboard';
      } else {
        toast.error(res.data?.message || "Failed to create profile. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting seller form:", err);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary/10 px-4 relative">
      <Toaster position="top-center" reverseOrder={false} />

      {/* ✅ Animated Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 flex items-center justify-center bg-primary/10 z-50"
          >
            <div className="bg-primary text-white p-6 text-2xl rounded-2xl shadow-2xl text-center max-w-2xl h-[60%] flex justify-around items-center flex-col w-full">
              {!showLoader ? (
                <>
                  <h2 className="text-3xl font-bold mb-3">🎉 Congratulations & Welcome!</h2>
                  <p className="text-lg leading-relaxed">
                    You’ve joined <span className="font-semibold">CimAmplify.com</span> as a Seller —
                    where only the right opportunities find you, fees are the lowest in the industry,
                    and your deals stay in your control. 🚀
                  </p>
                  <p className="mt-4">Get ready to amplify your journey — let’s complete your Seller form!</p>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p>Redirecting to Seller Form...</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {emailError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error:</strong> {emailError}
        </div>
      )}


      {/* ✅ Main Form (hidden while popup is visible) */}
      {!showPopup && (
        <div className="w-full max-w-5xl bg-white shadow-lg mt-[5rem] mb-[5rem] rounded-2xl p-8 outline">
          <h2 className="text-4xl font-bold text-center mb-6">Seller Profile Form</h2>

          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={SellerSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, setFieldValue }) => (
              <Form className="flex flex-col gap-4">

                <div className="w-full flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                  {/* Full Name (read-only) */}
                  <AnimatedInput name="fullName" placeholder="Seller Full Name" />

                  {/* Email (read-only) */}
                  <AnimatedInput name="email" type="email" placeholder="Seller Email" />
                </div>

                {/* Company Name */}
                <AnimatedInput name="companyName" placeholder="Company Name" />

                {/* Phone */}
                <AnimatedInput name="phone" placeholder="Phone" />

                {/* Website */}
                <AnimatedInput name="website" placeholder="Website" />

                {/* Revenue Size Range and Currency Block */}
                <div className="w-full flex flex-col space-y-4">
                  <div className="flex items-end justify-between">
                    <h3 className="block text-sm font-bold text-gray-700">Revenue Size Range</h3>
                    <div className="w-24">
                      {/* Animated Currency Dropdown */}
                      <Field name="currency">
                        {({ field, form }) => {
                          const [open, setOpen] = React.useState(false);
                          const currencies = [
                            { value: "USD", label: "USD" },
                            { value: "PKR", label: "PKR" },
                            { value: "EUR", label: "EUR" },
                            { value: "GBP", label: "GBP" },
                          ];
                          return (
                            <div className="relative w-full">
                              <div
                                tabIndex={0}
                                className={`w-full p-2 rounded-xl border-[0.15rem] border-primary/30 bg-white text-sm flex items-center justify-between cursor-pointer hover:border-primary hover:border-[0.2rem] focus:border-primary focus:outline-none transition ease-in-out duration-300 ${open ? 'ring-2 ring-primary/30' : ''}`}
                                onClick={() => setOpen((prev) => !prev)}
                                onBlur={() => setTimeout(() => setOpen(false), 120)}
                              >
                                <span>{currencies.find(c => c.value === field.value)?.label || 'Select Currency'}</span>
                                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="ml-2">
                                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </motion.span>
                              </div>
                              <AnimatePresence>
                                {open && (
                                  <motion.ul
                                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                    transition={{ duration: 0.18 }}
                                    className="absolute left-0 z-10 w-full bg-white border border-primary/30 rounded-xl shadow-lg mt-1 overflow-hidden"
                                  >
                                    {currencies.map((c) => (
                                      <li
                                        key={c.value}
                                        className={`px-4 py-2 text-sm cursor-pointer hover:bg-primary/10 transition ${field.value === c.value ? 'bg-primary/10 font-semibold text-primary' : ''}`}
                                        onClick={() => {
                                          form.setFieldValue('currency', c.value);
                                          setOpen(false);
                                        }}
                                      >
                                        {c.label}
                                      </li>
                                    ))}
                                  </motion.ul>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        }}
                      </Field>
                    </div>
                  </div>
                  <div className="w-full">
                    <AnimatedInput name="annualRevenue" type="number" placeholder="Annual Revenue" prefix="$" />
                  </div>

                </div>

                {/* Industry & Geography filters */}
                <div className="w-full flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                  <RadioFilter
                    title="Industry Sectors"
                    data={rawIndustryData}
                    fieldName="industry"
                  />
                  <RadioFilter
                    title="Geographies"
                    data={rawGeographyData}
                    fieldName="geography"
                  />
                </div>


                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <Field
                    as="textarea"
                    name="description"
                    rows="4"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary"
                  />
                  <ErrorMessage
                    name="description"
                    component="p"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Create Profile"}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      )}
    </div>
  );
};

export default SellerForm;