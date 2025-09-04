import React, { useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

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
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {isCollapsed ? (
                    <FaChevronRight size={12} />
                  ) : (
                    <FaChevronDown size={12} />
                  )}
                </button>
              )}
              <label className="flex items-center text-sm cursor-pointer text-gray-700 hover:text-blue-600 transition-colors duration-200">
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
                  className="form-checkbox h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
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
                      className="ml-2 text-gray-500 hover:text-blue-600 transform transition-transform"
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
                    <div className="ml-6 mt-1 text-xs text-gray-600 italic">
                      {item.shortDescription}
                    </div>
                  )}

              </label>
            </div>
            {isItemParent && !isCollapsed && (
              <div className="ml-6 border-l border-gray-200 pl-4 mt-1">
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
          className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200 bg-gray-50"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {filteredData.length > 0 ? (
          renderItems(filteredData)
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">
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
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {isCollapsed ? (
                    <FaChevronRight size={12} />
                  ) : (
                    <FaChevronDown size={12} />
                  )}
                </button>
              )}
              <label className="flex items-center text-sm cursor-pointer text-gray-700 hover:text-blue-600 transition-colors duration-200">
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
                  className="form-checkbox h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
                />
                <span className="ml-2 select-none">{item.label}</span>
              </label>
            </div>
            {isItemParent && !isCollapsed && (
              <div className="ml-6 border-l border-gray-200 pl-4 mt-1">
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
          className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200 bg-gray-50"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {filteredData.length > 0 ? (
          renderItems(filteredData)
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">
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
    testimonials: Array(5).fill({
      clientName: "",
      testimonial: "",
      pdfUrl: "",
    }),
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
          testimonial: Yup.string().when("clientName", {
            is: (val) => !!val, // only required if clientName is filled
            then: (schema) => schema.required("Testimonial required"),
            otherwise: (schema) => schema.notRequired(),
          }),
          pdfUrl: Yup.string().when("clientName", {
            is: (val) => !!val, // only required if clientName is filled
            then: (schema) => schema.required("PDF required"),
            otherwise: (schema) => schema.notRequired(),
          }),
        })
      )
      .min(1, "At least one testimonial is required") // must complete at least 1
      .max(5, "You can add up to 5 testimonials only"),

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
    try {
      if (logoFile) {
        values.logoUrl = await handleFileUpload(logoFile, "https://advisor-seller-backend.vercel.app/api/upload/logo");
      }
      const token = localStorage.getItem("access_token");

      await axios.post("https://advisor-seller-backend.vercel.app/api/advisors/profile", values, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Advisor profile created successfully!");
      resetForm();
      setLogoFile(null);
    } catch (error) {
      toast.error("Error submitting form");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto p-6 bg-white shadow-xl rounded-2xl"
    >
      <h2 className="text-2xl font-bold mb-4">Advisor Profile Form</h2>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ isSubmitting, setFieldValue, values }) => (
          <Form className="space-y-4">
            {/* Company Name */}
            <div>
              <label>Company Name</label>
              <Field name="companyName" className="w-full p-2 border rounded" />
              <ErrorMessage
                name="companyName"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            {/* Phone */}
            <div>
              <label>Phone</label>
              <Field name="phone" className="w-full p-2 border rounded" />
              <ErrorMessage
                name="phone"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            {/* Website */}
            <div>
              <label>Website</label>
              <Field name="website" className="w-full p-2 border rounded" />
              <ErrorMessage
                name="website"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            {/* Industries & Geographies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Industries
                </label>
                <IndustryChooser
                  options={rawIndustryData}
                  selected={values.industries}
                  onChange={(val) => setFieldValue("industries", val)}
                />
                <ErrorMessage
                  name="industries"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Geographies
                </label>
                <GeographyChooser
                  options={rawGeographyData}
                  selected={values.geographies}
                  onChange={(val) => setFieldValue("geographies", val)}
                />
                <ErrorMessage
                  name="geographies"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
            </div>

            {/* Years Experience */}
            <div>
              <label>Years of Experience</label>
              <Field
                name="yearsExperience"
                type="number"
                className="w-full p-2 border rounded"
              />
              <ErrorMessage
                name="yearsExperience"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            {/* Number of Transactions */}
            <div>
              <label>Number of Transactions</label>
              <Field
                name="numberOfTransactions"
                type="number"
                className="w-full p-2 border rounded"
              />
              <ErrorMessage
                name="numberOfTransactions"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            {/* Revenue Range */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Revenue Size Range
                </label>
                <div className="w-24">
                  <Field name="currency">
                    {({ field }) => (
                      <select
                        {...field}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              <div className="flex space-x-2 mt-2">
                <div className="flex-1">
                  <Field
                    name="revenueRange.min"
                    type="number"
                    placeholder="Min"
                    className="w-full p-2 border rounded"
                  />
                  <ErrorMessage
                    name="revenueRange.min"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <Field
                    name="revenueRange.max"
                    type="number"
                    placeholder="Max"
                    className="w-full p-2 border rounded"
                  />
                  <ErrorMessage
                    name="revenueRange.max"
                    component="div"
                    className="text-red-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label>Description</label>
              <Field
                as="textarea"
                name="description"
                className="w-full p-2 border rounded"
              />
              <ErrorMessage
                name="description"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            {/* Licensing */}
            <div>
              <label className="block text-sm font-semibold mb-3">
                Are you licensed?
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center cursor-pointer">
                  <Field
                    type="radio"
                    name="licensing"
                    value="yes"
                    className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <Field
                    type="radio"
                    name="licensing"
                    value="no"
                    className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">No</span>
                </label>
              </div>
              <ErrorMessage
                name="licensing"
                component="div"
                className="text-red-500 text-sm mt-1"
              />
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={() => {
                const profileData = {
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
                  testimonials: [], // ✅ keep empty for now
                };

                sessionStorage.setItem("advisor-profile", JSON.stringify(profileData));
                window.location.href = "/advisor-upload";
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700"
            >
              Continue
            </button>


          </Form>
        )}
      </Formik>
    </motion.div>
  );
};

export default AdvisorForm;
