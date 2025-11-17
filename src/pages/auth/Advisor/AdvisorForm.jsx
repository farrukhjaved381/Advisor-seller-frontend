import React, { useState, useEffect, useRef } from "react";
import {motion} from "framer-motion";
import {
  Formik,
  Form,
  Field,
  FieldArray,
  ErrorMessage,
  useFormikContext,
} from "formik";
import * as Yup from "yup";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaChevronDown,
  FaChevronRight,
  FaSearch,
  FaBuilding,
  FaPhone,
  FaGlobe,
  FaCalendarAlt,
  FaChartLine,
  FaDollarSign,
  FaFileAlt,
  FaCertificate,
  FaUpload,
  FaCheckCircle,
  FaImage,
  FaQuoteLeft,
  FaUser,
  FaPlus,
  FaTrash,
  FaVideo,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";

// ✅ Use named imports for static data
import { getIndustryData } from "../../../components/Static/newIndustryData";
import { Country, State } from "country-state-city";

// =================== Industry Chooser ===================
const IndustryChooser = ({ selected, onChange, hasError }) => {
  const [query, setQuery] = useState("");
  const [expandedSectors, setExpandedSectors] = useState({});
  const scrollContainerRef = useRef(null);
  const industryData = getIndustryData();

  // Preserve scroll position when selected items change
  const preserveScrollPosition = React.useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollTop = scrollContainerRef.current.scrollTop;
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollTop;
        }
      });
    }
  }, []);

  const filterSectors = (sectors, currentQuery) => {
    if (!currentQuery) return sectors;
    const lowerCaseQuery = currentQuery.toLowerCase();
    return sectors.filter((sector) => {
      const sectorMatches = sector.name.toLowerCase().includes(lowerCaseQuery);
      const groupMatches = sector.industryGroups.some((group) =>
        group.name.toLowerCase().includes(lowerCaseQuery)
      );
      return sectorMatches || groupMatches;
    });
  };

  const filteredSectors = filterSectors(industryData.sectors, query);

  // Handler for industry group checkbox
  const handleGroupToggle = (group) => {
    preserveScrollPosition();
    const groupName = group.name;
    const isSelected = selected.includes(groupName);

    let newSelected;
    if (isSelected) {
      newSelected = selected.filter((item) => item !== groupName);
    } else {
      newSelected = [...selected, groupName];
    }
    onChange([...new Set(newSelected)]);
  };

  // Handler for selecting/deselecting all groups in a sector
  const handleSectorToggle = (sector, checkAll) => {
    preserveScrollPosition();
    const groupNames = sector.industryGroups.map((g) => g.name);
    let newSelected = [...selected];
    if (checkAll) {
      newSelected = [...newSelected, ...groupNames];
    } else {
      newSelected = newSelected.filter((s) => !groupNames.includes(s));
    }
    onChange([...new Set(newSelected)]);
  };

  // remove single selected item (chip)
  const handleRemoveSelected = (name) => {
    onChange(selected.filter((s) => s !== name));
  };

  // small component to support indeterminate parent checkbox
  const SectorItem = ({ sector }) => {
    const ref = useRef(null);
    const allSelected = sector.industryGroups.every((g) =>
      selected.includes(g.name)
    );
    const someSelected =
      sector.industryGroups.some((g) => selected.includes(g.name)) &&
      !allSelected;

    useEffect(() => {
      if (ref.current) {
        ref.current.indeterminate = someSelected;
      }
    }, [someSelected]);

    return (
      <div key={sector.id} className="pb-1 border-b border-gray-100">
        <div className="flex items-center">
          <div
            className="flex items-center flex-1 cursor-pointer"
            onClick={() =>
              setExpandedSectors((prev) => ({
                ...prev,
                [sector.id]: !prev[sector.id],
              }))
            }
          >
            {expandedSectors[sector.id] ? (
              <FaChevronDown className="w-4 h-4 mr-1 text-secondary/60" />
            ) : (
              <FaChevronRight className="w-4 h-4 mr-1 text-secondary/60" />
            )}
            {/* Parent checkbox */}
            <input
              ref={ref}
              type="checkbox"
              checked={allSelected}
              onChange={(e) => {
                // prevent toggling expansion when clicking checkbox
                e.stopPropagation();
                handleSectorToggle(sector, e.target.checked);
              }}
              className="w-4 h-4 mr-2 transition-colors duration-200 border-gray-300 rounded text-primary focus:ring-primary form-checkbox"
              id={`sector-${sector.id}-selectall`}
              onClick={(e) => e.stopPropagation()}
            />
            <label
              htmlFor={`sector-${sector.id}`}
              className="font-medium cursor-pointer text-secondary"
            >
              {sector.name}
            </label>
          </div>
        </div>
        {expandedSectors[sector.id] && (
          <div className="mt-1 ml-6 space-y-1">
            {sector.industryGroups.map((group) => (
              <div key={group.id} className="pl-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`group-${group.id}`}
                    checked={selected.includes(group.name)}
                    onChange={() => handleGroupToggle(group)}
                    className="w-4 h-4 mr-2 transition-colors duration-200 border-gray-300 rounded text-primary focus:ring-primary form-checkbox"
                  />
                  <label
                    htmlFor={`group-${group.id}`}
                    className="text-sm cursor-pointer text-secondary"
                  >
                    {group.name}
                  </label>
                </div>
                {group.description && (
                  <div className="mt-1 ml-6 text-xs italic text-secondary/70">
                    {group.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Industry Sectors"
          className="w-full py-3 pl-10 pr-4 transition-all duration-200 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-brand text-secondary"
        />
        <FaSearch className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-secondary/50" />
      </div>

      {/* Selected chips row */}
      {/* {selected && selected.length > 0 && (
        <div className="mb-3">
          <div className="w-full p-2 overflow-auto bg-white border rounded-md max-h-28 border-primary/10">
            <div className="flex flex-wrap gap-2">
              {selected.map((name) => (
                <div
                  key={name}
                  className="flex items-center px-3 py-1 text-sm border rounded-full bg-primary/10 text-primary border-primary/20"
                >
                  <span className="mr-2">{name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSelected(name)}
                    className="ml-1 text-xs font-bold text-primary/80 hover:text-primary"
                    aria-label={`Remove ${name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )} */}

      <div
        ref={scrollContainerRef}
        className={`bg-brand-light border rounded-lg p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-gray-100 shadow-inner ${
          hasError ? "border-red-500" : "border-primary/20"
        }`}
      >
        {filteredSectors.length > 0 ? (
          <div className="space-y-2">
            {filteredSectors.map((sector) => (
              <SectorItem key={sector.id} sector={sector} />
            ))}
          </div>
        ) : (
          <p className="py-4 text-sm text-center text-secondary/60">
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
  const scrollContainerRef = useRef(null);

  // Memoize the sorted countries list to prevent re-sorting on every render
  const allCountries = React.useMemo(() => {
    // Get all countries and filter based on search
    let filteredCountries = Country.getAllCountries().filter((country) => {
      const countryMatch = country.name
        .toLowerCase()
        .includes(query.toLowerCase());
      const states = State.getStatesOfCountry(country.isoCode);
      const stateMatch = states.some((state) =>
        state.name.toLowerCase().includes(query.toLowerCase())
      );
      return countryMatch || stateMatch;
    });

    // Priority countries (United States, Canada, Mexico)
    const priorityCountries = ["United States", "Canada", "Mexico"];
    const priority = filteredCountries.filter((c) =>
      priorityCountries.includes(c.name)
    );
    const rest = filteredCountries.filter((c) => !priorityCountries.includes(c.name));
    return [...priority, ...rest];
  }, [query]);

  // Preserve scroll position when selected items change
  const preserveScrollPosition = React.useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollTop = scrollContainerRef.current.scrollTop;
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollTop;
        }
      });
    }
  }, []);

  // Handler for state checkbox
  const handleStateToggle = (country, state) => {
    preserveScrollPosition();
    const stateName = `${country.name} > ${state.name}`;
    const isSelected = selected.includes(stateName);

    let newSelected;
    if (isSelected) {
      newSelected = selected.filter((item) => item !== stateName);
    } else {
      newSelected = [...selected, stateName];
    }
    onChange([...new Set(newSelected)]);
  };

  // Handler for selecting/deselecting all states in a country
  const handleCountryToggle = (country, states, checkAll) => {
    preserveScrollPosition();
    const names = states.map((s) => `${country.name} > ${s.name}`);
    let newSelected = [...selected];
    if (checkAll) {
      newSelected = [...newSelected, ...names];
    } else {
      newSelected = newSelected.filter((s) => !names.includes(s));
    }
    onChange([...new Set(newSelected)]);
  };

  // Handler for toggling a country that has no states (store as "Country Name")
  const handleCountrySingleToggle = (country) => {
    preserveScrollPosition();
    const name = country.name;
    const isSelected = selected.includes(name);
    let newSelected;
    if (isSelected) {
      newSelected = selected.filter((s) => s !== name);
    } else {
      newSelected = [...selected, name];
    }
    onChange([...new Set(newSelected)]);
  };

  // remove single selected geography (chip)
  const handleRemoveSelectedGeo = (name) => {
    onChange(selected.filter((s) => s !== name));
  };
  
  // Small component to render a country with parent checkbox + indeterminate
  const CountryItem = ({ country }) => {
    let states = State.getStatesOfCountry(country.isoCode);

    // Filter US states to exclude territories
    if (country.name === "United States") {
      const contiguous = [
        "Alabama",
        "Arizona",
        "Arkansas",
        "California",
        "Colorado",
        "Connecticut",
        "Delaware",
        "Florida",
        "Georgia",
        "Idaho",
        "Illinois",
        "Indiana",
        "Iowa",
        "Kansas",
        "Kentucky",
        "Louisiana",
        "Maine",
        "Maryland",
        "Massachusetts",
        "Michigan",
        "Minnesota",
        "Mississippi",
        "Missouri",
        "Montana",
        "Nebraska",
        "Nevada",
        "New Hampshire",
        "New Jersey",
        "New Mexico",
        "New York",
        "North Carolina",
        "North Dakota",
        "Ohio",
        "Oklahoma",
        "Oregon",
        "Pennsylvania",
        "Rhode Island",
        "South Carolina",
        "South Dakota",
        "Tennessee",
        "Texas",
        "Utah",
        "Vermont",
        "Virginia",
        "Washington",
        "West Virginia",
        "Wisconsin",
        "Wyoming",
      ];
      states = states.filter(
        (state) =>
          contiguous.includes(state.name) ||
          ["Hawaii", "Alaska"].includes(state.name)
      );
    }

    const ref = useRef(null);

    // IMPORTANT: do not treat an empty states array as "all selected"
    const hasStates = states && states.length > 0;
    // if hasStates -> parent represents all children ("Country > State")
    const allSelected =
      hasStates &&
      states.every((s) => selected.includes(`${country.name} > ${s.name}`));
    const someSelected =
      hasStates &&
      states.some((s) => selected.includes(`${country.name} > ${s.name}`)) &&
      !allSelected;
    // if no states, parent checkbox represents selecting the country itself (stored as "Country Name")
    const countrySelected = !hasStates && selected.includes(country.name);

    useEffect(() => {
      if (ref.current) {
        ref.current.indeterminate = someSelected;
      }
    }, [someSelected]);

    return (
      <div key={country.isoCode} className="pb-1 border-b border-gray-100">
        <div className="flex items-center">
          <div
            className={`flex items-center flex-1 ${hasStates ? "cursor-pointer" : ""}`}
            onClick={() =>
              hasStates &&
              setExpandedCountries((prev) => ({
                ...prev,
                [country.isoCode]: !prev[country.isoCode],
              }))
            }
          >
            {hasStates ? (
              expandedCountries[country.isoCode] ? (
                <FaChevronDown className="w-4 h-4 mr-1 text-secondary/60" />
              ) : (
                <FaChevronRight className="w-4 h-4 mr-1 text-secondary/60" />
              )
            ) : (
              <div className="w-4 h-4 mr-1" /> /* keep spacing for alignment */
            )}

            <input
              ref={ref}
              type="checkbox"
              checked={hasStates ? allSelected : countrySelected}
              onChange={(e) => {
                e.stopPropagation();
                if (hasStates) {
                  handleCountryToggle(country, states, e.target.checked);
                } else {
                  // toggle single country selection
                  handleCountrySingleToggle(country);
                }
              }}
              className="w-4 h-4 mr-2 transition-colors duration-200 border-gray-300 rounded text-primary focus:ring-primary form-checkbox"
              id={`country-${country.isoCode}-selectall`}
              onClick={(e) => e.stopPropagation()}
            />

            <label
              htmlFor={`country-${country.isoCode}-selectall`}
              className="font-medium cursor-pointer text-secondary"
            >
              {country.name}
            </label>
          </div>
        </div>
        {hasStates && expandedCountries[country.isoCode] && (
          <div className="mt-1 ml-6 space-y-1">
            {states
              .filter(
                (state) =>
                  query.trim() === "" ||
                  country.name
                    .toLowerCase()
                    .includes(query.toLowerCase()) ||
                  state.name.toLowerCase().includes(query.toLowerCase())
              )
              .map((state) => (
                <div key={state.isoCode} className="pl-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`geo-${country.isoCode}-${state.isoCode}`}
                      checked={selected.includes(
                        `${country.name} > ${state.name}`
                      )}
                      onChange={() => handleStateToggle(country, state)}
                      className="w-4 h-4 mr-2 transition-colors duration-200 border-gray-300 rounded text-primary focus:ring-primary form-checkbox"
                    />
                    <label
                      htmlFor={`geo-${country.isoCode}-${state.isoCode}`}
                      className="text-sm cursor-pointer text-secondary"
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
  };

  return (
    <div className="w-full">
      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Geographies"
          className="w-full py-3 pl-10 pr-4 transition-all duration-200 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-brand text-secondary"
        />
        <FaSearch className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-secondary/50" />
      </div>

      {/* Selected chips row */}
      {/* {selected && selected.length > 0 && (
        <div className="mb-3">
          <div className="w-full p-2 overflow-auto bg-white border rounded-md max-h-28 border-primary/10">
            <div className="flex flex-wrap gap-2">
              {selected.map((name) => (
                <div
                  key={name}
                  className="flex items-center px-3 py-1 text-sm border rounded-full bg-primary/10 text-primary border-primary/20"
                >
                  <span className="mr-2">{name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSelectedGeo(name)}
                    className="ml-1 text-xs font-bold text-primary/80 hover:text-primary"
                    aria-label={`Remove ${name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )} */}

      <div
        ref={scrollContainerRef}
        className={`bg-brand-light border rounded-lg p-4 h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-gray-100 shadow-inner ${
          hasError ? "border-red-500" : "border-primary/20"
        }`}
      >
        <div className="space-y-2">
          {allCountries.map((country) => (
            <CountryItem key={country.isoCode} country={country} />
          ))}
        </div>
      </div>
    </div>
  );
};

// =================== Advisor Form ===================
export const AdvisorForm = () => {
  const [logoFile, setLogoFile] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [logoSizeError, setLogoSizeError] = useState(false);
  const [videoSizeError, setVideoSizeError] = useState(false);
  const [introVideoFile, setIntroVideoFile] = useState(null);
  const [introVideoPreview, setIntroVideoPreview] = useState("");

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
      { clientName: "", testimonial: "" },
    ],
    revenueRange: { min: "", max: "" },
    visibleTestimonials: 1, // 👈 added here
    workedWithCimamplify: false,
    logoFile: null, // <-- added to Formik
  };

  const validationSchema = Yup.object().shape({
    companyName: Yup.string().required("Required"),
    phone: Yup.string().required("Required"),
    website: Yup.string()
      .required("Required")
      .test("url", "Invalid URL format", function (value) {
        if (!value) return false;
        // Allow various URL formats
        const urlPattern =
          /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?(\/.*)?(\?.*)?(#.*)?$/;
        return urlPattern.test(value);
      }),
    industries: Yup.array().min(1, "Pick at least one industry"),
    geographies: Yup.array().min(1, "Pick at least one geography"),
    yearsExperience: Yup.number()
      .min(5, "Must be at least 5 years")
      .required("Required"),
    numberOfTransactions: Yup.number()
      .typeError("Must be a number")
      .integer("Must be an integer")
      .transform((value, originalValue) =>
        originalValue === "" ? undefined : Number(originalValue)
      )
      .min(10, "Must be at least 10")
      .required("Required"),
    currency: Yup.string().required("Required"),
    description: Yup.string().required("Required"),
    // licensing: Yup.string().required("Required"),
    testimonials: Yup.array()
      .of(
        Yup.object().shape({
          clientName: Yup.string().required("Client name is required"),
          testimonial: Yup.string().required("Testimonial is required"),
        })
      )
      .length(5, "Exactly 5 testimonials are required"),

    revenueRange: Yup.object().shape({
      min: Yup.number().typeError("Required").required("Required"),
      max: Yup.number().typeError("Required").required("Required"),
    }),

    logoFile: Yup.mixed().required("Company logo is required"), // <-- required logo
  });

  // Show all validation errors after submit and scroll to first
  const ValidationEffects = () => {
    const { submitCount, errors, setTouched, isSubmitting, setFieldTouched } =
      useFormikContext();
    useEffect(() => {
      if (submitCount > 0 && errors && Object.keys(errors).length) {
        // Walk errors and set touched on each field using setFieldTouched
        const collectPaths = (obj, parent = "") => {
          Object.keys(obj).forEach((k) => {
            const path = parent ? `${parent}.${k}` : k;
            if (obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])) {
              collectPaths(obj[k], path);
            } else if (obj[k] && typeof obj[k] === "object" && Array.isArray(obj[k])) {
              // arrays: iterate indexes
              obj[k].forEach((item, idx) => {
                if (item && typeof item === "object") {
                  collectPaths(item, `${path}.${idx}`);
                } else if (item) {
                  const bracket = `${path}[${idx}]`;
                  // mark array scalar
                  setFieldTouched(bracket, true, true);
                }
              });
            } else {
              // leaf error - convert dotted indices to bracket notation for Formik field names
              const bracket = path.replace(/\.(\d+)/g, "[$1]");
              setFieldTouched(bracket, true, true);
            }
          });
        };

        collectPaths(errors);

        // find first field using both notations (dotted and bracket) and scroll to it
        // create a selector from first error path
        const firstErrorPath = Object.keys(errors)[0];
        if (firstErrorPath && !isSubmitting) {
          // generate candidate selectors
          const dottedToBracket = (p) => p.replace(/\.(\d+)/g, "[$1]");
          const maybeBracket = dottedToBracket(firstErrorPath);
          const maybeDotted = firstErrorPath;
          const selector = `[name="${maybeBracket}"],[name="${maybeDotted}"],[data-field="${maybeBracket}"],[data-field="${maybeDotted}"]`;
          const el = document.querySelector(selector);
          if (el && el.scrollIntoView) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }
    }, [submitCount]);
    return null;
  };

  const ErrorBanner = () => {
    const { submitCount, errors } = useFormikContext();
    const count = (o) => {
      let c = 0;
      const walk = (x) =>
        Object.values(x || {}).forEach((v) => {
          if (v && typeof v === "object") walk(v);
          else c++;
        });
      walk(o);
      return c;
    };
    const ec = count(errors);
    if (submitCount > 0 && ec > 0) {
      return (
        <div className="p-3 mb-4 text-red-700 border border-red-200 rounded bg-red-50">
          Please fix {ec} highlighted field{ec > 1 ? "s" : ""}.
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
    console.log("Form submitted:", values);
    try {
      if (!values.logoFile) {
        toast.error("Company logo is required");
        setLogoError(true);
        setSubmitting(false);
        return;
      }
      setLogoError(false);

      let logoUrl = "";
      if (values.logoFile) {
        logoUrl = await handleFileUpload(
          values.logoFile,
          "https://api.advisorchooser.com/api/upload/logo"
        );
      }

      let introVideoUrl = "";
      if (introVideoFile) {
        introVideoUrl = await handleFileUpload(
          introVideoFile,
          "https://api.advisorchooser.com/api/upload/video"
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
                "https://api.advisorchooser.com/api/upload/testimonial"
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
        industries: values.industries, // array of strings
        geographies: values.geographies, // array of strings
        yearsExperience: Number(values.yearsExperience),
        numberOfTransactions: Number(values.numberOfTransactions),
        currency: values.currency,
        description: values.description,
        // licensing: values.licensing,
        testimonials, // already validated as array of 5 objects
        revenueRange: {
          min: Number(values.revenueRange.min),
          max: Number(values.revenueRange.max),
        },
        logoUrl,
        introVideoUrl,
        workedWithCimamplify: values.workedWithCimamplify,
      };

      console.log("Sending payload:", payload);

      await axios.post(
        "https://api.advisorchooser.com/api/advisors/profile",
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
      console.error("Form submission error:", error.response?.data || error);
      toast.error("Error submitting form");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-brand to-brand-light">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl p-8 mx-auto border shadow-2xl bg-brand-light rounded-3xl border-primary/10"
      >
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-secondary">
            Advisor Profile
          </h1>

          <div className="w-24 h-1 mx-auto mt-4 rounded-full bg-gradient-to-r from-primary to-third"></div>
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
                className="p-6 border shadow-sm bg-brand-light rounded-2xl border-primary/10"
              >
                <h3 className="flex items-center mb-6 text-xl font-semibold text-secondary">
                  <FaBuilding className="mr-3 text-primary" />
                  Company Information
                </h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-secondary">
                      Company Name
                    </label>
                    <Field
                      name="companyName"
                      className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary ${
                        errors.companyName && touched.companyName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <ErrorMessage
                      name="companyName"
                      component="div"
                      className="mt-1 text-sm text-red-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center block mb-2 text-sm font-medium text-secondary">
                      <FaPhone className="mr-2 text-primary" />
                      Phone
                    </label>
                    <Field
                      name="phone"
                      className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary ${
                        errors.phone && touched.phone
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <ErrorMessage
                      name="phone"
                      component="div"
                      className="mt-1 text-sm text-red-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center block mb-2 text-sm font-medium text-secondary">
                      <FaGlobe className="mr-2 text-primary" />
                      Website
                    </label>
                    <Field
                      name="website"
                      className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary ${
                        errors.website && touched.website
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <ErrorMessage
                      name="website"
                      component="div"
                      className="mt-1 text-sm text-red-500"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Industries & Geographies */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 border shadow-sm bg-brand-light rounded-2xl border-primary/10"
              >
                <h3 className="mb-6 text-xl font-semibold text-secondary">
                  Expertise Areas
                </h3>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  <div>
                    <label className="block mb-3 text-sm font-medium text-secondary">
                      Industries
                    </label>
                    <IndustryChooser
                      selected={values.industries}
                      onChange={(val) => setFieldValue("industries", val)}
                      hasError={!!(errors.industries && touched.industries)}
                    />
                    <ErrorMessage
                      name="industries"
                      component="div"
                      className="mt-2 text-sm text-red-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-3 text-sm font-medium text-secondary">
                      Geographies
                    </label>
                    <GeographyChooser
                      selected={values.geographies}
                      onChange={(val) => setFieldValue("geographies", val)}
                      hasError={!!(errors.geographies && touched.geographies)}
                    />
                    <ErrorMessage
                      name="geographies"
                      component="div"
                      className="mt-2 text-sm text-red-500"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Experience & Performance */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 border shadow-sm bg-brand-light rounded-2xl border-primary/10"
              >
                <h3 className="flex items-center mb-6 text-xl font-semibold text-secondary">
                  <FaChartLine className="mr-3 text-primary" />
                  Experience & Performance
                </h3>

                

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="flex items-center block mb-2 text-sm font-medium text-secondary">
                      <FaCalendarAlt className="mr-2 text-primary" />
                      Years of Experience
                      <span className="ml-2 text-xs font-semibold text-primary">
                        (Minimum 5)
                      </span>
                    </label>
                    <Field
                      name="yearsExperience"
                      type="number"
                      min={5}
                      className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary ${
                        errors.yearsExperience && touched.yearsExperience
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <ErrorMessage
                      name="yearsExperience"
                      component="div"
                      className="mt-1 text-sm text-red-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center block mb-2 text-sm font-medium text-secondary">
                      Number of Transactions
                      <span className="ml-2 text-xs font-semibold text-primary">
                        (Minimum 10)
                      </span>
                    </label>
                    <Field
                      name="numberOfTransactions"
                      type="number"
                      min={10}          // changed from 20 -> 10
                      step={1}          // enforce integer stepping
                      className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary ${
                        errors.numberOfTransactions &&
                        touched.numberOfTransactions
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <ErrorMessage
                      name="numberOfTransactions"
                      component="div"
                      className="mt-1 text-sm text-red-500"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Revenue Range */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 border shadow-sm bg-brand-light rounded-2xl border-primary/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="flex items-center text-xl font-semibold text-secondary">
                    <FaDollarSign className="mr-3 text-primary" />
                    Client Revenue Size Range
                  </h3>
                  <div className="w-20">
                    <Field name="currency">
                      {({ field, form }) => (
                        <select
                          {...field}
                          className={`w-full px-2 py-2 border rounded-lg text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white text-secondary ${
                            form.errors.currency && form.touched.currency
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
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

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-secondary">
                      Minimum Revenue
                    </label>
                    <Field name="revenueRange.min">
                      {({ field, form }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="Enter minimum amount"
                          className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary ${
                            form.touched.revenueRange?.min &&
                            form.errors.revenueRange?.min
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          onChange={(e) => {
                            const value = e.target.value.replace(/,/g, "");
                            if (value === "" || /^\d+$/.test(value)) {
                              form.setFieldValue(field.name, value);
                            }
                          }}
                          value={
                            field.value
                              ? Number(field.value).toLocaleString()
                              : ""
                          }
                        />
                      )}
                    </Field>
                    <ErrorMessage
                      name="revenueRange.min"
                      component="div"
                      className="mt-1 text-sm text-red-500"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-secondary">
                      Maximum Revenue
                    </label>
                    <Field name="revenueRange.max">
                      {({ field, form }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="Enter maximum amount"
                          className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary ${
                            form.touched.revenueRange?.max &&
                            form.errors.revenueRange?.max
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          onChange={(e) => {
                            const value = e.target.value.replace(/,/g, "");
                            if (value === "" || /^\d+$/.test(value)) {
                              form.setFieldValue(field.name, value);
                            }
                          }}
                          value={
                            field.value
                              ? Number(field.value).toLocaleString()
                              : ""
                          }
                        />
                      )}
                    </Field>
                    <ErrorMessage
                      name="revenueRange.max"
                      component="div"
                      className="mt-1 text-sm text-red-500"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Description*/}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 border shadow-sm bg-brand-light rounded-2xl border-primary/10"
              >
                <h3 className="flex items-center mb-6 text-xl font-semibold text-secondary">
                  <FaFileAlt className="mr-3 text-primary" />
                  Additional Information
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-secondary">
                      Company Description
                    </label>
                    <Field
                      as="textarea"
                      name="description"
                      rows={4}
                      placeholder="Describe your company, services, and expertise..."
                      className={`w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-white text-secondary resize-none ${
                        errors.description && touched.description
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    <ErrorMessage
                      name="description"
                      component="div"
                      className="mt-1 text-sm text-red-500"
                    />
                  </div>
                </div>
              </motion.div>

             {/* Logo Upload */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 border shadow-sm bg-brand-light rounded-2xl border-primary/10"
              >
                <h3 className="flex items-center mb-6 text-xl font-semibold text-secondary">
                  <FaImage className="mr-3 text-primary" />
                  Company Logo
                </h3>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-full max-w-md">
                    {/* File size/format warning banner */}
                    {logoSizeError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 mb-4 border border-red-200 rounded-lg bg-red-50"
                      >
                        <div className="flex items-start">
                          <FaExclamationTriangle className="flex-shrink-0 w-5 h-5 mr-2 text-red-600" />
                          <div className="text-sm text-red-800">
                            <p className="font-semibold">Invalid File!</p>
                            <p className="text-xs">
                              Please ensure your file is PNG, JPG, or JPEG format and under 5MB.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="relative">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          
                          if (!file) {
                            return;
                          }

                          // Validate file type FIRST
                          const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
                          const fileExtension = file.name.split('.').pop().toLowerCase();
                          const allowedExtensions = ['png', 'jpg', 'jpeg'];
                          
                          const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
                          
                          if (!isValidType) {
                            e.target.value = "";
                            setLogoSizeError(true);
                            
                            toast.error(
                              <div className="space-y-1">
                                <div className="text-base font-bold">⚠️ Invalid File Format!</div>
                                <div className="text-sm">
                                  File type: <span className="font-semibold">{file.type || 'Unknown'}</span>
                                </div>
                                <div className="text-sm">
                                  Allowed formats: <span className="font-semibold">PNG, JPG, JPEG</span>
                                </div>
                                <div className="pt-2 mt-2 text-xs border-t border-red-300">
                                  Please select a valid image file.
                                </div>
                              </div>,
                              {
                                duration: 8000,
                                position: 'top-center',
                                style: {
                                  background: '#FEE2E2',
                                  color: '#991B1B',
                                  maxWidth: '500px',
                                  padding: '16px',
                                },
                                icon: '🚫',
                              }
                            );
                            return;
                          }

                          // Validate file size (5MB)
                          const maxSize = 5 * 1024 * 1024;
                          
                          if (file.size > maxSize) {
                            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                            e.target.value = "";
                            setLogoSizeError(true);
                            
                            toast.error(
                              <div className="space-y-1">
                                <div className="text-base font-bold">⚠️ File Too Large!</div>
                                <div className="text-sm">
                                  Your file size: <span className="font-semibold">{fileSizeMB}MB</span>
                                </div>
                                <div className="text-sm">
                                  Maximum allowed: <span className="font-semibold">5MB</span>
                                </div>
                                <div className="pt-2 mt-2 text-xs border-t border-red-300">
                                  Please compress or resize your image and try again.
                                </div>
                              </div>,
                              {
                                duration: 8000,
                                position: 'top-center',
                                style: {
                                  background: '#FEE2E2',
                                  color: '#991B1B',
                                  maxWidth: '500px',
                                  padding: '16px',
                                },
                                icon: '🚫',
                              }
                            );
                            
                            setLogoFile(null);
                            setFieldValue("logoFile", null);
                            setLogoError(true);
                            return;
                          }

                          // File is valid
                          setLogoSizeError(false);
                          setLogoFile(file);
                          setLogoError(false);
                          setFieldValue("logoFile", file);
                          
                          toast.success(
                            <div className="space-y-1">
                              <div className="font-bold">Logo Uploaded!</div>
                              <div className="text-sm">{file.name} ({(file.size / (1024 * 1024)).toFixed(2)}MB)</div>
                            </div>,
                            {
                              duration: 3000,
                              position: 'top-center',
                            }
                          );
                        }}
                        onClick={(e) => {
                          e.target.value = '';
                        }}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-primary/5 transition-all duration-200 ${
                          (errors.logoFile && touched.logoFile) || logoError
                            ? "border-red-500 bg-red-50"
                            : "border-primary/30"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FaUpload className="w-8 h-8 mb-4 text-primary" />
                          <p className="mb-2 text-sm text-secondary">
                            <span className="font-semibold">Click to upload</span> your company logo
                          </p>
                          <p className="text-xs font-semibold text-primary">
                            PNG, JPG or JPEG (MAX. 5MB)
                          </p>
                        </div>
                      </label>
                    </div>

                    {logoFile && (
                      <div className="mt-4 space-y-3">
                        <div className="flex justify-center">
                          <img
                            src={URL.createObjectURL(logoFile)}
                            alt="Logo Preview"
                            className="object-contain border border-gray-200 rounded-lg shadow-sm max-w-32 max-h-32"
                          />
                        </div>
                        <div className="p-3 border border-green-200 rounded-lg bg-green-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FaCheckCircle className="mr-2 text-green-500" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-green-700">
                                  {logoFile.name}
                                </span>
                                <span className="text-xs text-green-600">
                                  {(logoFile.size / (1024 * 1024)).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setLogoFile(null);
                                setFieldValue("logoFile", null);
                                setLogoError(false);
                                setLogoSizeError(false);
                                const input = document.getElementById("logo-upload");
                                if (input) input.value = "";
                                toast.success("Logo removed");
                              }}
                              className="text-xs font-semibold text-green-700 hover:text-green-900"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <ErrorMessage
                      name="logoFile"
                      component="div"
                      className="mt-2 text-sm font-semibold text-red-600"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Introduction Video Upload */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="p-6 border shadow-sm bg-brand-light rounded-2xl border-primary/10"
              >
                <h3 className="flex items-center mb-6 text-xl font-semibold text-secondary">
                  <FaVideo className="mr-3 text-primary" />
                  Advisor Introduction Video{" "}
                  <span className="ml-2 text-sm font-normal text-secondary/70">
                    (optional)
                  </span>
                </h3>

                <div className="p-4 mb-6 text-blue-800 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FaInfoCircle className="w-5 h-5 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-bold">Video Instructions</h3>
                      <div className="mt-2 text-sm">
                        <p>
                          When we present you to a seller this video will be attached. We suggest a quick 
                          introduction of your company followed by a story about your favorite company sale.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-full max-w-xl">
                    {/* Video size/format warning banner */}
                    {videoSizeError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 mb-4 border border-red-200 rounded-lg bg-red-50"
                      >
                        <div className="flex items-start">
                          <FaExclamationTriangle className="flex-shrink-0 w-5 h-5 mr-2 text-red-600" />
                          <div className="text-sm text-red-800">
                            <p className="font-semibold">Invalid Video File!</p>
                            <p className="text-xs">
                              Please ensure your file is MP4, MOV, or WEBM format and under 200MB.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="relative">
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm"
                        id="intro-video-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          
                          if (!file) {
                            return;
                          }

                          // Validate file type FIRST
                          const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
                          const fileExtension = file.name.split('.').pop().toLowerCase();
                          const allowedExtensions = ['mp4', 'mov', 'webm'];
                          
                          const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
                          
                          if (!isValidType) {
                            e.target.value = "";
                            setVideoSizeError(true);
                            
                            toast.error(
                              <div className="space-y-1">
                                <div className="text-base font-bold">⚠️ Invalid Video Format!</div>
                                <div className="text-sm">
                                  File type: <span className="font-semibold">{file.type || 'Unknown'}</span>
                                </div>
                                <div className="text-sm">
                                  Allowed formats: <span className="font-semibold">MP4, MOV, WEBM</span>
                                </div>
                                <div className="pt-2 mt-2 text-xs border-t border-red-300">
                                  Please select a valid video file.
                                </div>
                              </div>,
                              {
                                duration: 8000,
                                position: 'top-center',
                                style: {
                                  background: '#FEE2E2',
                                  color: '#991B1B',
                                  maxWidth: '500px',
                                  padding: '16px',
                                },
                                icon: '🚫',
                              }
                            );
                            return;
                          }

                          // Validate file size (200MB)
                          const maxSize = 200 * 1024 * 1024;
                          
                          if (file.size > maxSize) {
                            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                            e.target.value = "";
                            setVideoSizeError(true);
                            
                            toast.error(
                              <div className="space-y-1">
                                <div className="text-base font-bold">⚠️ Video File Too Large!</div>
                                <div className="text-sm">
                                  Your file size: <span className="font-semibold">{fileSizeMB}MB</span>
                                </div>
                                <div className="text-sm">
                                  Maximum allowed: <span className="font-semibold">200MB</span>
                                </div>
                                <div className="pt-2 mt-2 text-xs border-t border-red-300">
                                  Please compress your video and try again.
                                </div>
                              </div>,
                              {
                                duration: 8000,
                                position: 'top-center',
                                style: {
                                  background: '#FEE2E2',
                                  color: '#991B1B',
                                  maxWidth: '500px',
                                  padding: '16px',
                                },
                                icon: '🚫',
                              }
                            );
                            
                            if (introVideoPreview) {
                              URL.revokeObjectURL(introVideoPreview);
                            }
                            setIntroVideoFile(null);
                            setIntroVideoPreview("");
                            return;
                          }

                          // File is valid
                          setVideoSizeError(false);
                          if (introVideoPreview) {
                            URL.revokeObjectURL(introVideoPreview);
                          }
                          setIntroVideoFile(file);
                          setIntroVideoPreview(URL.createObjectURL(file));
                          
                          toast.success(
                            <div className="space-y-1">
                              <div className="font-bold">Video Uploaded!</div>
                              <div className="text-sm">{file.name} ({(file.size / (1024 * 1024)).toFixed(2)}MB)</div>
                            </div>,
                            {
                              duration: 3000,
                              position: 'top-center',
                            }
                          );
                        }}
                        onClick={(e) => {
                          e.target.value = '';
                        }}
                      />
                      <label
                        htmlFor="intro-video-upload"
                        className="flex flex-col items-center justify-center w-full h-32 transition-all duration-200 bg-white border-2 border-dashed rounded-lg cursor-pointer border-primary/30 hover:bg-primary/5"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FaUpload className="w-8 h-8 mb-4 text-primary" />
                          <p className="mb-2 text-sm text-center text-secondary">
                            <span className="font-semibold">Click to upload</span> a short intro video
                          </p>
                          <p className="text-xs font-semibold text-primary">
                            MP4, MOV, or WEBM (MAX. 200MB)
                          </p>
                          <p className="mt-1 text-xs text-secondary/60">
                            Recommended under 90 seconds
                          </p>
                        </div>
                      </label>
                    </div>

                    {introVideoFile && (
                      <div className="mt-4 space-y-3">
                        {introVideoPreview && (
                          <div className="relative overflow-hidden bg-black border border-gray-200 rounded-lg shadow-sm aspect-video">
                            <video
                              src={introVideoPreview}
                              controls
                              className="object-contain w-full h-full bg-black"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center">
                            <FaCheckCircle className="mr-2 text-blue-500" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-blue-800">
                                {introVideoFile.name}
                              </span>
                              <span className="text-xs text-blue-600">
                                {(introVideoFile.size / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (introVideoPreview) {
                                URL.revokeObjectURL(introVideoPreview);
                              }
                              setIntroVideoFile(null);
                              setIntroVideoPreview("");
                              setVideoSizeError(false);
                              const input = document.getElementById("intro-video-upload");
                              if (input) input.value = "";
                              toast.success("Video removed");
                            }}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-900"
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
                className="p-6 border border-blue-200 shadow-sm bg-blue-50 rounded-2xl"
              >
                <div className="flex items-start">
                  <Field
                    type="checkbox"
                    name="workedWithCimamplify"
                    id="workedWithCimamplify"
                    className="w-4 h-4 mt-1 border-gray-300 rounded text-primary focus:ring-primary"
                  />
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="workedWithCimamplify"
                      className="font-bold text-blue-800"
                    >
                      Select if you have ever posted a deal at our sister company, CIM Amplify (www.cimamplify.com)?

                    </label>
                    <p className="text-blue-700">
                      You can change this answer in the future once you have posted.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Testimonials */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 border shadow-sm bg-brand-light rounded-2xl border-primary/10"
              >
                <FieldArray name="testimonials">
                  {({ push, remove }) => {
                    const completedTestimonials = values.testimonials.filter(
                      (t) => t.clientName && t.testimonial
                    ).length;

                    return (
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="flex items-center text-xl font-semibold text-secondary">
                            <FaQuoteLeft className="mr-3 text-primary" />
                            Client Testimonials
                          </h3>
                          <div className="px-3 py-1 rounded-full bg-primary/10">
                            <span className="text-sm font-medium text-primary">
                              {completedTestimonials}/5 completed
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {values.testimonials.map((testimonial, index) => {
                            const isCompleted =
                              testimonial.clientName && testimonial.testimonial;

                            return (
                              <motion.div
                                key={`testimonial-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                  isCompleted
                                    ? "border-green-200 bg-green-50"
                                    : "border-gray-200 bg-white hover:border-primary/30"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="flex items-center text-sm font-semibold text-secondary">
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
                                    className={`w-full px-3 py-2 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-sm bg-white ${
                                      errors.testimonials?.[index]
                                        ?.clientName &&
                                      touched.testimonials?.[index]?.clientName
                                        ? "border-red-500"
                                        : "border-gray-300"
                                    }`}
                                  />
                                  <Field
                                    as="textarea"
                                    name={`testimonials[${index}].testimonial`}
                                    placeholder="Write the testimonial here..."
                                    rows="3"
                                    className={`w-full px-3 py-2 border rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-sm bg-white resize-none ${
                                      errors.testimonials?.[index]
                                        ?.testimonial &&
                                      touched.testimonials?.[index]?.testimonial
                                        ? "border-red-500"
                                        : "border-gray-300"
                                    }`}
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
                  className="px-8 py-4 font-semibold text-white transition-all duration-300 transform shadow-lg bg-gradient-to-r from-primary to-third rounded-xl hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting
                    ? "Creating Profile..."
                    : "Submit Profile"}
                </button>
              </motion.div>
            </Form>
          )}
        </Formik>
      </motion.div>
    </div>
  );
};


