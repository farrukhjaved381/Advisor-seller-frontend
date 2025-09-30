import React, { useState, useEffect } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage, useFormikContext } from "formik";
import * as Yup from "yup";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FaChevronDown, FaChevronRight, FaSearch, FaBuilding, FaPhone, FaGlobe, FaCalendarAlt, FaChartLine, FaDollarSign, FaFileAlt, FaCertificate, FaUpload, FaCheckCircle, FaImage, FaQuoteLeft, FaUser, FaPlus, FaTrash, FaVideo, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";

// ✅ Use named imports for static data
import { getIndustryData } from "../../../components/Static/newIndustryData";
import { Country, State } from "country-state-city";

// =================== Industry Chooser ===================
const IndustryChooser = ({ selected, onChange, hasError }) => {
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

  // Handler for sector checkbox
  const handleSectorToggle = (sector) => {
    const sectorName = sector.name;
    const allGroupNames = sector.industryGroups.map(group => group.name);
    const isSelected = selected.includes(sectorName);
    
    let newSelected;
    if (isSelected) {
      newSelected = selected.filter(
        item => item !== sectorName && !allGroupNames.includes(item)
      );
    } else {
      newSelected = [
        ...selected.filter(
          item => item !== sectorName && !allGroupNames.includes(item)
        ),
        sectorName,
        ...allGroupNames,
      ];
    }
    onChange([...new Set(newSelected)]);
  };

  // Handler for industry group checkbox
  const handleGroupToggle = (group) => {
    const groupName = group.name;
    const isSelected = selected.includes(groupName);
    
    let newSelected;
    if (isSelected) {
      newSelected = selected.filter(item => item !== groupName);
    } else {
      newSelected = [...selected, groupName];
    }
    onChange([...new Set(newSelected)]);
  };

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
      <div className={`bg-brand-light border rounded-lg p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-gray-100 shadow-inner ${hasError ? 'border-red-500' : 'border-primary/20'}`}>
        {filteredSectors.length > 0 ? (
          <div className="space-y-2">
            {filteredSectors.map((sector) => (
              <div key={sector.id} className="border-b border-gray-100 pb-1">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`sector-${sector.id}`}
                    checked={selected.includes(sector.name)}
                    onChange={() => handleSectorToggle(sector)}
                    className="mr-2 h-4 w-4 text-primary focus:ring-primary form-checkbox border-gray-300 rounded transition-colors duration-200"
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
                            type="checkbox"
                            id={`group-${group.id}`}
                            checked={selected.includes(group.name)}
                            onChange={() => handleGroupToggle(group)}
                            className="mr-2 h-4 w-4 text-primary focus:ring-primary form-checkbox border-gray-300 rounded transition-colors duration-200"
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

// =================== Geography Chooser ===================
const GeographyChooser = ({ selected, onChange, hasError }) => {
  const [query, setQuery] = useState("");
  const [expandedCountries, setExpandedCountries] = useState({});

  // Get all countries and filter based on search
  let allCountries = Country.getAllCountries().filter((country) => {
    const countryMatch = country.name.toLowerCase().includes(query.toLowerCase());
    const states = State.getStatesOfCountry(country.isoCode);
    const stateMatch = states.some(state => state.name.toLowerCase().includes(query.toLowerCase()));
    return countryMatch || stateMatch;
  });

  // Priority countries (United States, Canada, Mexico)
  const priorityCountries = ["United States", "Canada", "Mexico"];
  const priority = allCountries.filter(c => priorityCountries.includes(c.name));
  const rest = allCountries.filter(c => !priorityCountries.includes(c.name));
  allCountries = [...priority, ...rest];

  // Handler for country checkbox
  const handleCountryToggle = (country) => {
    const countryName = country.name;
    const states = State.getStatesOfCountry(country.isoCode);
    const allStateNames = states.map(state => `${country.name} > ${state.name}`);
    const isSelected = selected.includes(countryName);
    
    let newSelected;
    if (isSelected) {
      newSelected = selected.filter(
        item => item !== countryName && !allStateNames.includes(item)
      );
    } else {
      newSelected = [
        ...selected.filter(
          item => item !== countryName && !allStateNames.includes(item)
        ),
        countryName,
        ...allStateNames,
      ];
    }
    onChange([...new Set(newSelected)]);
  };

  // Handler for state checkbox
  const handleStateToggle = (country, state) => {
    const stateName = `${country.name} > ${state.name}`;
    const isSelected = selected.includes(stateName);
    
    let newSelected;
    if (isSelected) {
      newSelected = selected.filter(item => item !== stateName);
    } else {
      newSelected = [...selected, stateName];
    }
    onChange([...new Set(newSelected)]);
  };

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
      <div className={`bg-brand-light border rounded-lg p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-gray-100 shadow-inner ${hasError ? 'border-red-500' : 'border-primary/20'}`}>
        <div className="space-y-2">
          {allCountries.map((country) => {
            let states = State.getStatesOfCountry(country.isoCode);
            
            // Filter US states to exclude territories
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
                    type="checkbox"
                    id={`geo-${country.isoCode}`}
                    checked={selected.includes(country.name)}
                    onChange={() => handleCountryToggle(country)}
                    className="mr-2 h-4 w-4 text-primary focus:ring-primary form-checkbox border-gray-300 rounded transition-colors duration-200"
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
                              type="checkbox"
                              id={`geo-${country.isoCode}-${state.isoCode}`}
                              checked={selected.includes(`${country.name} > ${state.name}`)}
                              onChange={() => handleStateToggle(country, state)}
                              className="mr-2 h-4 w-4 text-primary focus:ring-primary form-checkbox border-gray-300 rounded transition-colors duration-200"
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

// =================== Advisor Form ===================
export const AdvisorForm = () => {
  const [logoFile, setLogoFile] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [introVideoFile, setIntroVideoFile] = useState(null);
  const [introVideoPreview, setIntroVideoPreview] = useState('');

  useEffect(() => {
    return () => {
      if (introVideoPreview) {
        URL.revokeObjectURL(introVideoPreview);
      }
    };
  }, [introVideoPreview]);

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
  // licensing: "",
    testimonials: [
      { clientName: "", testimonial: "" },
      { clientName: "", testimonial: "" },
      { clientName: "", testimonial: "" },
      { clientName: "", testimonial: "" },
      { clientName: "", testimonial: "" }
    ],
    revenueRange: { min: "", max: "" },
    visibleTestimonials: 1,   // 👈 added here
    workedWithCimamplify: false,
  };

  const validationSchema = Yup.object().shape({
    companyName: Yup.string().required("Required"),
    phone: Yup.string().required("Required"),
    website: Yup.string()
      .required("Required")
      .test('url', 'Invalid URL format', function(value) {
        if (!value) return false;
        // Allow various URL formats
        const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?(\/.*)?(\?.*)?(#.*)?$/;
        return urlPattern.test(value);
      }),
    industries: Yup.array().min(1, "Pick at least one industry"),
    geographies: Yup.array().min(1, "Pick at least one geography"),
  yearsExperience: Yup.number().min(5, "Must be at least 5 years").required("Required"),
  numberOfTransactions: Yup.number().min(20, "Must be at least 20").required("Required"),
    currency: Yup.string().required("Required"),
    description: Yup.string().required("Required"),
  // licensing: Yup.string().required("Required"),
    testimonials: Yup.array()
      .of(
        Yup.object().shape({
          clientName: Yup.string().required('Client name is required'),
          testimonial: Yup.string().required('Testimonial is required'),

        })
      )
      .length(5, 'Exactly 5 testimonials are required'),

    revenueRange: Yup.object().shape({
      min: Yup.number().required("Required"),
      max: Yup.number().required("Required"),
    }),
  });

  // Show all validation errors after submit and scroll to first
  const ValidationEffects = () => {
    const { submitCount, errors, setTouched, isSubmitting } = useFormikContext();
    useEffect(() => {
      if (submitCount > 0 && errors && Object.keys(errors).length) {
        const all = {};
        const walk = (o, p = '') => {
          Object.keys(o).forEach(k => {
            const path = p ? `${p}.${k}` : k;
            if (o[k] && typeof o[k] === 'object') walk(o[k], path); else all[path] = true;
          });
        };
        walk(errors);
        setTouched(all, true);
        const first = Object.keys(all)[0];
        if (first && !isSubmitting) {
          const el = document.querySelector(`[name="${first}"],[data-field="${first}"]`);
          if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, [submitCount]);
    return null;
  };

  const ErrorBanner = () => {
    const { submitCount, errors } = useFormikContext();
    const count = (o) => { let c = 0; const walk = x => Object.values(x||{}).forEach(v=>{ if (v && typeof v==='object') walk(v); else c++; }); walk(o); return c; };
    const ec = count(errors);
    if (submitCount > 0 && ec > 0) {
      return (
        <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700">
          Please fix {ec} highlighted field{ec>1?'s':''}.
        </div>
      );
    }
    return null;
  };
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
    console.log('Form submitted:', values);
    try {
      if (!logoFile) {
        toast.error("Company logo is required");
        setLogoError(true);
        setSubmitting(false);
        return;
      }
      setLogoError(false);

      let logoUrl = "";
      if (logoFile) {
        logoUrl = await handleFileUpload(
          logoFile,
          "https://advisor-seller-backend.vercel.app/api/upload/logo"
        );
      }

      let introVideoUrl = "";
      if (introVideoFile) {
        introVideoUrl = await handleFileUpload(
          introVideoFile,
          "https://advisor-seller-backend.vercel.app/api/upload/video"
        );
      }

      // Upload testimonial PDFs
      const testimonials = await Promise.all(
        values.testimonials.map(async (t) => {
          if (t.clientName && t.testimonial) {
            let pdfUrl = undefined;
            if (t.pdfFile) {
              pdfUrl = await handleFileUpload(
                t.pdfFile,
                "https://advisor-seller-backend.vercel.app/api/upload/testimonial"
              );
            }
            return {
              clientName: t.clientName,
              testimonial: t.testimonial,
              ...(pdfUrl ? { pdfUrl } : {}),
            };
          }
          return null;
        })
      );

      // Ensure exactly 5 testimonials, all complete
      if (
        testimonials.length !== 5 ||
        testimonials.some((t) => !t.clientName || !t.testimonial)
      ) {
        toast.error(
          "Exactly 5 testimonials with client name and text are required"
        );
        setSubmitting(false);
        return;
      }

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
        // licensing: "yes",
        revenueRange: {
          min: Number(values.revenueRange.min),
          max: Number(values.revenueRange.max),
        },
        logoUrl,
        testimonials,
        introVideoUrl,
        workedWithCimamplify: values.workedWithCimamplify,
      };

      console.log("Sending payload:", payload);

      await axios.post(
        "https://advisor-seller-backend.vercel.app/api/advisors/profile",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Advisor profile created successfully!");
      resetForm();
      setLogoFile(null);
      setIntroVideoFile(null);
      setIntroVideoPreview("");

      // Wait for backend to update then redirect
      setTimeout(() => {
        localStorage.removeItem("user");
        sessionStorage.clear();
        window.location.replace("/advisor-dashboard");
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
        
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-third mx-auto mt-4 rounded-full"></div>
        </div>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ isSubmitting, setFieldValue, values, errors, touched }) => (
          <Form className="space-y-8">
            <ValidationEffects />
            <ErrorBanner />
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
                  <Field name="companyName" className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary ${errors.companyName && touched.companyName ? 'border-red-500' : 'border-gray-300'}`} />
                  <ErrorMessage name="companyName" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2 flex items-center">
                    <FaPhone className="mr-2 text-primary" />
                    Phone
                  </label>
                  <Field name="phone" className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary ${errors.phone && touched.phone ? 'border-red-500' : 'border-gray-300'}`} />
                  <ErrorMessage name="phone" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary mb-2 flex items-center">
                    <FaGlobe className="mr-2 text-primary" />
                    Website
                  </label>
                  <Field name="website" className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary ${errors.website && touched.website ? 'border-red-500' : 'border-gray-300'}`} />
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
                    selected={values.industries}
                    onChange={(val) => setFieldValue("industries", val)}
                    hasError={!!(errors.industries && touched.industries)}
                  />
                  <ErrorMessage name="industries" component="div" className="text-red-500 text-sm mt-2" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-3">
                    Geographies
                  </label>
                  <GeographyChooser
                    selected={values.geographies}
                    onChange={(val) => setFieldValue("geographies", val)}
                    hasError={!!(errors.geographies && touched.geographies)}
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
              
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaExclamationTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Important Requirement</h3>
                    <div className="mt-2 text-sm">
                      <p>To ensure the quality of our network, we require all advisors to have a minimum of 5 years of experience and to have completed at least 20 transactions.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2 flex items-center">
                    <FaCalendarAlt className="mr-2 text-primary" />
                    Years of Experience
                    <span className="ml-2 text-xs text-primary font-semibold">(Minimum 5)</span>
                  </label>
                  <Field
                    name="yearsExperience"
                    type="number"
                    min={5}
                    className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary ${errors.yearsExperience && touched.yearsExperience ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  <ErrorMessage name="yearsExperience" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2 flex items-center">
                    Number of Transactions
                    <span className="ml-2 text-xs text-primary font-semibold">(Minimum 20)</span>
                  </label>
                  <Field
                    name="numberOfTransactions"
                    type="number"
                    min={20}
                    className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary ${errors.numberOfTransactions && touched.numberOfTransactions ? 'border-red-500' : 'border-gray-300'}`}
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
                Client Revenue Size Range
                </h3>
                <div className="w-20">
                  <Field name="currency">
                    {({ field, form }) => (
                      <select
                        {...field}
                        className={`w-full px-2 py-2 border rounded-lg text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-secondary ${form.errors.currency && form.touched.currency ? 'border-red-500' : 'border-gray-300'}`}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="JPY">JPY</option>
                        <option value="CAD">CAD</option>
                        <option value="AUD">AUD</option>
                        <option value="CHF">CHF</option>
                        <option value="CNY">CNY</option>
                        <option value="HKD">HKD</option>
                        <option value="SGD">SGD</option>
                        <option value="INR">INR</option>
                        <option value="BRL">BRL</option>
                        <option value="KRW">KRW</option>
                        <option value="MXN">MXN</option>
                        <option value="SEK">SEK</option>
                        <option value="NOK">NOK</option>
                        <option value="NZD">NZD</option>
                        <option value="ZAR">ZAR</option>
                        <option value="TRY">TRY</option>
                        <option value="RUB">RUB</option>
                      </select>
                    )}
                  </Field>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Minimum Revenue</label>
                  <Field name="revenueRange.min">
                    {({ field, form }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Enter minimum amount"
                        className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary ${form.touched.revenueRange?.min && form.errors.revenueRange?.min ? 'border-red-500' : 'border-gray-300'}`}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          if (value === '' || /^\d+$/.test(value)) {
                            form.setFieldValue(field.name, value);
                          }
                        }}
                        value={field.value ? Number(field.value).toLocaleString() : ''}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="revenueRange.min" component="div" className="text-red-500 text-sm mt-1" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Maximum Revenue</label>
                  <Field name="revenueRange.max">
                    {({ field, form }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Enter maximum amount"
                        className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary ${form.touched.revenueRange?.max && form.errors.revenueRange?.max ? 'border-red-500' : 'border-gray-300'}`}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          if (value === '' || /^\d+$/.test(value)) {
                            form.setFieldValue(field.name, value);
                          }
                        }}
                        value={field.value ? Number(field.value).toLocaleString() : ''}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="revenueRange.max" component="div" className="text-red-500 text-sm mt-1" />
                </div>
              </div>
            </motion.div>

            {/* Description*/}
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
                    className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary resize-none ${errors.description && touched.description ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
                </div>
              </div>
            </motion.div>

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
                          setLogoError(false);
                        }
                      }}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-primary/5 transition-all duration-200 ${logoError ? 'border-red-500' : 'border-primary/30'}`}
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
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-center">
                        <img
                          src={URL.createObjectURL(logoFile)}
                          alt="Logo Preview"
                          className="max-w-32 max-h-32 object-contain rounded-lg border border-gray-200 shadow-sm"
                        />
                      </div>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <FaCheckCircle className="text-green-500 mr-2" />
                          <span className="text-sm text-green-700 font-medium">
                            {logoFile.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Introduction Video Upload */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-brand-light p-6 rounded-2xl border border-primary/10 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-secondary mb-6 flex items-center">
                <FaVideo className="mr-3 text-primary" />
                Advisor Introduction Video <span className="ml-2 text-sm text-secondary/70 font-normal">(optional)</span>
              </h3>

              <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FaInfoCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-bold">Video Instructions</h3>
                    <div className="mt-2 text-sm">
                      <p>When we present you to a seller this video will be attached. We suggest a quick introduction of your company followed by a story about your favorite company sale.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="w-full max-w-xl">
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      id="intro-video-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith('video/')) {
                          toast.error('Please select a valid video file (MP4, MOV, WEBM).');
                          return;
                        }
                        if (file.size > 200 * 1024 * 1024) {
                          toast.error('Video must be 200MB or smaller.');
                          return;
                        }
                        if (introVideoPreview) {
                          URL.revokeObjectURL(introVideoPreview);
                        }
                        setIntroVideoFile(file);
                        setIntroVideoPreview(URL.createObjectURL(file));
                      }}
                    />
                    <label
                      htmlFor="intro-video-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer bg-white hover:bg-primary/5 transition-all duration-200"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaUpload className="w-8 h-8 mb-4 text-primary" />
                        <p className="mb-2 text-sm text-secondary text-center">
                          <span className="font-semibold">Click to upload</span> a short intro video (MP4, MOV, or WEBM)
                        </p>
                        <p className="text-xs text-secondary/60">Recommended under 90 seconds</p>
                      </div>
                    </label>
                  </div>

                  {introVideoFile && (
                    <div className="mt-4 space-y-3">
                      {introVideoPreview && (
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                          <video
                            src={introVideoPreview}
                            controls
                            className="w-full h-full object-contain bg-black"
                          />
                        </div>
                      )}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                          <FaCheckCircle className="text-blue-500 mr-2" />
                          <span className="text-sm text-blue-800 font-medium">
                            {introVideoFile.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (introVideoPreview) {
                              URL.revokeObjectURL(introVideoPreview);
                            }
                            setIntroVideoFile(null);
                            setIntroVideoPreview('');
                          }}
                          className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Cimamplify Ventures Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-blue-50 p-6 rounded-2xl border border-blue-200 shadow-sm"
            >
              <div className="flex items-start">
                <Field
                  type="checkbox"
                  name="workedWithCimamplify"
                  id="workedWithCimamplify"
                  className="h-4 w-4 mt-1 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <div className="ml-3 text-sm">
                  <label htmlFor="workedWithCimamplify" className="font-bold text-blue-800">
                    Did you previously work with Cimamplify Ventures?
                  </label>
                  <p className="text-blue-700">Check this box if you have been engaged in any capacity with Cimamplify Ventures in the past.</p>
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
                    (t) => t.clientName && t.testimonial
                  ).length;

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-secondary flex items-center">
                          <FaQuoteLeft className="mr-3 text-primary" />
                          Client Testimonials
                        </h3>
                        <div className="bg-primary/10 px-3 py-1 rounded-full">
                          <span className="text-primary font-medium text-sm">
                            {completedTestimonials}/5 completed
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {values.testimonials.map((testimonial, index) => {
                          const isCompleted = testimonial.clientName && testimonial.testimonial;
                          
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

                                </div>
                              </div>

                              <div className="space-y-3">
                                <Field
                                  name={`testimonials[${index}].clientName`}
                                  placeholder="Client Name"
                                  className={`w-full px-3 py-2 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-sm bg-white ${errors.testimonials?.[index]?.clientName && touched.testimonials?.[index]?.clientName ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                <Field
                                  as="textarea"
                                  name={`testimonials[${index}].testimonial`}
                                  placeholder="Write the testimonial here..."
                                  rows="3"
                                  className={`w-full px-3 py-2 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-sm bg-white resize-none ${errors.testimonials?.[index]?.testimonial && touched.testimonials?.[index]?.testimonial ? 'border-red-500' : 'border-gray-300'}`}
                                />

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
              className="flex justify-end pt-6"
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-gradient-to-r from-primary to-third text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? "Creating Profile..." : "Complete Profile Setup"}
              </button>
            </motion.div>


          </Form>
        )}
      </Formik>
      </motion.div>
    </div>
  );
};
