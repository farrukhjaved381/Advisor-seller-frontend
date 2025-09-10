import React, { useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FaChevronDown, FaChevronRight, FaSearch, FaBuilding, FaPhone, FaGlobe, FaCalendarAlt, FaChartLine, FaDollarSign, FaFileAlt, FaCertificate, FaUpload, FaCheckCircle, FaImage, FaQuoteLeft, FaUser, FaPlus, FaTrash, FaFilePdf } from "react-icons/fa";

// ✅ Use named imports for static data
import { rawIndustryData } from "../../../components/Static/industryData";
import { rawGeographyData } from "../../../components/Static/geographyData";

// =================== Industry Chooser ===================
const IndustryChooser = ({ options, selected, onChange }) => {
  const [query, setQuery] = useState("");
  const [collapsedParents, setCollapsedParents] = useState(
    new Set(options.map((item) => item.id))
  );

  const handleToggleCollapse = (item) => {
    setCollapsedParents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item.id)) newSet.delete(item.id);
      else newSet.add(item.id);
      return newSet;
    });
  };

  const filterData = (items, currentQuery) => {
    if (!currentQuery) return items;
    const lowerCaseQuery = currentQuery.toLowerCase();
    return items.filter((item) => {
      const itemMatches = item.label.toLowerCase().includes(lowerCaseQuery);
      if (item.children) {
        const filteredChildren = filterData(item.children, currentQuery);
        if (itemMatches || filteredChildren.length > 0) return true;
      }
      return itemMatches;
    });
  };

  const filteredData = filterData(options, query);

  const renderItems = (items) => (
    <ul className="list-none space-y-1">
      {items.map((item) => {
        const isItemParent = item.children && item.children.length > 0;
        const isCollapsed = collapsedParents.has(item.id);

        return (
          <li key={item.id} className="ml-2">
            <div className="flex items-center space-x-2 py-1">
              {isItemParent && (
                <button
                  type="button"
                  onClick={() => handleToggleCollapse(item)}
                  className="p-1 text-secondary/60 hover:text-primary transition-colors duration-200"
                >
                  {isCollapsed ? (
                    <FaChevronRight size={12} />
                  ) : (
                    <FaChevronDown size={12} />
                  )}
                </button>
              )}
              <label className="flex items-center text-sm cursor-pointer text-secondary hover:text-primary transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={selected.includes(item.label)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selected, item.label]);
                    } else {
                      onChange(selected.filter((i) => i !== item.label));
                    }
                  }}
                  className="form-checkbox h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded transition-colors duration-200"
                />
                <span className="ml-2 select-none flex items-center">
                  {item.label}
                  {item.shortDescription && (
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedParents((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(`desc-${item.id}`)) newSet.delete(`desc-${item.id}`);
                          else newSet.add(`desc-${item.id}`);
                          return newSet;
                        })
                      }
                      className="ml-2 text-secondary/60 hover:text-primary transform transition-transform"
                    >
                      {collapsedParents.has(`desc-${item.id}`) ? (
                        <FaChevronDown size={12} />
                      ) : (
                        <FaChevronRight size={12} />
                      )}
                    </button>
                  )}
                </span>
                {item.shortDescription &&
                  collapsedParents.has(`desc-${item.id}`) && (
                    <div className="ml-6 mt-1 text-xs text-secondary/70 italic">
                      {item.shortDescription}
                    </div>
                  )}

              </label>
            </div>
            {isItemParent && !isCollapsed && (
              <div className="ml-6 border-l border-primary/20 pl-4 mt-1">
                {renderItems(item.children)}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="w-full">
      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Industry Sectors"
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-brand text-secondary"
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary/50" />
      </div>
      <div className="bg-brand-light border border-primary/20 rounded-lg p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-gray-100 shadow-inner">
        {filteredData.length > 0 ? (
          renderItems(filteredData)
        ) : (
          <p className="text-secondary/60 text-sm text-center py-4">
            No results found for "{query}".
          </p>
        )}
      </div>
    </div>
  );
};

// =================== Geography Chooser ===================
const GeographyChooser = ({ options, selected, onChange }) => {
  const [query, setQuery] = useState("");
  const [collapsedParents, setCollapsedParents] = useState(
    new Set(options.map((item) => item.id))
  );

  const handleToggleCollapse = (item) => {
    setCollapsedParents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item.id)) newSet.delete(item.id);
      else newSet.add(item.id);
      return newSet;
    });
  };

  const filterData = (items, currentQuery) => {
    if (!currentQuery) return items;
    const lowerCaseQuery = currentQuery.toLowerCase();
    return items.filter((item) => {
      const itemMatches = item.label.toLowerCase().includes(lowerCaseQuery);
      if (item.children) {
        const filteredChildren = filterData(item.children, currentQuery);
        if (itemMatches || filteredChildren.length > 0) return true;
      }
      return itemMatches;
    });
  };

  const filteredData = filterData(options, query);

  const renderItems = (items) => (
    <ul className="list-none space-y-1">
      {items.map((item) => {
        const isItemParent = item.children && item.children.length > 0;
        const isCollapsed = collapsedParents.has(item.id);

        return (
          <li key={item.id} className="ml-2">
            <div className="flex items-center space-x-2 py-1">
              {isItemParent && (
                <button
                  type="button"
                  onClick={() => handleToggleCollapse(item)}
                  className="p-1 text-secondary/60 hover:text-primary transition-colors duration-200"
                >
                  {isCollapsed ? (
                    <FaChevronRight size={12} />
                  ) : (
                    <FaChevronDown size={12} />
                  )}
                </button>
              )}
              <label className="flex items-center text-sm cursor-pointer text-secondary hover:text-primary transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={selected.includes(item.label)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selected, item.label]);
                    } else {
                      onChange(selected.filter((i) => i !== item.label));
                    }
                  }}
                  className="form-checkbox h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded transition-colors duration-200"
                />
                <span className="ml-2 select-none">{item.label}</span>
              </label>
            </div>
            {isItemParent && !isCollapsed && (
              <div className="ml-6 border-l border-primary/20 pl-4 mt-1">
                {renderItems(item.children)}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="w-full">
      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Geographies"
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-brand text-secondary"
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary/50" />
      </div>
      <div className="bg-brand-light border border-primary/20 rounded-lg p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-gray-100 shadow-inner">
        {filteredData.length > 0 ? (
          renderItems(filteredData)
        ) : (
          <p className="text-secondary/60 text-sm text-center py-4">
            No results found for "{query}".
          </p>
        )}
      </div>
    </div>
  );
};

// =================== Advisor Form ===================
const AdvisorForm = () => {
  const [logoFile, setLogoFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const initialValues = {
    companyName: "",
    phone: "",
    website: "",
    industries: [],
    geographies: [],
    yearsExperience: "",
    numberOfTransactions: "",
    currency: "USD",
    description: "",
    licensing: "",
    testimonials: [{
      clientName: "",
      testimonial: "",
      pdfFile: null,
    }],
    revenueRange: { min: "", max: "" },
    visibleTestimonials: 1,   // 👈 added here
  };

  const validationSchema = Yup.object().shape({
    companyName: Yup.string().required("Required"),
    phone: Yup.string().required("Required"),
    website: Yup.string().url("Invalid URL").required("Required"),
    industries: Yup.array().min(1, "Pick at least one industry"),
    geographies: Yup.array().min(1, "Pick at least one geography"),
    yearsExperience: Yup.number().min(1).required("Required"),
    numberOfTransactions: Yup.number().min(0).required("Required"),
    currency: Yup.string().required("Required"),
    description: Yup.string().required("Required"),
    licensing: Yup.string().required("Required"),
    testimonials: Yup.array()
      .of(
        Yup.object().shape({
          clientName: Yup.string().notRequired(),
          testimonial: Yup.string().notRequired(),
          pdfFile: Yup.mixed().notRequired(),
        })
      )
      .notRequired(),

    revenueRange: Yup.object().shape({
      min: Yup.number().required("Required"),
      max: Yup.number().required("Required"),
    }),
  });
  const handleFileUpload = async (file, endpoint) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("access_token");

    const response = await axios.post(endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.url;
  };


  const onSubmit = async (values, { setSubmitting, resetForm }) => {
    console.log('Form submitted:', { currentStep, values });
    try {
      if (currentStep === 1) {
        setCurrentStep(2);
        return;
      }

      let logoUrl = "";
      if (logoFile) {
        logoUrl = await handleFileUpload(logoFile, "https://advisor-seller-backend.vercel.app/api/upload/logo");
      }

      // Upload testimonial PDFs
      const testimonials = await Promise.all(
        values.testimonials.map(async (t) => {
          if (t.clientName && t.testimonial && t.pdfFile) {
            const pdfUrl = await handleFileUpload(
              t.pdfFile,
              "https://advisor-seller-backend.vercel.app/api/upload/testimonial"
            );
            return {
              clientName: t.clientName,
              testimonial: t.testimonial,
              pdfUrl,
            };
          }
          return null;
        })
      );

      const filteredTestimonials = testimonials.filter(Boolean);
      
      const token = localStorage.getItem("access_token");
      const payload = {
        companyName: values.companyName,
        phone: values.phone,
        website: values.website,
        industries: values.industries,
        geographies: values.geographies,
        yearsExperience: values.yearsExperience,
        numberOfTransactions: values.numberOfTransactions,
        currency: values.currency,
        description: values.description,
        licensing: values.licensing,
        revenueRange: values.revenueRange,
        logoUrl,
        testimonials: filteredTestimonials,
      };
      
      console.log('Sending payload:', payload);
      
      await axios.post("https://advisor-seller-backend.vercel.app/api/advisors/profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Advisor profile created successfully!");
      resetForm();
      setLogoFile(null);
      
      // Wait for backend to update then redirect
      setTimeout(() => {
        localStorage.removeItem('user');
        sessionStorage.clear();
        window.location.replace('/advisor-dashboard');
      }, 1000);
    } catch (error) {
      console.error('Form submission error:', error.response?.data || error);
      toast.error("Error submitting form");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand to-brand-light py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto p-8 bg-brand-light shadow-2xl rounded-3xl border border-primary/10"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-secondary mb-2">Advisor Profile</h1>
          <p className="text-secondary/70 text-lg">Create your professional advisor profile</p>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-third mx-auto mt-4 rounded-full"></div>
        </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ isSubmitting, setFieldValue, values }) => (
          <Form className="space-y-8">
            {/* Company Information Section */}
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
                  <label className="block text-sm font-medium text-secondary mb-2">Company Name</label>
                  <Field name="companyName" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary" />
                  <ErrorMessage name="companyName" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2 flex items-center">
                    <FaPhone className="mr-2 text-primary" />
                    Phone
                  </label>
                  <Field name="phone" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary" />
                  <ErrorMessage name="phone" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary mb-2 flex items-center">
                    <FaGlobe className="mr-2 text-primary" />
                    Website
                  </label>
                  <Field name="website" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary" />
                  <ErrorMessage name="website" component="div" className="text-red-500 text-sm mt-1" />
                </div>
              </div>
            </motion.div>

            {/* Industries & Geographies */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-secondary mb-6">Expertise Areas</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-3">
                    Industries
                  </label>
                  <IndustryChooser
                    options={rawIndustryData}
                    selected={values.industries}
                    onChange={(val) => setFieldValue("industries", val)}
                  />
                  <ErrorMessage name="industries" component="div" className="text-red-500 text-sm mt-2" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-3">
                    Geographies
                  </label>
                  <GeographyChooser
                    options={rawGeographyData}
                    selected={values.geographies}
                    onChange={(val) => setFieldValue("geographies", val)}
                  />
                  <ErrorMessage name="geographies" component="div" className="text-red-500 text-sm mt-2" />
                </div>
              </div>
            </motion.div>

            {/* Experience & Performance */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-secondary mb-6 flex items-center">
                <FaChartLine className="mr-3 text-primary" />
                Experience & Performance
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2 flex items-center">
                    <FaCalendarAlt className="mr-2 text-primary" />
                    Years of Experience
                  </label>
                  <Field
                    name="yearsExperience"
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary"
                  />
                  <ErrorMessage name="yearsExperience" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Number of Transactions
                  </label>
                  <Field
                    name="numberOfTransactions"
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary"
                  />
                  <ErrorMessage name="numberOfTransactions" component="div" className="text-red-500 text-sm mt-1" />
                </div>
              </div>
            </motion.div>

            {/* Revenue Range */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-secondary flex items-center">
                  <FaDollarSign className="mr-3 text-primary" />
                  Revenue Size Range
                </h3>
                <div className="w-28">
                  <Field name="currency">
                    {({ field }) => (
                      <select
                        {...field}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-secondary"
                      >
                        <option value="USD">USD</option>
                        <option value="PKR">PKR</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    )}
                  </Field>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Minimum Revenue</label>
                  <Field
                    name="revenueRange.min"
                    type="number"
                    placeholder="Enter minimum amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary"
                  />
                  <ErrorMessage name="revenueRange.min" component="div" className="text-red-500 text-sm mt-1" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Maximum Revenue</label>
                  <Field
                    name="revenueRange.max"
                    type="number"
                    placeholder="Enter maximum amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary"
                  />
                  <ErrorMessage name="revenueRange.max" component="div" className="text-red-500 text-sm mt-1" />
                </div>
              </div>
            </motion.div>

            {/* Description & Licensing */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-secondary mb-6 flex items-center">
                <FaFileAlt className="mr-3 text-primary" />
                Additional Information
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Company Description</label>
                  <Field
                    as="textarea"
                    name="description"
                    rows={4}
                    placeholder="Describe your company, services, and expertise..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary resize-none"
                  />
                  <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-4 flex items-center">
                    <FaCertificate className="mr-2 text-primary" />
                    Are you licensed?
                  </label>
                  <div className="flex space-x-8">
                    <label className="flex items-center cursor-pointer group">
                      <Field
                        type="radio"
                        name="licensing"
                        value="yes"
                        className="form-radio h-5 w-5 text-primary focus:ring-primary border-gray-300 transition-colors duration-200"
                      />
                      <span className="ml-3 text-secondary group-hover:text-primary transition-colors duration-200">Yes</span>
                    </label>
                    <label className="flex items-center cursor-pointer group">
                      <Field
                        type="radio"
                        name="licensing"
                        value="no"
                        className="form-radio h-5 w-5 text-primary focus:ring-primary border-gray-300 transition-colors duration-200"
                      />
                      <span className="ml-3 text-secondary group-hover:text-primary transition-colors duration-200">No</span>
                    </label>
                  </div>
                  <ErrorMessage name="licensing" component="div" className="text-red-500 text-sm mt-2" />
                </div>
              </div>
            </motion.div>

            {currentStep === 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center pt-6"
              >
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-4 bg-gradient-to-r from-primary to-third text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30"
                >
                  Continue to Upload Step
                </button>
              </motion.div>
            )}

            {/* Upload Step */}
            {currentStep === 2 && (
              <>
                {/* Logo Upload */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm"
                >
                  <h3 className="text-xl font-semibold text-secondary mb-6 flex items-center">
                    <FaImage className="mr-3 text-primary" />
                    Company Logo
                  </h3>
                  
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-full max-w-md">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setLogoFile(file);
                            }
                          }}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer bg-white hover:bg-primary/5 transition-all duration-200"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <FaUpload className="w-8 h-8 mb-4 text-primary" />
                            <p className="mb-2 text-sm text-secondary">
                              <span className="font-semibold">Click to upload</span> your company logo
                            </p>
                            <p className="text-xs text-secondary/60">PNG, JPG or JPEG (MAX. 5MB)</p>
                          </div>
                        </label>
                      </div>
                      
                      {logoFile && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center">
                            <FaCheckCircle className="text-green-500 mr-2" />
                            <span className="text-sm text-green-700 font-medium">
                              {logoFile.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Testimonials */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm"
                >
                  <FieldArray name="testimonials">
                    {({ push, remove }) => {
                      const completedTestimonials = values.testimonials.filter(
                        (t) => t.clientName && t.testimonial && t.pdfFile
                      ).length;

                      return (
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-secondary flex items-center">
                              <FaQuoteLeft className="mr-3 text-primary" />
                              Client Testimonials
                            </h3>
                            <div className="flex items-center space-x-3">
                              <div className="bg-primary/10 px-3 py-1 rounded-full">
                                <span className="text-primary font-medium text-sm">
                                  {completedTestimonials}/{values.testimonials.length} completed
                                </span>
                              </div>
                              {values.testimonials.length < 5 && (
                                <button
                                  type="button"
                                  onClick={() => push({ clientName: "", testimonial: "", pdfFile: null })}
                                  className="flex items-center px-3 py-1 bg-primary text-white rounded-full hover:bg-primary/90 transition-all duration-200 text-sm"
                                >
                                  <FaPlus className="mr-1" />
                                  Add Testimonial
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {values.testimonials.map((testimonial, index) => {
                              const isCompleted = testimonial.clientName && testimonial.testimonial && testimonial.pdfFile;
                              
                              return (
                                <motion.div
                                  key={`testimonial-${index}`}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                    isCompleted 
                                      ? 'border-green-200 bg-green-50' 
                                      : 'border-gray-200 bg-white hover:border-primary/30'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-semibold text-secondary flex items-center">
                                      <FaUser className="mr-2 text-primary" />
                                      Testimonial {index + 1}
                                    </h4>
                                    <div className="flex items-center space-x-2">
                                      {isCompleted && (
                                        <FaCheckCircle className="text-green-500" />
                                      )}
                                      {values.testimonials.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => remove(index)}
                                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                        >
                                          <FaTrash size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <Field
                                      name={`testimonials[${index}].clientName`}
                                      placeholder="Client Name"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-sm bg-white"
                                    />
                                    <Field
                                      as="textarea"
                                      name={`testimonials[${index}].testimonial`}
                                      placeholder="Write the testimonial here..."
                                      rows="3"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-sm bg-white resize-none"
                                    />
                                    <div>
                                      <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) {
                                            setFieldValue(`testimonials[${index}].pdfFile`, file);
                                          }
                                        }}
                                        className="hidden"
                                        id={`pdf-upload-${index}`}
                                      />
                                      <label
                                        htmlFor={`pdf-upload-${index}`}
                                        className="flex items-center justify-center w-full py-2 px-3 border border-dashed border-primary/30 rounded-lg cursor-pointer bg-white hover:bg-primary/5 transition-all duration-200"
                                      >
                                        <FaFilePdf className="mr-2 text-primary" />
                                        <span className="text-sm text-secondary">
                                          {values.testimonials[index]?.pdfFile ? 'Change PDF' : 'Upload PDF'}
                                        </span>
                                      </label>
                                      {values.testimonials[index]?.pdfFile && (
                                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                          <div className="flex items-center">
                                            <FaFilePdf className="text-green-500 mr-2" />
                                            <span className="text-xs text-green-700 truncate">
                                              {values.testimonials[index].pdfFile.name}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }}
                  </FieldArray>
                </motion.div>

                {/* Final Submit */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-between pt-6"
                >
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all duration-300"
                  >
                    Back to Form
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-4 bg-gradient-to-r from-primary to-third text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? "Creating Profile..." : "Complete Profile Setup"}
                  </button>
                </motion.div>
              </>
            )}


          </Form>
        )}
      </Formik>
      </motion.div>
    </div>
  );
};

export default AdvisorForm;