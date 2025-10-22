"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import AdvisorCard from "../../components/AdvisorCard";
import toast, { Toaster } from "react-hot-toast";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import { rawGeographyData } from "../../components/Static/geographyData";
import { rawIndustryData } from "../../components/Static/industryData";
import { getIndustryData } from "../../components/Static/newIndustryData";
import { Country, State } from "country-state-city";
import { FaChevronDown, FaChevronRight, FaSearch } from "react-icons/fa";
import EditProfileModal from "../../components/EditProfileModal";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/common/Header";


// Map selected industry id to top-level industry label
const mapIndustry = (selectedId) => {
  for (const category of rawIndustryData) {
    if (category.id === selectedId) return category.label;
    if (category.children) {
      const child = category.children.find((c) => c.id === selectedId);
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
      const child = country.children.find((c) => c.id === selectedId);
      if (child) return country.label; // return parent label
    }
  }
  return "North America"; // fallback
};

// AnimatedInput component from seller form
const AnimatedInput = ({ 
  name,
  type = "text",
  placeholder,
  readOnly = false,
  prefix = "",
}) => {
  return (
    <div className="relative w-full">
      {prefix && (
        <span className="absolute transition-all duration-300 pointer-events-none left-3 top-4 text-primary/60 peer-focus:text-secondary peer-hover:text-secondary">
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
          ${prefix ? "pl-8" : ""}`}
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
        className="mt-1 text-sm text-red-500"
      />
    </div>
  );
};

// Industry Radio Chooser Component from SellerForm
const IndustryRadioChooser = ({ selected, onChange }) => {
  const [query, setQuery] = useState("");
  const [expandedSectors, setExpandedSectors] = useState({});
  const industryData = getIndustryData();

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

  return (
    <div className="w-full">
      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Industry Sectors"
          className="w-full py-3 pl-10 pr-4 transition-all duration-200 bg-white border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-secondary"
        />
        <FaSearch className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-secondary/50" />
      </div>
      <div className="h-64 p-4 overflow-y-auto border rounded-lg shadow-inner bg-gray-50 border-primary/20 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-gray-100">
        {filteredSectors.length > 0 ? (
          <div className="space-y-2">
            {filteredSectors.map((sector) => (
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
                            type="radio"
                            name="industry"
                            id={`group-${group.id}`}
                            value={group.name}
                            checked={selected === group.name}
                            onChange={() => onChange(group.name)}
                            className="w-4 h-4 mr-2 transition-colors duration-200 border-gray-300 text-primary focus:ring-primary form-radio"
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

// Geography Radio Chooser Component from SellerForm
const GeographyRadioChooser = ({ selected, onChange }) => {
  const [query, setQuery] = useState("");
  const [expandedCountries, setExpandedCountries] = useState({});

  let allCountries = Country.getAllCountries().filter((country) => {
    const countryMatch = country.name
      .toLowerCase()
      .includes(query.toLowerCase());
    const states = State.getStatesOfCountry(country.isoCode);
    const stateMatch = states.some((state) =>
      state.name.toLowerCase().includes(query.toLowerCase())
    );
    return countryMatch || stateMatch;
  });

  const priorityCountries = ["United States", "Canada", "Mexico"];
  const priority = allCountries.filter((c) =>
    priorityCountries.includes(c.name)
  );
  const rest = allCountries.filter((c) => !priorityCountries.includes(c.name));
  allCountries = [...priority, ...rest];

  return (
    <div className="w-full">
      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Geographies"
          className="w-full py-3 pl-10 pr-4 transition-all duration-200 bg-white border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-secondary"
        />
        <FaSearch className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-secondary/50" />
      </div>
      <div className="h-64 p-4 overflow-y-auto border rounded-lg shadow-inner bg-gray-50 border-primary/20 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-gray-100">
        <div className="space-y-2">
          {allCountries.map((country) => {
            let states = State.getStatesOfCountry(country.isoCode);

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
                                                        states = states.filter((state) => contiguous.includes(state.name) || ["Hawaii", "Alaska"].includes(state.name)
              );
            }

            return (
              <div
                key={country.isoCode}
                className="pb-1 border-b border-gray-100"
              >
                <div className="flex items-center">
                  
                  <div
                    className="flex items-center flex-1 cursor-pointer"
                    onClick={() =>
                      setExpandedCountries((prev) => ({
                        ...prev,
                        [country.isoCode]: !prev[country.isoCode],
                      }))
                    }
                  >
                    {expandedCountries[country.isoCode] ? (
                      <FaChevronDown className="w-4 h-4 mr-1 text-secondary/60" />
                    ) : (
                      <FaChevronRight className="w-4 h-4 mr-1 text-secondary/60" />
                    )}
                    <label
                      htmlFor={`geo-${country.isoCode}`}
                      className="font-medium cursor-pointer text-secondary"
                    >
                      {country.name}
                    </label>
                  </div>
                </div>
                {expandedCountries[country.isoCode] && (
                  <div className="mt-1 ml-6 space-y-1">
                    {states
                      .filter((state) =>
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
                              type="radio"
                              name="geography"
                              id={`geo-${country.isoCode}-${state.isoCode}`}
                              value={`${country.name} > ${state.name}`}
                              checked={
                                selected === `${country.name} > ${state.name}`
                              }
                              onChange={() =>
                                onChange(`${country.name} > ${state.name}`)
                              }
                              className="w-4 h-4 mr-2 transition-colors duration-200 border-gray-300 text-primary focus:ring-primary form-radio"
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
          })}
        </div>
      </div>
    </div>
  );
};

const SellerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Exit guard refs
  const [guardEnabled, setGuardEnabled] = useState(true);
  const exitGuardEnabledRef = useRef(true); // block exit until profile is deleted
  const revertInProgressRef = useRef(false); // avoid loops when reverting navigation
  const lastPathRef = useRef("");

  // Delete profile handler
  const handleDeleteProfile = async () => {
    const confirmed = window.confirm(
      "When you exit your profile and matches are deleted. You'll need to enter your email and fill the form again next time."
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(
        "https://api.advisorchooser.com/api/sellers/profile",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Clear local auth state
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");

      // Clear cookies
      if (typeof document !== "undefined") {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie =
            name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
      }

      toast.success("Profile deleted. See you next time!");
      // allow navigation away (disable exit guard) before redirecting
      exitGuardEnabledRef.current = false;
      setGuardEnabled(false);
      setTimeout(() => {
        window.location.href = "/seller-login";
      }, 1500);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete profile");
    }
  };

  const [seller, setSeller] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [selectedAdvisors, setSelectedAdvisors] = useState([]);
  const [introductionRequests, setIntroductionRequests] = useState([]);
  const [directContactList, setDirectContactList] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [introductionLoading, setIntroductionLoading] = useState(false);
  const [directListLoading, setDirectListLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectAdvisor = (advisorId) => {
    setSelectedAdvisors((prevSelected) => {
      if (prevSelected.includes(advisorId)) {
        return prevSelected.filter((id) => id !== advisorId);
      } else {
        return [...prevSelected, advisorId];
      }
    });
  };

const handleBulkIntroduction = async () => {
  if (selectedAdvisors.length === 0) return;

  try {
    setIntroductionLoading(true);
    const token = localStorage.getItem("access_token");

    const response = await axios.post(
      "https://api.advisorchooser.com/api/connections/introduction",
      { advisorIds: selectedAdvisors },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.success(
      `📧 Introduction emails sent to you and ${ 
        selectedAdvisors.length
      } selected advisor${selectedAdvisors.length > 1 ? "s" : ""}!`
    );
    setIntroductionRequests([...introductionRequests, ...selectedAdvisors]);
    setSelectedAdvisors([]);
  } catch (error) {
    toast.error("Failed to send introduction requests");
  } finally {
    setIntroductionLoading(false);
  }
};

  const handleGetDirectList = async () => {
    try {
      setDirectListLoading(true);
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        "https://api.advisorchooser.com/api/connections/direct-list",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200 || response.status === 201) {
        const msg = response.data?.message || `Direct contact list sent!`;
        const sellerEmail =
          userProfile?.email || profile?.email || "your email";
        toast.success(
          `📧 ${msg}\nCheck your email (${sellerEmail}) for the contact list.`, { duration: 5000, id: "direct-list-success" } 
        );
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error(
          "No matching advisors found or seller profile not complete"
        );
      } else if (error.response?.status === 429) {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to request direct list"
        );
      }
    } finally {
      setDirectListLoading(false);
    }
  };

  // Fetch core profile fields (name, email) from API, merge with localStorage for other fields (not name/email)
  const [profile, setProfile] = useState({});

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const res = await axios.get(
          "https://api.advisorchooser.com/api/auth/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.status === 200 && res.data) {
          // Only keep name and email, ignore password
          setUserProfile({
            name: res.data.name,
            email: res.data.email,
          });
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");

        // Get user auth data
        const authRes = await axios.get(
          "https://api.advisorchooser.com/api/auth/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        let combinedProfile = {
          id: authRes.data.id,
          name: authRes.data.name,
          email: authRes.data.email,
          role: authRes.data.role,
          isEmailVerified: authRes.data.isEmailVerified,
        };

        // Try to get seller profile from database
        try {
          const sellerRes = await axios.get(
            "https://api.advisorchooser.com/api/sellers/profile",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (sellerRes.status === 200 && sellerRes.data) {
            combinedProfile = {
              ...combinedProfile,
              companyName: sellerRes.data.companyName,
              phone: sellerRes.data.phone,
              website: sellerRes.data.website,
              industry: sellerRes.data.industry,
              geography: sellerRes.data.geography,
              annualRevenue: sellerRes.data.annualRevenue,
              currency: sellerRes.data.currency,
              description: sellerRes.data.description,
            };
          }
        } catch (sellerErr) {
          // If no seller profile exists, use empty values
          console.log("No seller profile found in database");
        }

        setProfile(combinedProfile);
      } catch (err) {
        console.error("Error fetching profile from API:", err);
      }
    };
    fetchProfile();
  }, [profileRefreshTrigger]);

  const fetchMatches = async () => {
    try {
      setMatchesLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("No token found, please log in again.");
        return;
      }

      const res = await axios.get(
        `https://api.advisorchooser.com/api/sellers/matches`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 200 && res.data) {
        setMatches(res.data);
      } else {
        setMatches([]);
        toast.error(res.data?.message || "Failed to fetch matches");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch matches");
    } finally {
      setMatchesLoading(false);
    }
  };

  // Fetch seller profile
  const fetchSeller = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("No token found, please log in again.");
        return;
      }

      const res = await axios.get(
        "https://api.advisorchooser.com/api/sellers/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 200 && res.data) {
        setSeller(res.data);
        // Update profile state with new data
        setProfile((prev) => ({
          ...prev,
          fullName: res.data.fullName || res.data.name || prev.fullName,
          email: res.data.email || prev.email,
          companyName: res.data.companyName || prev.companyName,
          phone: res.data.phone || prev.phone,
          website: res.data.website || prev.website,
          industry: res.data.industry || prev.industry,
          geography: res.data.geography || prev.geography,
          maxRevenue: res.data.annualRevenue || prev.maxRevenue,
          currency: res.data.currency || prev.currency,
          description: res.data.description || prev.description,
        }));
        toast.success("Seller profile loaded successfully", {
          id: "profile-toast",
        });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch seller profile",
        { id: "profile-error" }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeller();
    fetchMatches();
  }, [profileRefreshTrigger]);

  // Always warn on unload while exit guard is enabled (tab close, browser close, URL change)
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (exitGuardEnabledRef.current) {
        const message = "When you exit your profile and matches are deleted. You'll need to enter your email and fill the form again next time.";
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // (Removed unstable router blocker; using history/beforeunload guards instead)

  // Block browser back/forward (popstate) while guard enabled
  useEffect(() => {
    // Push a dummy state so back button fires popstate and we can intercept
    try {
      window.history.pushState(
        { _guard: true },
        document.title,
        window.location.href
      );
    } catch {}

    const onPopState = (e) => {
      if (!exitGuardEnabledRef.current) return;
      // Re-push state to keep user on the page
      try {
        window.history.pushState(
          { _guard: true },
          document.title,
          window.location.href
        );
      } catch {}
      alert(
        "Don't exit without deleting the profile. Please delete your profile to leave the dashboard."
      );
      toast.error("Delete your profile before exiting.");
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  // Block in-app navigation triggered via history.pushState/replaceState (e.g., Links)
  useEffect(() => {
    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;

    const guardWrapper = (original) =>
      function (...args) {
        if (exitGuardEnabledRef.current) {
          alert(
            "Don't exit without deleting the profile. Please delete your profile to leave the dashboard."
          );
          toast.error("Delete your profile before exiting.");
          return; // cancel navigation
        }
        return original.apply(this, args);
      };

    try {
      window.history.pushState = guardWrapper(originalPush);
      window.history.replaceState = guardWrapper(originalReplace);
    } catch {}

    return () => {
      try {
        window.history.pushState = originalPush;
        window.history.replaceState = originalReplace;
      } catch {}
    };
  }, []);

  // Block in-app route changes while exit guard is enabled (back button or URL/path changes within SPA)
  useEffect(() => {
    const currentPath = location.pathname + location.search + location.hash;

    // Initialize lastPathRef on first render
    if (!lastPathRef.current) {
      lastPathRef.current = currentPath;
      return;
    }

    // If we're reverting a navigation, just record and clear the flag
    if (revertInProgressRef.current) {
      lastPathRef.current = currentPath;
      revertInProgressRef.current = false;
      return;
    }

    // Detect a path change
    if (currentPath !== lastPathRef.current) {
      if (exitGuardEnabledRef.current) {
        // Notify user and revert navigation if possible
        alert(
          "Don't exit without deleting the profile. Please delete your profile to leave the dashboard."
        );
        toast.error("Delete your profile before exiting.");
        try {
          revertInProgressRef.current = true;
          navigate(-1);
        } catch {}
        return;
      }
      // Allowed navigation (guard disabled)
      lastPathRef.current = currentPath;
    }
  }, [location, navigate]);

  // No router blocker component required

  // Comprehensive validation schema with all fields required
  const SellerSchema = Yup.object().shape({
    companyName: Yup.string()
      .min(2, "Company name must be at least 2 characters")
      .max(100, "Company name must not exceed 100 characters")
      .required("Company name is required"),
    phone: Yup.string()
      .matches(
        /^\+?[1-9]\d{1,14}$/,
        "Enter a valid phone number with country code"
      )
      .min(10, "Phone number must be at least 10 digits")
      .required("Phone number is required"),
    website: Yup.string()
      .required("Website is required")
      .test(
        "url",
        "Enter a valid website (e.g., www.example.com or https://example.com)",
        function (value) {
          if (!value) return false;
          const urlPattern =
            /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?(\/.*)?(\?.*)?(#.*)?$/;
          return urlPattern.test(value);
        }
      ),
    industry: Yup.string()
      .min(1, "Please select an industry")
      .required("Industry selection is required"),
    geography: Yup.string()
      .min(1, "Please select a geography")
      .required("Geography selection is required"),
    annualRevenue: Yup.number()
      .nullable()
      .transform((value, originalValue) => {
        const v =
          typeof originalValue === "string"
            ? originalValue.replace(/,/g, "")
            : originalValue;
        const n = Number(v);
        return isNaN(n) || v === "" ? null : n;
      })
      .min(1000, "Annual revenue must be at least $1,000")
      .max(999999999, "Annual revenue is too large")
      .required("Annual revenue is required")
      .typeError("Annual revenue must be a valid number"),
    currency: Yup.string()
      .oneOf(
        [
          "USD",
          "EUR",
          "JPY",
          "GBP",
          "CNY",
          "AUD",
          "CAD",
          "CHF",
          "HKD",
          "SGD",
          "SEK",
          "NOK",
          "NZD",
          "MXN",
          "ZAR",
          "TRY",
          "BRL",
          "KRW",
          "INR",
          "RUB",
        ],
        "Please select a valid currency"
      )
      .required("Currency selection is required"),
    description: Yup.string()
      .min(20, "Description must be at least 20 characters")
      .max(1000, "Description must not exceed 1000 characters")
      .matches(/^(?!\s*$).+/, "Description cannot be empty or just whitespace")
      .required("Description is required"),
  });

  // Enhanced submit handler with auto-refresh
  const handleEnhancedSubmit = async (values, { setSubmitting }) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Unauthorized! Please log in again.");
        return;
      }

      const payload = {
        companyName: values.companyName,
        phone: values.phone,
        website: values.website,
        industry: values.industry,
        geography: values.geography,
        annualRevenue: Number(
          String(values.annualRevenue || "").replace(/,/g, "")
        ),
        currency: values.currency,
        description: values.description,
      };

      const res = await axios.patch(
        "https://api.advisorchooser.com/api/sellers/profile",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        }
      );

      if (res.status === 200) {
        toast.success("Seller profile updated successfully");
        exitGuardEnabledRef.current = false;
        setGuardEnabled(false);
        setActiveTab('pending'); // Switch to dashboard tab

        // Update localStorage with new data
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const updatedUser = {
            ...parsedUser,
            companyName: values.companyName,
            phone: values.phone,
            website: values.website,
            industry: values.industry,
            geography: values.geography,
            annualRevenue: values.annualRevenue,
            currency: values.currency,
            description: values.description,
          };

          localStorage.setItem("user", JSON.stringify(updatedUser));
        }

        // Refresh data and clear unsaved flag without full reload
        setProfileRefreshTrigger((prev) => prev + 1);
        setUnsavedChanges(false);
      } else {
        toast.error(res.data?.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating seller profile:", err);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  // Formik setup for Company Profile (original - keeping for backward compatibility)
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      companyName: seller?.companyName || "",
      phone: seller?.phone || "",
      website: seller?.website || "",
      industry: seller?.industry || "",
      geography: seller?.geography || "",
      annualRevenue: seller?.annualRevenue || "",
      currency: seller?.currency || "USD",
      description: seller?.description || "",
    },
    validationSchema: Yup.object({
      companyName: Yup.string().required("Company name is required"),
      phone: Yup.string().required("Phone is required"),
      website: Yup.string()
        .url("Enter a valid URL")
        .required("Website is required"),
      industry: Yup.string().required("Industry is required"),
      geography: Yup.string().required("Geography is required"),
      annualRevenue: Yup.number()
        .typeError("Annual revenue must be a number")
        .positive("Must be positive")
        .required("Annual revenue is required"),
      currency: Yup.string().required("Currency is required"),
      description: Yup.string().required("Description is required"),
    }),
    onSubmit: async (values) => {
      try {
        const token = localStorage.getItem("access_token");
        await axios.patch(
          "https://api.advisorchooser.com/api/sellers/profile",
          values,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Profile updated successfully");
        await fetchSeller();
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to update profile"
        );
      }
    },
  });

  // Helper component to mark all fields touched after submit
  const ValidationTouched = ({ submitCount, errors, setTouched }) => {
    useEffect(() => {
      if (submitCount > 0 && errors && Object.keys(errors).length) {
        const all = {};
        const walk = (o, p = "") => {
          Object.keys(o).forEach((k) => {
            const path = p ? `${p}.${k}` : k;
            if (o[k] && typeof o[k] === "object") walk(o[k], path);
            else all[path] = true;
          });
        };
        walk(errors);
        setTouched(all, true);
      }
    }, [submitCount]);
    return null;
  };

  const handleLogoClick = () => {
  navigate("/");
};

  // Enhanced initial values with comprehensive autofill
  const enhancedInitialValues = {
    fullName: profile.name || "",
    email: profile.email || "",
    companyName: profile.companyName || seller?.companyName || "",
    phone: profile.phone || seller?.phone || "",
    website: profile.website || seller?.website || "",
    industry: profile.industry || seller?.industry || "",
    geography: profile.geography || seller?.geography || "",
    annualRevenue: (() => {
      const raw = profile.annualRevenue ?? seller?.annualRevenue ?? "";
      if (raw === "" || raw === null || typeof raw === "undefined") return "";
      const num =
        typeof raw === "number"
          ? raw
          : Number(String(raw).toString().replace(/,/g, ""));
      if (isNaN(num)) return String(raw);
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    })(),
    currency: profile.currency || seller?.currency || "USD",
    description: profile.description || seller?.description || "",
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        fixed lg:static inset-y-0 left-0 z-30 w-72 bg-white flex flex-col border-r border-gray-200 shadow-sm transition-transform duration-300 ease-in-out
      `}
      >
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4 lg:justify-center">
            <img
              src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w-768,fit=crop,q=95/mk3JaNVZEltBD9g4/logo-transparency-mnlJLXr4jxIOR470.png"
              alt="Advisor Chooser"
              className="object-contain w-auto h-8"
               onClick={handleLogoClick}
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md lg:hidden hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-6">
          <div className="space-y-6">
            {/* Main Menu */}
            <div className="space-y-1">
              <p className="px-3 mb-3 text-xs font-medium tracking-wider text-gray-500 uppercase">
                Main Menu
              </p>

              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between ${ 
                  activeTab === "pending"
                    ? "bg-gradient-to-r from-third to-primary text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  setActiveTab("pending");
                  setSidebarOpen(false);
                }}
              >
                <div className="flex items-center space-x-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <div>
                    <span className="text-sm font-medium">Dashboard</span>
                    <p className="text-xs opacity-70">
                      Select Your Matched Advisors
                    </p>
                  </div>
                </div>
                {matches.length > 0 && (
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${ 
                      activeTab === "pending"
                        ? "bg-white/20"
                        : "bg-gradient-to-r from-third to-primary text-white"
                    }`}
                  >
                    {matches.length}
                  </span>
                )}
              </button>
            </div>

            {/* Settings */}
            <div className="space-y-1">
              <p className="px-3 mb-3 text-xs font-medium tracking-wider text-gray-500 uppercase">
                Settings
              </p>

              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${ 
                  activeTab === "company"
                    ? "bg-gradient-to-r from-third to-primary text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => {
                  setActiveTab("company");
                  setSidebarOpen(false);
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <span className="text-sm font-medium">Profile</span>
                  <p className="text-xs opacity-70">Update your information</p>
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-6 space-y-4 border-t border-gray-100">
          {/* New sticky card */}
          <div className="sticky bottom-0 p-4 bg-blue-100 border border-blue-200 rounded-lg shadow-md">
            <p className="text-xs text-blue-800">
              Please note: After 24 hours your profile and matches are deleted from our system.  Until then your email address will skip the Profile Form and return directly here.  After that you will be required to fill out another profile to use Advisor Chooser again.
            </p>
          </div>
          {/* Delete Profile */}
          <button
            className="flex items-center justify-center w-full px-4 py-3 space-x-2 text-red-600 transition-colors duration-200 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300"
            onClick={handleDeleteProfile}
            title="Delete your profile and exit"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a2 2 0 00-2-2h-4a2 2 0 00-2 2m-2 0h12"
              />
            </svg>
            <span className="text-sm font-medium">Delete Profile Now</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-col flex-1">
        {/* Reminder banner removed per request: show only on close/leave attempt */}

        {/* Tabs Content */}
        <div className="flex-1 px-4 py-4 overflow-y-auto lg:px-6">
          {activeTab === "pending" && (
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">
                    Select Your Matched Advisors
                  </h3>
                  {matches.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setSelectedAdvisors(
                            matches.map((advisor) => advisor.id)
                          )
                        }
                        className="px-3 py-1 text-xs text-blue-700 transition-colors bg-blue-100 rounded-lg hover:bg-blue-200"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedAdvisors([])}
                        className="px-3 py-1 text-xs text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Deselect All
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex flex-col flex-1 gap-3 sm:flex-row sm:gap-4">
                    <button
                      onClick={handleBulkIntroduction}
                      disabled={
                        selectedAdvisors.length === 0 || introductionLoading
                      }
                      className="flex items-center justify-center min-w-0 gap-2 px-6 py-3 text-base font-semibold text-white transition-all duration-200 shadow-lg rounded-xl bg-gradient-to-r from-primary to-third hover:from-primary/80 hover:to-third/80 hover:scale-105 hover:shadow-xl active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {introductionLoading ? (
                        <>
                          <svg
                            className="w-4 h-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span className="hidden sm:inline">Sending...</span>
                          <span className="sm:hidden">Sending</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">
                            Request Advisor To Contact Me (
                            {selectedAdvisors.length})
                          </span>
                          <span className="sm:hidden">
                            Request Advisor To Contact Me (
                            {selectedAdvisors.length})
                          </span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleGetDirectList}
                      disabled={directListLoading}
                      className="flex items-center justify-center min-w-0 gap-2 px-6 py-3 text-base font-semibold text-white transition-all duration-200 shadow-lg rounded-xl bg-gradient-to-r from-primary to-third hover:from-primary/80 hover:to-third/80 hover:scale-105 hover:shadow-xl active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {directListLoading ? (
                        <>
                          <svg
                            className="w-4 h-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Email Me The List</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {matchesLoading ? (
                <div className="py-10 text-center text-gray-500">
                  Loading matches...
                </div>
              ) : matches.length === 0 ? (
                <div className="p-6 space-y-4 text-center border-l-4 border-yellow-400 rounded-lg bg-yellow-50">
                  <h3 className="text-xl font-semibold text-gray-800">
                    No Advisor Matches Yet
                  </h3>
                  <p className="text-gray-700">
                    Great opportunities are on their way! While we currently don't have matching advisors for your profile, please come back and try again as we are vetting and adding new Advisors all the time.
                  </p>
                  <button
                    onClick={() => fetchMatches()}
                    className="px-5 py-2 mt-2 text-white transition rounded-lg bg-primary hover:bg-primary/90"
                  >
                    Refresh Matches
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-6 xl:gap-3">
    {matches.map((advisor) => (
      <AdvisorCard
        key={advisor.id}
        advisor={advisor}
        onSelect={() => handleSelectAdvisor(advisor.id)}
        isSelected={selectedAdvisors.includes(advisor.id)}
      />
    ))}
  </div>
              )}
            </div>
          )}

          {/* Introduction Requests */}
          {introductionRequests.length > 0 && (
            <div className="p-4 mt-8 border rounded-lg bg-gray-50">
              <h3 className="mb-4 text-lg font-semibold">
                Introduction Requests Sent
              </h3>
              <ul>
                {introductionRequests.map((advisorId) => {
                  const advisor = matches.find((m) => m.id === advisorId);
                  return (
                    <li key={advisorId} className="mb-2">
                      <p className="text-gray-700">
                        Introduction request sent to{" "}
                        <strong>
                          {advisor ? advisor.companyName : "An Advisor"}
                        </strong>
                        .
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Direct Contact List */}
          {directContactList.length > 0 && (
            <div className="p-4 mt-8 border rounded-lg bg-gray-50">
              <h3 className="mb-4 text-lg font-semibold">
                Direct Contact List
              </h3>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                {directContactList.map((advisor) => (
                  <div
                    key={advisor.id}
                    className="p-6 overflow-hidden bg-white rounded-lg shadow-lg"
                  >
                    <h4 className="text-lg font-semibold text-gray-800">
                      {advisor.companyName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {advisor.advisorName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {advisor.advisorEmail}
                    </p>
                    <p className="text-sm text-gray-600">{advisor.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "company" && (
            <div className="w-full max-w-4xl mx-auto">
              {/* Header */}
              <div className="px-8 py-6 bg-white border-b border-gray-200 rounded-t-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-third">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Company Profile
                      </h2>
                      <p className="text-gray-600">
                        Update your business information and preferences
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Container */}
              <div className="bg-white rounded-b-lg shadow-sm">
                <Formik
                  enableReinitialize
                  initialValues={enhancedInitialValues}
                  validationSchema={SellerSchema}
                  onSubmit={handleEnhancedSubmit}
                >
                  {({
                    isSubmitting,
                    values,
                    setFieldValue,
                    errors,
                    submitCount,
                    setTouched,
                    dirty,
                  }) => (
                    <Form className="p-8 space-y-8">
                      {submitCount > 0 &&
                        Object.keys(errors || {}).length > 0 && (
                          <div className="p-3 mb-4 text-red-700 border border-red-200 rounded bg-red-50">
                            Please fix {Object.keys(errors).length} highlighted
                            field{Object.keys(errors).length > 1 ? "s" : ""}.
                          </div>
                        )}
                      <ValidationTouched
                        submitCount={submitCount}
                        errors={errors}
                        setTouched={setTouched}
                      />
                      {unsavedChanges !== dirty && setUnsavedChanges(dirty)}
                      {/* Company Details Section */}
                      <div className="pb-8 border-b border-gray-200">
                        <h3 className="flex items-center mb-6 space-x-2 text-lg font-semibold text-gray-900">
                          <svg
                            className="w-5 h-5 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          <span>Company Details</span>
                        </h3>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Company Name *
                            </label>
                            <Field
                              name="companyName"
                              className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                              placeholder="Enter your company name"
                            />
                            <ErrorMessage
                              name="companyName"
                              component="p"
                              className="text-sm text-red-500"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Phone Number *
                            </label>
                            <Field
                              name="phone"
                              className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                              placeholder="+1 (555) 123-4567"
                            />
                            <ErrorMessage
                              name="phone"
                              component="p"
                              className="text-sm text-red-500"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Website *
                            </label>
                            <Field
                              name="website"
                              className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                              placeholder="https://www.yourcompany.com"
                            />
                            <ErrorMessage
                              name="website"
                              component="p"
                              className="text-sm text-red-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Financial Information Section */}
                      <div className="pb-8 border-b border-gray-200">
                        <h3 className="flex items-center mb-6 space-x-2 text-lg font-semibold text-gray-900">
                          <svg
                            className="w-5 h-5 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>Financial Information</span>
                        </h3>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Currency *
                            </label>
                            <Field
                              as="select"
                              name="currency"
                              className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                              <option value="USD">US Dollar (USD)</option>
                              <option value="EUR">Euro (EUR)</option>
                              <option value="JPY">Japanese Yen (JPY)</option>
                              <option value="GBP">
                                British Pound Sterling (GBP)
                              </option>
                              <option value="CNY">
                                Chinese Yuan/Renminbi (CNY)
                              </option>
                              <option value="AUD">
                                Australian Dollar (AUD)
                              </option>
                              <option value="CAD">Canadian Dollar (CAD)</option>
                              <option value="CHF">Swiss Franc (CHF)</option>
                              <option value="HKD">
                                Hong Kong Dollar (HKD)
                              </option>
                              <option value="SGD">
                                Singapore Dollar (SGD)
                              </option>
                              <option value="SEK">Swedish Krona (SEK)</option>
                              <option value="NOK">Norwegian Krone (NOK)</option>
                              <option value="NZD">
                                New Zealand Dollar (NZD)
                              </option>
                              <option value="MXN">Mexican Peso (MXN)</option>
                              <option value="ZAR">
                                South African Rand (ZAR)
                              </option>
                              <option value="TRY">Turkish Lira (TRY)</option>
                              <option value="BRL">Brazilian Real (BRL)</option>
                              <option value="KRW">
                                South Korean Won (KRW)
                              </option>
                              <option value="INR">Indian Rupee (INR)</option>
                              <option value="RUB">Russian Ruble (RUB)</option>
                            </Field>
                            <ErrorMessage
                              name="currency"
                              component="p"
                              className="text-sm text-red-500"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Annual Revenue *
                            </label>
                            <div className="relative">
                              <span className="absolute text-gray-500 transform -translate-y-1/2 left-3 top-1/2">
                                {{ 
                                  USD: "$",
                                  EUR: "€",
                                  GBP: "£",
                                  PKR: "₨",
                                  INR: "₹",
                                  AUD: "$",
                                  CAD: "$",
                                  SGD: "$",
                                  JPY: "¥",
                                  CNY: "¥",
                                  CHF: "CHF",
                                  ZAR: "R",
                                  BRL: "R$",
                                  RUB: "₽",
                                  SAR: "﷼",
                                  AED: "د.إ",
                                  TRY: "₺",
                                  EGP: "£",
                                  NGN: "₦",
                                  MXN: "$",
                                  SEK: "kr",
                                  NOK: "kr",
                                  DKK: "kr",
                                  HKD: "$",
                                  KRW: "₩",
                                  THB: "฿",
                                  IDR: "Rp",
                                  MYR: "RM",
                                  TWD: "NT$",
                                  ILS: "₪",
                                  PLN: "zł",
                                  CZK: "Kč",
                                  HUF: "Ft",
                                  PHP: "₱",
                                  CLP: "$",
                                  COP: "$",
                                  ARS: "$",
                                  VND: "₫",
                                  BDT: "৳",
                                  LKR: "₨",
                                  MMK: "K",
                                  KWD: "د.ك",
                                  QAR: "﷼",
                                  OMR: "﷼",
                                  BHD: ".د.ب",
                                  JOD: "د.ا",
                                  MAD: "د.م.",
                                  TND: "د.ت",
                                  KES: "KSh",
                                  TZS: "TSh",
                                  UGX: "USh",
                                  GHS: "₵",
                                  ETB: "Br",
                                  DZD: "د.ج",
                                  SDG: "ج.س.",
                                  AOA: "Kz",
                                  MZN: "MT",
                                  XOF: "CFA",
                                  XAF: "FCFA",
                                  CDF: "FC",
                                  ZMW: "ZK",
                                  BWP: "P",
                                  NAD: "$",
                                  MUR: "₨",
                                  SCR: "₨",
                                  MWK: "MK",
                                  LSL: "L",
                                  SZL: "L",
                                  SLL: "Le",
                                  GMD: "D",
                                  GNF: "FG",
                                  MGA: "Ar",
                                  KMF: "CF",
                                  SOS: "S",
                                  DJF: "Fdj",
                                  ERN: "Nfk",
                                  LYD: "ل.د",
                                  MRU: "UM",
                                  BIF: "FBu",
                                  RWF: "R₣",
                                  XPF: "₣",
                                  FJD: "$",
                                  WST: "T",
                                  TOP: "T$",
                                  PGK: "K",
                                  SBD: "$",
                                  VUV: "Vt",
                                  KZT: "₸",
                                  UZS: "лв",
                                  TJS: "SM",
                                  KGS: "лв",
                                  AFN: "؋",
                                  NPR: "₨",
                                  MNT: "₮",
                                  LAK: "₭",
                                  KHR: "៛",
                                  BND: "$",
                                  MOP: "MOP$",
                                  ISK: "kr",
                                  RON: "lei",
                                  BGN: "лв",
                                  HRK: "kn",
                                  RSD: "Дин.",
                                  UAH: "₴",
                                  BYN: "Br",
                                  MDL: "L",
                                  GEL: "₾",
                                  AZN: "₼",
                                  AMD: "֏",
                                  ALL: "L",
                                  MKD: "ден",
                                  BAM: "KM",
                                  SSP: "£",
                                  KPW: "₩",
                                }[values.currency] || values.currency}
                              </span>
                              <Field name="annualRevenue">
                                {({ field, form }) => (
                                  <input
                                    {...field}
                                    type="text"
                                    className="w-full py-3 pl-8 pr-4 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                    placeholder="1,000,000"
                                    onChange={(e) => {
                                      const digits = e.target.value.replace(
                                        /[^\d]/g,
                                        ""
                                      );
                                      const formatted = digits.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        "," 
                                      );
                                      form.setFieldValue(field.name, formatted);
                                    }}
                                    value={field.value}
                                  />
                                )}
                              </Field>
                            </div>
                            <ErrorMessage
                              name="annualRevenue"
                              component="p"
                              className="text-sm text-red-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Business Classification Section */}
                      <div className="pb-8 border-b border-gray-200">
                        <h3 className="flex items-center mb-6 space-x-2 text-lg font-semibold text-gray-900">
                          <svg
                            className="w-5 h-5 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                          <span>Business Classification</span>
                        </h3>

                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                              Industry Sector *
                            </label>
                            {values.industry && (
                              <div className="p-2 mb-2 border rounded-lg bg-primary/10 border-primary/20">
                                <span className="text-sm font-medium text-primary">
                                  Selected: {values.industry}
                                </span>
                              </div>
                            )}
                            <IndustryRadioChooser
                              selected={values.industry}
                              onChange={(val) => setFieldValue("industry", val)}
                            />
                            <ErrorMessage
                              name="industry"
                              component="div"
                              className="mt-2 text-sm text-red-500"
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                              Geographic Region *
                            </label>
                            {values.geography && (
                              <div className="p-2 mb-2 border rounded-lg bg-primary/10 border-primary/20">
                                <span className="text-sm font-medium text-primary">
                                  Selected: {values.geography}
                                </span>
                              </div>
                            )}
                            <GeographyRadioChooser
                              selected={values.geography}
                              onChange={(val) =>
                                setFieldValue("geography", val)
                              }
                            />
                            <ErrorMessage
                              name="geography"
                              component="div"
                              className="mt-2 text-sm text-red-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Company Description Section */}
                      <div className="pb-8">
                        <h3 className="flex items-center mb-6 space-x-2 text-lg font-semibold text-gray-900">
                          <svg
                            className="w-5 h-5 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span>Company Description</span>
                        </h3>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Business Description *
                          </label>
                          <Field
                            as="textarea"
                            name="description"
                            rows="6"
                            className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary"
                            placeholder="Provide a detailed description of your business, products/services, target market, and what makes your company unique. This information helps us match you with the most suitable advisors."
                          />
                          <div className="flex items-center justify-between">
                            <ErrorMessage
                              name="description"
                              component="p"
                              className="text-sm text-red-500"
                            />
                            <span className="text-xs text-gray-500">
                              {values.description
                                ? values.description.length
                                : 0}
                              /1000 characters
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end pt-6 border-t border-gray-200">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex items-center px-8 py-3 space-x-2 font-semibold text-white transition-all duration-300 rounded-lg bg-gradient-to-r from-primary to-third hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <svg
                                className="w-5 h-5 text-white animate-spin"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span>Updating Profile...</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span>Update Profile</span>
                            </>
                          )}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          )}

          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            profile={profile}
            onProfileUpdate={() => setProfileRefreshTrigger((prev) => prev + 1)}
          />
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#333",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            borderRadius: "12px",
            padding: "16px",
          },
          success: {
            iconTheme: {
              primary: "#10B981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </div>
  );
};

export default SellerDashboard;
