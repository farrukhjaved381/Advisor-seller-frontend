import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { motion } from "framer-motion";
import { getIndustryData } from "../../../components/Static/newIndustryData";
import { Country, State } from "country-state-city";
import { FaChevronDown, FaChevronRight, FaSearch, FaBuilding, FaPhone, FaGlobe, FaDollarSign, FaFileAlt, FaUser, FaEnvelope, FaIndustry, FaMapMarkerAlt, FaChartLine, FaUserTie } from "react-icons/fa"; 
import { HiOfficeBuilding, HiGlobeAlt, HiCurrencyDollar, HiDocumentText } from "react-icons/hi";

// ✅ Validation schema
const SellerSchema = Yup.object().shape({

  contactName: Yup.string()
    .min(2, "Contact name must be at least 2 characters")
    .max(100, "Contact name must not exceed 100 characters")
    .required("Contact name is required"),
  contactTitle: Yup.string()
    .min(2, "Contact title must be at least 2 characters")
    .max(100, "Contact title must not exceed 100 characters")
    .required("Contact title is required"),
  contactEmail: Yup.string()
    .email("Enter a valid email address")
    .required("Contact email is required"),

  companyName: Yup.string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name must not exceed 100 characters")
    .required("Company name is required"),
  phone: Yup.string()
    .matches(/^\+?[1-9]\d{1,14}$/, "Enter a valid phone number with country code")
    .min(10, "Phone number must be at least 10 digits")
    .required("Phone is required"),
  website: Yup.string()
    .required("Website is required")
    .test('url', 'Invalid URL format', function(value) {
      if (!value) return false;
      const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?(\/.*)?(\?.*)?(#.*)?$/;
      return urlPattern.test(value);
    }),
  industry: Yup.string().required("Please select an industry"),
  geography: Yup.string().required("Please select a geography"),
  annualRevenue: Yup.string()
    .required("Annual revenue is required")
    .test('is-number', 'Annual revenue must be a valid number', function(value) {
      if (!value) return false;
      const numValue = Number(value.replace(/,/g, ''));
      return !isNaN(numValue) && numValue >= 1000 && numValue <= 999999999;
    }),
  currency: Yup.string()
    .oneOf(["USD", "EUR", "JPY", "GBP", "CNY", "AUD", "CAD", "CHF", "HKD", "SGD", "SEK", "NOK", "NZD", "MXN", "ZAR", "TRY", "BRL", "KRW", "INR", "RUB"], "Please select a valid currency")
    .required("Currency is required"),
  description: Yup.string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must not exceed 1000 characters")
    .matches(/^(?!\s*$).+/, "Description cannot be empty or just whitespace")
    .required("Description is required"),
});

// Simple Input with separate label
const SimpleInput = ({ name, type = "text", placeholder, label, icon }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-secondary mb-2 flex items-center">
        {icon && <span className="mr-2 text-primary">{icon}</span>}
        {label}
      </label>
      <Field
        type={type}
        name={name}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary"
      />
      <ErrorMessage name={name} component="p" className="text-red-500 text-sm mt-1" />
    </div>
  );
};

// Industry Radio Chooser Component
const IndustryRadioChooser = ({ selected, onChange }) => {
  const [query, setQuery] = useState("");
  const [expandedSectors, setExpandedSectors] = useState({});
  const industryData = getIndustryData();

  const filterSectors = (sectors, currentQuery) => {
    if (!currentQuery) return sectors;
    const lowerCaseQuery = currentQuery.toLowerCase();
    return sectors.filter(sector => {
      const sectorMatches = sector.name.toLowerCase().includes(lowerCaseQuery);
      const groupMatches = sector.industryGroups.some(group => 
        group.name.toLowerCase().includes(lowerCaseQuery)
      );
      return sectorMatches || groupMatches;
    });
  };

  const filteredSectors = filterSectors(industryData.sectors, query);

  return (
    <div className="w-full">
      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Industry Sectors"
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary"
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary/50" />
      </div>
      <div className="bg-gray-50 border border-primary/20 rounded-lg p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-gray-100 shadow-inner">
        {filteredSectors.length > 0 ? (
          <div className="space-y-2">
            {filteredSectors.map((sector) => (
              <div key={sector.id} className="border-b border-gray-100 pb-1">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="industry"
                    id={`sector-${sector.id}`}
                    value={sector.name}
                    checked={selected === sector.name}
                    onChange={() => onChange(sector.name)}
                    className="mr-2 h-4 w-4 text-primary focus:ring-primary form-radio border-gray-300 transition-colors duration-200"
                  />
                  <div
                    className="flex items-center cursor-pointer flex-1"
                    onClick={() =>
                      setExpandedSectors(prev => ({
                        ...prev,
                        [sector.id]: !prev[sector.id],
                      }))
                    }
                  >
                    {expandedSectors[sector.id] ? (
                      <FaChevronDown className="h-4 w-4 mr-1 text-secondary/60" />
                    ) : (
                      <FaChevronRight className="h-4 w-4 mr-1 text-secondary/60" />
                    )}
                    <label htmlFor={`sector-${sector.id}`} className="text-secondary cursor-pointer font-medium">
                      {sector.name}
                    </label>
                  </div>
                </div>
                {expandedSectors[sector.id] && (
                  <div className="ml-6 mt-1 space-y-1">
                    {sector.industryGroups.map((group) => (
                      <div key={group.id} className="pl-2">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="industry"
                            id={`group-${group.id}`}
                            value={group.name}
                            checked={selected === group.name}
                            onChange={() => onChange(group.name)}
                            className="mr-2 h-4 w-4 text-primary focus:ring-primary form-radio border-gray-300 transition-colors duration-200"
                          />
                          <label
                            htmlFor={`group-${group.id}`}
                            className="text-secondary cursor-pointer text-sm"
                          >
                            {group.name}
                          </label>
                        </div>
                        {group.description && (
                          <div className="text-xs text-secondary/70 italic mt-1 ml-6">
                            {group.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-secondary/60 text-sm text-center py-4">
            No results found for "{query}".
          </p>
        )}
      </div>
    </div>
  );
};

// Geography Radio Chooser Component
const GeographyRadioChooser = ({ selected, onChange }) => {
  const [query, setQuery] = useState("");
  const [expandedCountries, setExpandedCountries] = useState({});

  let allCountries = Country.getAllCountries().filter((country) => {
    const countryMatch = country.name.toLowerCase().includes(query.toLowerCase());
    const states = State.getStatesOfCountry(country.isoCode);
    const stateMatch = states.some(state => state.name.toLowerCase().includes(query.toLowerCase()));
    return countryMatch || stateMatch;
  });

  const priorityCountries = ["United States", "Canada", "Mexico"];
  const priority = allCountries.filter(c => priorityCountries.includes(c.name));
  const rest = allCountries.filter(c => !priorityCountries.includes(c.name));
  allCountries = [...priority, ...rest];

  return (
    <div className="w-full">
      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Geographies"
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary"
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary/50" />
      </div>
      <div className="bg-gray-50 border border-primary/20 rounded-lg p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-gray-100 shadow-inner">
        <div className="space-y-2">
          {allCountries.map((country) => {
            let states = State.getStatesOfCountry(country.isoCode);
            
            if (country.name === "United States") {
              const contiguous = [
                "Alabama","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
              ];
              states = states.filter(state => contiguous.includes(state.name) || ["Hawaii","Alaska"].includes(state.name));
            }
            
            return (
              <div key={country.isoCode} className="border-b border-gray-100 pb-1">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="geography"
                    id={`geo-${country.isoCode}`}
                    value={country.name}
                    checked={selected === country.name}
                    onChange={() => onChange(country.name)}
                    className="mr-2 h-4 w-4 text-primary focus:ring-primary form-radio border-gray-300 transition-colors duration-200"
                  />
                  <div
                    className="flex items-center cursor-pointer flex-1"
                    onClick={() =>
                      setExpandedCountries(prev => ({
                        ...prev,
                        [country.isoCode]: !prev[country.isoCode],
                      }))
                    }
                  >
                    {expandedCountries[country.isoCode] ? (
                      <FaChevronDown className="h-4 w-4 mr-1 text-secondary/60" />
                    ) : (
                      <FaChevronRight className="h-4 w-4 mr-1 text-secondary/60" />
                    )}
                    <label htmlFor={`geo-${country.isoCode}`} className="text-secondary cursor-pointer font-medium">
                      {country.name}
                    </label>
                  </div>
                </div>
                {expandedCountries[country.isoCode] && (
                  <div className="ml-6 mt-1 space-y-1">
                    {states
                      .filter(state =>
                        query.trim() === '' ||
                        country.name.toLowerCase().includes(query.toLowerCase()) ||
                        state.name.toLowerCase().includes(query.toLowerCase())
                      )
                      .map((state) => (
                        <div key={state.isoCode} className="pl-2">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="geography"
                              id={`geo-${country.isoCode}-${state.isoCode}`}
                              value={`${country.name} > ${state.name}`}
                              checked={selected === `${country.name} > ${state.name}`}
                              onChange={() => onChange(`${country.name} > ${state.name}`)}
                              className="mr-2 h-4 w-4 text-primary focus:ring-primary form-radio border-gray-300 transition-colors duration-200"
                            />
                            <label
                              htmlFor={`geo-${country.isoCode}-${state.isoCode}`}
                              className="text-secondary cursor-pointer text-sm"
                            >
                              {state.name}
                            </label>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SellerForm = () => {
  const navigate = useNavigate();

  const initialValues = {
    contactName: "",
    contactTitle: "",
    contactEmail: "",
    companyName: "",
    phone: "",
    website: "",
    industry: "",
    geography: "",
    annualRevenue: "",
    currency: "USD",
    description: "",
  };

  const onSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const token = localStorage.getItem("access_token");
      
      const payload = {
        contactName: values.contactName,
        contactTitle: values.contactTitle,
        contactEmail: values.contactEmail,
        companyName: values.companyName,
        phone: values.phone,
        website: values.website,
        industry: values.industry,
        geography: values.geography,
        annualRevenue: Number(values.annualRevenue.replace(/,/g, '')),
        currency: values.currency,
        description: values.description,
      };
      
      await axios.post("https://advisor-seller-backend.vercel.app/api/sellers/profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Seller profile created successfully!");
      resetForm();
      
      setTimeout(() => {
        localStorage.removeItem('user');
        sessionStorage.clear();
        window.location.replace('/seller-dashboard');
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
      <Toaster position="top-right" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto p-8 bg-white shadow-2xl rounded-3xl border border-primary/10"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-secondary mb-2">Profile</h1>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-third mx-auto mt-4 rounded-full"></div>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={SellerSchema}
          onSubmit={onSubmit}
        >
          {({ isSubmitting, setFieldValue, values }) => (
            <Form className="space-y-8">
              {/* Company Information */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-50 p-6 rounded-2xl border border-primary/10 shadow-sm"
              >
                <div className="flex items-center mb-6 pb-3 border-b border-primary/20">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-third rounded-xl shadow-lg mr-4">
                    <HiOfficeBuilding className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-secondary">Company Information</h3>
                    <p className="text-sm text-gray-600">Tell us about your business</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SimpleInput
                    name="contactName"
                    label="Primary Contact Name"
                    placeholder="Who should advisors speak with?"
                    icon={<FaUser className="text-xs" />}
                  />
                  <SimpleInput
                    name="contactTitle"
                    label="Contact Title"
                    placeholder="e.g., CEO, Founder"
                    icon={<FaUserTie className="text-xs" />}
                  />
                  <SimpleInput
                    name="contactEmail"
                    label="Contact Email"
                    placeholder="name@company.com"
                    icon={<FaEnvelope className="text-xs" />}
                  />
                  <SimpleInput
                    name="phone"
                    label="Phone Number"
                    placeholder="Enter your phone number"
                    icon={<FaPhone className="text-xs" />}
                  />
                  <div className="md:col-span-2">
                    <SimpleInput
                      name="companyName"
                      label="Company Name"
                      placeholder="Enter your company name"
                      icon={<FaBuilding className="text-xs" />}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <SimpleInput
                      name="website"
                      label="Website URL"
                      placeholder="Enter your website URL"
                      icon={<FaGlobe className="text-xs" />}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Industries & Geographies */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-50 p-6 rounded-2xl border border-primary/10 shadow-sm"
              >
                <div className="flex items-center mb-6 pb-3 border-b border-primary/20">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-third rounded-xl shadow-lg mr-4">
                    <FaIndustry className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-secondary">Business Areas</h3>
                    <p className="text-sm text-gray-600">Select your industry and location</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-3 flex items-center">
                      <FaIndustry className="mr-2 text-primary text-xs" />
                      Industry 
                    </label>
                    <IndustryRadioChooser
                      selected={values.industry}
                      onChange={(val) => setFieldValue("industry", val)}
                    />
                    <ErrorMessage name="industry" component="div" className="text-red-500 text-sm mt-2" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-3 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-primary text-xs" />
                      Geography
                    </label>
                    <GeographyRadioChooser
                      selected={values.geography}
                      onChange={(val) => setFieldValue("geography", val)}
                    />
                    <ErrorMessage name="geography" component="div" className="text-red-500 text-sm mt-2" />
                  </div>
                </div>
              </motion.div>

              {/* Revenue Information */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-50 p-6 rounded-2xl border border-primary/10 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-primary/20">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-third rounded-xl shadow-lg mr-4">
                      <HiCurrencyDollar className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary">Revenue Information</h3>
                      <p className="text-sm text-gray-600">Financial details about your company</p>
                    </div>
                  </div>
                  <div className="w-40">
                    <Field name="currency">
                      {({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-secondary"
                        >
                          <option value="USD">US Dollar (USD)</option>
                          <option value="EUR">Euro (EUR)</option>
                          <option value="JPY">Japanese Yen (JPY)</option>
                          <option value="GBP">British Pound Sterling (GBP)</option>
                          <option value="CNY">Chinese Yuan/Renminbi (CNY)</option>
                          <option value="AUD">Australian Dollar (AUD)</option>
                          <option value="CAD">Canadian Dollar (CAD)</option>
                          <option value="CHF">Swiss Franc (CHF)</option>
                          <option value="HKD">Hong Kong Dollar (HKD)</option>
                          <option value="SGD">Singapore Dollar (SGD)</option>
                          <option value="SEK">Swedish Krona (SEK)</option>
                          <option value="NOK">Norwegian Krone (NOK)</option>
                          <option value="NZD">New Zealand Dollar (NZD)</option>
                          <option value="MXN">Mexican Peso (MXN)</option>
                          <option value="ZAR">South African Rand (ZAR)</option>
                          <option value="TRY">Turkish Lira (TRY)</option>
                          <option value="BRL">Brazilian Real (BRL)</option>
                          <option value="KRW">South Korean Won (KRW)</option>
                          <option value="INR">Indian Rupee (INR)</option>
                          <option value="RUB">Russian Ruble (RUB)</option>
                        </select>
                      )}
                    </Field>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2 flex items-center">
                    <FaChartLine className="mr-2 text-primary text-xs" />
                    Annual Revenue
                  </label>
                  <Field name="annualRevenue">
                    {({ field, form }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Enter annual revenue"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary"
                        onChange={(e) => {
                          // Only allow numbers and commas, no currency symbol
                          const value = e.target.value.replace(/[^\d,]/g, '');
                          if (value === '' || /^\d{1,3}(,\d{3})*$/.test(value) || /^\d+$/.test(value)) {
                            form.setFieldValue(field.name, value);
                          }
                        }}
                        value={field.value}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="annualRevenue" component="div" className="text-red-500 text-sm mt-1" />
                </div>
              </motion.div>

              {/* Description */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-50 p-6 rounded-2xl border border-primary/10 shadow-sm"
              >
                <div className="flex items-center mb-6 pb-3 border-b border-primary/20">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary to-third rounded-xl shadow-lg mr-4">
                    <HiDocumentText className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-secondary">Company Description</h3>
                    <p className="text-sm text-gray-600">Describe what makes your business unique</p>
                  </div>
                </div>
                
                <Field
                  as="textarea"
                  name="description"
                  rows={4}
                  placeholder="Describe your company, products, and services..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary resize-none"
                />
                <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
              </motion.div>

              {/* Submit Button */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center pt-6"
              >
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-gradient-to-r from-primary to-third text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? "Showing your Advisor Matches..." : "Show my Advisor Matches"}
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
