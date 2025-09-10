import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import * as Yup from "yup";
import {
  FaBuilding,
  FaChartLine,
  FaDollarSign,
  FaFileAlt,
  FaCog,
  FaSignOutAlt,
  FaUser,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaChevronRight,
  FaUpload,
} from "react-icons/fa";
import { rawIndustryData } from "../../components/Static/industryData";
import { rawGeographyData } from "../../components/Static/geographyData";


// ---------- MultiSelectFilter ----------
const MultiSelectFilter = ({ title, data, fieldName }) => {
  const { values, setFieldValue } = useFormikContext();
  const [query, setQuery] = useState("");
  const [collapsedParents, setCollapsedParents] = useState(new Set(data.map((item) => item.id)));

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

  const filteredData = filterData(data, query);
  const selectedItems = values[fieldName] || [];

  const renderCheckboxes = (items) => (
    <ul className="list-none space-y-2">
      {items.map((item) => {
        const isItemParent = item.children && item.children.length > 0;
        const isCollapsed = collapsedParents.has(item.id);
        const isSelected = selectedItems.includes(item.label);

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
              <label
                className={`flex items-center text-sm font-medium cursor-pointer transition-colors duration-200 ${
                  isSelected ? "text-primary font-semibold" : "text-gray-700 hover:text-primary"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    const newSelected = e.target.checked
                      ? [...selectedItems, item.label]
                      : selectedItems.filter((i) => i !== item.label);
                    setFieldValue(fieldName, newSelected);
                  }}
                  className="form-checkbox h-4 w-4 text-primary focus:ring-primary transition-colors duration-200"
                />
                <span className="ml-2">{item.label}</span>
              </label>
            </div>
            {isItemParent && !isCollapsed && (
              <ul className="mt-2 pl-4 border-l-2 border-primary/20">
                {renderCheckboxes(item.children)}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="w-full">
      {title && <h3 className="block text-sm font-medium mb-2">{title}</h3>}
      <div className="relative mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${fieldName}`}
          className="w-full p-2 pr-10 rounded-xl border-[0.15rem] border-primary/30 focus:border-primary focus:outline-none transition"
        />
      </div>
      <div className="bg-white max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
        {filteredData.length > 0 ? (
          renderCheckboxes(filteredData)
        ) : (
          <p className="text-gray-500 text-sm">No results found for "{query}".</p>
        )}
      </div>
      <ErrorMessage name={fieldName} component="p" className="text-red-500 text-sm mt-1" />
    </div>
  );
};

// ---------- Main Component ----------
const EditAdvisorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [testimonialFiles, setTestimonialFiles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/advisor-login");
        return;
      }

      const userRes = await axios.get("https://advisor-seller-backend.vercel.app/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userRes.data.role !== "advisor") {
        navigate("/seller-login");
        return;
      }
      setUser(userRes.data);

      const profileRes = await axios.get("https://advisor-seller-backend.vercel.app/api/advisors/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfile(profileRes.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
      navigate("/advisor-dashboard");
    } finally {
      setLoading(false);
    }
  };

  const validationSchema = Yup.object().shape({
    companyName: Yup.string().required("Company name is required"),
    phone: Yup.string().required("Phone is required"),
    website: Yup.string().url("Invalid URL").required("Website is required"),
    industries: Yup.array().min(1, "Select at least one industry"),
    geographies: Yup.array().min(1, "Select at least one geography"),
    yearsExperience: Yup.number().min(1).required("Years of experience is required"),
    numberOfTransactions: Yup.number().min(0).required("Number of transactions is required"),
    currency: Yup.string().required("Currency is required"),
    description: Yup.string().required("Description is required"),
    licensing: Yup.string().required("Licensing information is required"),
    revenueRange: Yup.object().shape({
      min: Yup.number().required("Minimum revenue is required"),
      max: Yup.number().required("Maximum revenue is required"),
    }),
  });

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();

      // append text fields
      Object.keys(values).forEach((key) => {
        if (typeof values[key] === "object") {
          formData.append(key, JSON.stringify(values[key]));
        } else {
          formData.append(key, values[key]);
        }
      });

      // append files
      if (logoFile) formData.append("logo", logoFile);
      testimonialFiles.forEach((file) => formData.append("testimonials", file));

      await axios.patch("https://advisor-seller-backend.vercel.app/api/advisors/profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Profile updated successfully!");
      navigate("/advisor-dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
          <button
            onClick={() => navigate("/advisor-dashboard")}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between bg-white shadow-sm border-b border-gray-200 px-4 lg:px-8 py-4">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Edit Profile</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <Formik
              initialValues={{
                companyName: profile.companyName || "",
                phone: profile.phone || "",
                website: profile.website || "",
                industries: profile.industries || [],
                geographies: profile.geographies || [],
                yearsExperience: profile.yearsExperience || "",
                numberOfTransactions: profile.numberOfTransactions || "",
                currency: profile.currency || "USD",
                description: profile.description || "",
                licensing: profile.licensing || "",
                revenueRange: {
                  min: profile.revenueRange?.min || "",
                  max: profile.revenueRange?.max || "",
                },
              }}
              validationSchema={validationSchema}
              onSubmit={onSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-8">
                  {/* Company Info */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <FaBuilding className="mr-3 text-primary" /> Company Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label>Company Name</label>
                        <Field name="companyName" className="w-full px-3 py-2 border rounded-lg" />
                        <ErrorMessage name="companyName" component="div" className="text-red-500 text-sm" />
                      </div>
                      <div>
                        <label>Phone</label>
                        <Field name="phone" className="w-full px-3 py-2 border rounded-lg" />
                        <ErrorMessage name="phone" component="div" className="text-red-500 text-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label>Website</label>
                        <Field name="website" className="w-full px-3 py-2 border rounded-lg" />
                        <ErrorMessage name="website" component="div" className="text-red-500 text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* File Uploads */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <FaUpload className="mr-3 text-primary" /> Uploads
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2">Upload Logo (Image)</label>
                        <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])} />
                      </div>
                      <div>
                        <label className="block mb-2">Upload Testimonials (PDF, max 5)</label>
                        <input
                          type="file"
                          accept="application/pdf"
                          multiple
                          onChange={(e) => setTestimonialFiles(Array.from(e.target.files))}
                        />
                      </div>
                    </div>
                  </div>


              {/* Industries & Geographies */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Expertise Areas</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <MultiSelectFilter
                    title="Industries"
                    data={rawIndustryData}
                    fieldName="industries"
                  />
                  
                  <MultiSelectFilter
                    title="Geographies"
                    data={rawGeographyData}
                    fieldName="geographies"
                  />
                </div>
              </div>

              {/* Experience & Performance */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FaChartLine className="mr-3 text-primary" />
                  Experience & Performance
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                    <Field
                      name="yearsExperience"
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <ErrorMessage name="yearsExperience" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Transactions</label>
                    <Field
                      name="numberOfTransactions"
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <ErrorMessage name="numberOfTransactions" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              </div>

              {/* Revenue Range */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FaDollarSign className="mr-3 text-primary" />
                    Revenue Size Range
                  </h3>
                  <div className="w-28">
                    <Field name="currency">
                      {({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Revenue</label>
                    <Field
                      name="revenueRange.min"
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <ErrorMessage name="revenueRange.min" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Revenue</label>
                    <Field
                      name="revenueRange.max"
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <ErrorMessage name="revenueRange.max" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              </div>

              {/* Description & Licensing */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <FaFileAlt className="mr-3 text-primary" />
                  Additional Information
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
                    <Field
                      as="textarea"
                      name="description"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                    <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">Are you licensed?</label>
                    <div className="flex space-x-8">
                      <label className="flex items-center cursor-pointer">
                        <Field
                          type="radio"
                          name="licensing"
                          value="yes"
                          className="form-radio h-5 w-5 text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="ml-3 text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <Field
                          type="radio"
                          name="licensing"
                          value="no"
                          className="form-radio h-5 w-5 text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="ml-3 text-gray-700">No</span>
                      </label>
                    </div>
                    <ErrorMessage name="licensing" component="div" className="text-red-500 text-sm mt-2" />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/advisor-dashboard')}
                  className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-primary to-third text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditAdvisorProfile;