import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { rawIndustryData } from "../../components/Static/industryData";
import { rawGeographyData } from "../../components/Static/geographyData";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

// IndustryChooser and GeographyChooser components are copied from AdvisorForm.jsx
// with slight modifications for the edit form.

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
                </span>
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

const EditAdvisorProfile = () => {
  const [initialValues, setInitialValues] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await axios.get("https://advisor-seller-backend.vercel.app/api/advisors/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInitialValues(res.data);
      } catch (error) {
        toast.error("Failed to fetch profile data.");
        navigate("/advisor-dashboard");
      }
    };
    fetchProfile();
  }, [navigate]);

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
    revenueRange: Yup.object().shape({
      min: Yup.number().required("Required"),
      max: Yup.number().required("Required"),
    }),
  });

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.patch("https://advisor-seller-backend.vercel.app/api/advisors/profile", values, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Profile updated successfully!");
      navigate("/advisor-dashboard");
    } catch (error) {
      toast.error("Error updating profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (!initialValues) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto p-6 bg-white shadow-xl rounded-2xl my-10"
    >
      <h2 className="text-2xl font-bold mb-4">Edit Advisor Profile</h2>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        enableReinitialize
      >
        {({ isSubmitting, setFieldValue, values }) => (
          <Form className="space-y-4">
            <div>
              <label>Company Name</label>
              <Field name="companyName" className="w-full p-2 border rounded" />
              <ErrorMessage
                name="companyName"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <div>
              <label>Phone</label>
              <Field name="phone" className="w-full p-2 border rounded" />
              <ErrorMessage
                name="phone"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

            <div>
              <label>Website</label>
              <Field name="website" className="w-full p-2 border rounded" />
              <ErrorMessage
                name="website"
                component="div"
                className="text-red-500 text-sm"
              />
            </div>

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

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? "Updating..." : "Update Profile"}
            </button>
          </Form>
        )}
      </Formik>
    </motion.div>
  );
};

export default EditAdvisorProfile;
