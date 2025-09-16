import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import { rawGeographyData } from '../../../components/Static/geographyData';
import { rawIndustryData } from '../../../components/Static/industryData';
import { FaChevronDown, FaChevronRight, FaSearch, FaBuilding, FaPhone, FaGlobe, FaDollarSign, FaIndustry, FaMapMarkerAlt, FaFileAlt } from "react-icons/fa";

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

// Enhanced AnimatedInput with icon support
const AnimatedInput = ({ name, type = "text", placeholder, readOnly = false, prefix = "", icon = null }) => {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary z-10">
          {icon}
        </div>
      )}
      {prefix && (
        <span className="absolute left-10 top-1/2 transform -translate-y-1/2 text-secondary/60 pointer-events-none">
          {prefix}
        </span>
      )}
      <Field
        type={type}
        name={name}
        readOnly={readOnly}
        placeholder=" "
        className={`peer w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary placeholder-transparent
          ${icon ? 'pl-10' : ''} ${prefix ? 'pl-16' : ''}
          read-only:bg-gray-100 read-only:cursor-not-allowed`}
      />
      <label
        className={`absolute bg-white px-2 text-sm font-medium text-secondary/70 transition-all duration-200 pointer-events-none
          peer-placeholder-shown:top-1/2 peer-placeholder-shown:transform peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-secondary/50
          peer-focus:top-0 peer-focus:text-xs peer-focus:text-primary
          peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-primary
          ${icon ? 'left-8' : 'left-3'}`}
      >
        {placeholder}
      </label>
      <ErrorMessage name={name} component="p" className="text-red-500 text-sm mt-1" />
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
                  className="p-1 text-secondary/60 hover:text-primary transition-colors duration-200"
                >
                  {isCollapsed ? <FaChevronRight /> : <FaChevronDown />}
                </button>
              )}
              <label className="flex items-center text-sm font-medium cursor-pointer text-secondary hover:text-primary transition-colors duration-200">
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
                  className="p-1 text-secondary/60 hover:text-primary transition-colors duration-200"
                >
                  {isDescriptionVisible ? <FaChevronDown /> : <FaChevronRight />}
                </button>
              )}
            </div>
            {fieldName === 'industry' && isDescriptionVisible && (
              <p className="text-xs text-secondary/70 mt-1 ml-10 transition-all duration-300 ease-in-out">
                {item.description}
              </p>
            )}
            {isItemParent && !isCollapsed && (
              <ul className="mt-2 pl-4 border-l-2 border-primary/30">
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
      <h3 className="block text-sm font-medium text-secondary mb-3">{title}</h3>
      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${title}`}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-brand text-secondary"
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary/50" />
      </div>
      <div className="bg-brand-light border border-primary/20 rounded-lg p-4 max-h-64 overflow-y-auto shadow-inner">
        {filteredData.length > 0 ? renderRadios(filteredData) : (
          <p className="text-secondary/60 text-sm text-center py-4">No results found for "{query}".</p>
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

  // ------------------- Formik Initial Values -------------------
  const initialValues = {
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

        let updatedUser = null;

        try {
          const profileResponse = await axios.get(
            "https://advisor-seller-backend.vercel.app/api/auth/profile",
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (profileResponse.status >= 200 && profileResponse.status < 300) {
            updatedUser = profileResponse.data;
          }
        } catch (profileError) {
          console.error('Failed to refresh profile after seller form submit:', profileError);
        }

        if (!updatedUser) {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          updatedUser = { ...storedUser, isProfileComplete: true };
        } else {
          updatedUser = { ...updatedUser, isProfileComplete: true };
        }

        localStorage.setItem('user', JSON.stringify(updatedUser));

        resetForm();
        navigate('/seller-dashboard', { replace: true });
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
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-light py-8">
      <Toaster position="top-center" reverseOrder={false} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto p-8 bg-brand-light shadow-2xl rounded-3xl border border-primary/10"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-secondary mb-2">Seller Profile</h1>
          <p className="text-secondary/70 text-lg">Create your business profile to connect with advisors</p>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-third mx-auto mt-4 rounded-full"></div>
        </div>

          <Formik
            enableReinitialize
            initialValues={initialValues}
            validationSchema={SellerSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, setFieldValue }) => (
              <Form className="space-y-8">

                {/* Company Information */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm"
                >
                  <h3 className="text-xl font-semibold text-secondary mb-6 flex items-center">
                    <FaBuilding className="mr-3 text-primary" />
                    Company Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <AnimatedInput name="companyName" placeholder="Company Name" icon={<FaBuilding />} />
                    </div>
                    
                    <div>
                      <AnimatedInput name="phone" placeholder="Phone Number" icon={<FaPhone />} />
                    </div>
                    
                    <div className="md:col-span-2">
                      <AnimatedInput name="website" placeholder="Website URL" icon={<FaGlobe />} />
                    </div>
                  </div>
                </motion.div>

                {/* Revenue Information */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-secondary flex items-center">
                      <FaDollarSign className="mr-3 text-primary" />
                      Revenue Information
                    </h3>
                    <div className="w-32">
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
                                className={`w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm flex items-center justify-between cursor-pointer hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${open ? 'ring-2 ring-primary/20' : ''}`}
                                onClick={() => setOpen((prev) => !prev)}
                                onBlur={() => setTimeout(() => setOpen(false), 120)}
                              >
                                <span className="text-secondary">{currencies.find(c => c.value === field.value)?.label || 'Currency'}</span>
                                <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="ml-2">
                                  <FaChevronDown className="text-secondary/60" />
                                </motion.span>
                              </div>
                              <AnimatePresence>
                                {open && (
                                  <motion.ul
                                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                    transition={{ duration: 0.18 }}
                                    className="absolute left-0 z-10 w-full bg-white border border-primary/20 rounded-lg shadow-lg mt-1 overflow-hidden"
                                  >
                                    {currencies.map((c) => (
                                      <li
                                        key={c.value}
                                        className={`px-4 py-2 text-sm cursor-pointer hover:bg-primary/10 transition ${field.value === c.value ? 'bg-primary/10 font-semibold text-primary' : 'text-secondary'}`}
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
                  
                  <AnimatedInput name="annualRevenue" type="number" placeholder="Annual Revenue" prefix="$" icon={<FaDollarSign />} />
                </motion.div>

                {/* Industry & Geography */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm"
                >
                  <h3 className="text-xl font-semibold text-secondary mb-6">Business Details</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center mb-3">
                        <FaIndustry className="mr-2 text-primary" />
                        <span className="text-sm font-medium text-secondary">Industry Sector</span>
                      </div>
                      <RadioFilter
                        title="Industry Sectors"
                        data={rawIndustryData}
                        fieldName="industry"
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center mb-3">
                        <FaMapMarkerAlt className="mr-2 text-primary" />
                        <span className="text-sm font-medium text-secondary">Geographic Location</span>
                      </div>
                      <RadioFilter
                        title="Geographies"
                        data={rawGeographyData}
                        fieldName="geography"
                      />
                    </div>
                  </div>
                </motion.div>


                {/* Description */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm"
                >
                  <h3 className="text-xl font-semibold text-secondary mb-6 flex items-center">
                    <FaFileAlt className="mr-3 text-primary" />
                    Company Description
                  </h3>
                  
                  <div className="relative">
                    <Field
                      as="textarea"
                      name="description"
                      rows="4"
                      placeholder="Describe your company, products, services, and what makes you unique..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary resize-none"
                    />
                    <ErrorMessage name="description" component="p" className="text-red-500 text-sm mt-2" />
                  </div>
                </motion.div>

                {/* Submit */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center pt-6"
                >
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-4 bg-gradient-to-r from-primary to-third text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? "Creating Profile..." : "Create Seller Profile"}
                  </button>
                </motion.div>
              </Form>
            )}
          </Formik>
      </motion.div>
    </div>
  );
};

export default SellerForm;
