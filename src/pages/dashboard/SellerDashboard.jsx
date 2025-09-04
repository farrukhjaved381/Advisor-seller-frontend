import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import { motion, AnimatePresence } from "framer-motion";
import { rawGeographyData } from '../../components/Static/geographyData';
import { rawIndustryData } from '../../components/Static/industryData';
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

// AnimatedInput component from seller form
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

// RadioFilter Component from seller form
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

const SellerDashboard = () => {
    // Logout handler
    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.post(
                "https://advisor-seller-backend.vercel.app/api/auth/logout",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            // optionally handle errors
        } finally {
            // Clear cookies
            if (typeof document !== 'undefined') {
                const cookies = document.cookie.split(";");
                for (let cookie of cookies) {
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                }
            }

            // Show toast first
            toast.success("Logged out successfully");

            // Redirect after 1–2 seconds
            setTimeout(() => {
                window.location.href = "/seller-login";
            }, 2000); // 2 seconds
        }
    };

    const [seller, setSeller] = useState(null);
    const [activeTab, setActiveTab] = useState("pending");
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(false);
    const [sortBy, setSortBy] = useState("newest");
    const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [userProfile, setUserProfile] = useState({ name: "", email: "", password: "" });


    // Fetch core profile fields (name, email) from API, merge with localStorage for other fields (not name/email)
    const [profile, setProfile] = useState({});

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem("access_token");
                if (!token) return;

                const res = await axios.get(
                    "https://advisor-seller-backend.vercel.app/api/auth/profile",
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (res.status === 200 && res.data) {
                    // Only keep name and email, ignore password
                    setUserProfile({
                        name: res.data.name,
                        email: res.data.email
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
                // Get name and email from API only
                const token = localStorage.getItem("access_token");
                const res = await axios.get("https://advisor-seller-backend.vercel.app/api/auth/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                let apiProfile = {};
                if (res.status === 200 && res.data) {
                    apiProfile = {
                        id: res.data.id,
                        name: res.data.name,
                        email: res.data.email,
                        role: res.data.role,
                        isEmailVerified: res.data.isEmailVerified,
                    };
                }
                // Get other fields from localStorage (but NOT name/email)
                const storedUser = localStorage.getItem("user");
                let localFields = {};
                if (storedUser) {
                    try {
                        const parsedUser = JSON.parse(storedUser);
                        localFields = {
                            companyName: parsedUser.companyName,
                            phone: parsedUser.phone,
                            website: parsedUser.website,
                            industry: parsedUser.industry,
                            geography: parsedUser.geography,
                            annualRevenue: profile.annualRevenue || seller?.annualRevenue || "",
                            currency: parsedUser.currency,
                            description: parsedUser.description,
                        };
                    } catch (err) {
                        console.error("Error parsing user from localStorage:", err);
                    }
                }
                setProfile({ ...apiProfile, ...localFields });
            } catch (err) {
                console.error("Error fetching profile from API:", err);
            }
        };
        fetchProfile();
    }, [profileRefreshTrigger]);

    const fetchMatches = async (sort = "newest") => {
        try {
            setMatchesLoading(true);
            const token = localStorage.getItem("access_token");
            if (!token) {
                toast.error("No token found, please log in again.");
                return;
            }

            const res = await axios.get(
                `https://advisor-seller-backend.vercel.app/api/sellers/matches?sortBy=${sort}`,
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
                "https://advisor-seller-backend.vercel.app/api/sellers/profile",
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (res.status === 200 && res.data) {
                setSeller(res.data);
                // Update profile state with new data
                setProfile(prev => ({
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
                toast.success("Seller profile loaded successfully", { id: "profile-toast" });
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
        fetchMatches(sortBy);
    }, [profileRefreshTrigger]);

    // Comprehensive validation schema with all fields required
    const SellerSchema = Yup.object().shape({
        fullName: Yup.string()
            .min(2, "Full name must be at least 2 characters")
            .max(50, "Full name must not exceed 50 characters")
            .matches(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces")
            .required("Full Name is required"),
        email: Yup.string()
            .email("Invalid email format")
            .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address")
            .required("Email is required"),
        companyName: Yup.string()
            .min(2, "Company name must be at least 2 characters")
            .max(100, "Company name must not exceed 100 characters")
            .required("Company name is required"),
        phone: Yup.string()
            .matches(/^\+?[1-9]\d{1,14}$/, "Enter a valid phone number with country code")
            .min(10, "Phone number must be at least 10 digits")
            .required("Phone number is required"),
        website: Yup.string()
            .matches(/^https?:\/\/.+\..+/, "Website must be a valid URL (https://example.com)")
            .url("Enter a valid website URL")
            .required("Website is required"),
        industry: Yup.string()
            .min(1, "Please select an industry")
            .required("Industry selection is required"),
        geography: Yup.string()
            .min(1, "Please select a geography")
            .required("Geography selection is required"),
        annualRevenue: Yup.number()
            .nullable()
            .transform(value => (isNaN(value) || value === null || value === '' ? null : value))
            .min(1000, "Annual revenue must be at least $1,000")
            .max(999999999, "Annual revenue is too large")
            .required("Annual revenue is required")
            .typeError("Annual revenue must be a valid number"),

        currency: Yup.string()
            .oneOf(["USD", "PKR", "EUR", "GBP"], "Please select a valid currency")
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
                annualRevenue: values.annualRevenue,
                currency: values.currency,
                description: values.description,
            };

            const res = await axios.patch(
                "https://advisor-seller-backend.vercel.app/api/sellers/profile",
                payload,
                { headers: { Authorization: `Bearer ${token}` }, validateStatus: () => true }
            );

            if (res.status === 200) {
                toast.success("Seller profile updated successfully");

                // Update localStorage with new data
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    const updatedUser = {
                        ...parsedUser,
                        name: values.fullName,
                        fullName: values.fullName,
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

                // Force refresh data and profile
                setProfileRefreshTrigger(prev => prev + 1);

                // Auto-refresh page after 1 second
                setTimeout(() => {
                    window.location.reload();
                }, 1000);

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
            website: Yup.string().url("Enter a valid URL").required("Website is required"),
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
                    "https://advisor-seller-backend.vercel.app/api/sellers/profile",
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

    // Enhanced initial values with comprehensive autofill
    const enhancedInitialValues = {
        fullName: profile.name || "",
        email: profile.email || "",
        companyName: profile.companyName || seller?.companyName || "",
        phone: profile.phone || seller?.phone || "",
        website: profile.website || seller?.website || "",
        industry: profile.industry || seller?.industry || "",
        geography: profile.geography || seller?.geography || "",
        annualRevenue: profile.annualRevenue || seller?.annualRevenue || "",

        currency: profile.currency || seller?.currency || "USD",
        description: profile.description || seller?.description || "",
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex flex-col p-6">
                <h1 className="text-2xl font-bold mb-8">CIM Amplify</h1>
                <nav className="flex flex-col gap-4">
                    <button
                        className={`text-left px-4 py-2 rounded-lg ${activeTab === "pending" ? "bg-green-100 font-medium" : "hover:bg-gray-100"
                            }`}
                        onClick={() => setActiveTab("pending")}
                    >
                        All Deals
                    </button>
                    <button
                        className={`text-left px-4 py-2 rounded-lg ${activeTab === "marketplace" ? "bg-green-100 font-medium" : "hover:bg-gray-100"
                            }`}
                        onClick={() => setActiveTab("marketplace")}
                    >
                        MarketPlace
                    </button>
                    <button
                        className={`text-left px-4 py-2 rounded-lg ${activeTab === "company" ? "bg-green-100 font-medium" : "hover:bg-gray-100"
                            }`}
                        onClick={() => setActiveTab("company")}
                    >
                        Company Profile
                    </button>
                    <button className="text-left px-4 py-2 hover:bg-gray-100 rounded-lg text-red-500" onClick={handleLogout}>
                        Sign Out
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Topbar */}
                <header className="flex items-center justify-between bg-white shadow px-6 py-4">
                    <div className="flex items-center w-1/2">
                        <input
                            type="text"
                            placeholder="Search deals..."
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none bg-gray-100"
                        />
                    </div>
                    <div className="relative">
                        <button
                            className="flex items-center gap-2"
                            onClick={() => setProfileDropdownOpen(prev => !prev)}
                        >
                            <span className="font-medium">{userProfile.name || "Loading..."}</span>
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full">
                                {(userProfile.name || "A").charAt(0)}
                            </div>
                        </button>

                        {profileDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-white border rounded-xl shadow-lg p-4 z-50">
                                <div className="flex flex-col gap-3">
                                    {/* Name */}
                                    <div>
                                        <label className="text-sm text-gray-500">Name</label>
                                        <input
                                            type="text"
                                            value={userProfile.name}
                                            readOnly
                                            className="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="text-sm text-gray-500">Email</label>
                                        <input
                                            type="email"
                                            value={userProfile.email}
                                            readOnly
                                            className="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                                        />
                                    </div>


                                    /* Reset Password Button */
                                    <div>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    const res = await axios.post(
                                                        "https://advisor-seller-backend.vercel.app/api/auth/forgot-password",
                                                        { email: userProfile.email },
                                                        { validateStatus: () => true }
                                                    );

                                                    if (res.status === 200 || res.status === 201) {
                                                        // Show success toast with controlled duration
                                                        toast.success(res.data?.message || "Check your email to reset your password", {
                                                            duration: 2000,
                                                            id: "reset-password-success"
                                                        });

                                                        // Wait for toast to display fully before redirect
                                                        setTimeout(() => {
                                                            window.location.href = "/seller-login";
                                                        }, 2000);
                                                    } else {
                                                        // Show error toast but DON'T redirect
                                                        toast.error(res.data?.message || "Failed to send reset link. Please try again.");
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    // Show network error toast but DON'T redirect
                                                    toast.error("Network error. Please try again later.");
                                                }
                                            }}
                                            className="w-full mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition flex items-center justify-center gap-2"
                                        >
                                            <span>Reset Password</span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 4v16m8-8H4"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                </header>

                {/* Tabs Content */}
                <div className="px-6 py-4 overflow-y-auto">

                    {/* Pending Tab: Matched Advisors */}
                    {activeTab === "pending" && (
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Matched Advisors</h3>
                                <select
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value);
                                        fetchMatches(e.target.value);
                                    }}
                                    className="border rounded px-2 py-1"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="years">Years</option>
                                    <option value="company">Company</option>
                                </select>
                            </div>

                            {matchesLoading ? (
                                <div className="text-center py-10 text-gray-500">Loading matches...</div>
                            ) : matches.length === 0 ? (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg text-center space-y-4">
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        No Advisor Matches Yet
                                    </h3>
                                    <p className="text-gray-700">
                                        Great opportunities are on their way! While we currently don't have matching advisors for your profile, keep your details up-to-date and stay tuned. We are committed to finding the perfect matches for you.
                                    </p>
                                    <button
                                        onClick={() => fetchMatches(sortBy)}
                                        className="mt-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                                    >
                                        Refresh Matches
                                    </button>
                                </div>
                            ) : (
                                <ul className="space-y-4">
                                    {matches.map((advisor) => (
                                        <li
                                            key={advisor.id || advisor._id}
                                            className="border p-4 rounded-lg bg-white shadow hover:shadow-md transition"
                                        >
                                            <h4 className="font-semibold text-lg">{advisor.name}</h4>
                                            <p className="text-gray-600">{advisor.description}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* MarketPlace */}
                    {activeTab === "marketplace" && (
                        <div className="bg-gray-50 text-center text-gray-500 py-20 rounded-lg border">
                            <p>Marketplace content coming soon...</p>
                        </div>
                    )}

                    {/* Company Profile Form - Enhanced with Seller Form Components */}
                    {activeTab === "company" && (
                        <div className="w-full max-w-5xl bg-white shadow-lg rounded-2xl p-8">
                            <h2 className="text-4xl font-bold text-center mb-6">Update Seller Profile</h2>

                            <Formik
                                enableReinitialize
                                initialValues={enhancedInitialValues}
                                validationSchema={SellerSchema}
                                onSubmit={handleEnhancedSubmit}
                            >
                                {({ isSubmitting, setFieldValue }) => (
                                    <Form className="flex flex-col gap-4">



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
                                            <AnimatedInput name="annualRevenue" type="number" placeholder="Annual Revenue" prefix="$" />
                                            <ErrorMessage name="annualRevenue" component="p" className="text-red-500 text-sm mt-1" />

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
                                            className="w-full h-12 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                        >
                                            {isSubmitting ? "Updating..." : "Update Profile"}
                                        </button>
                                    </Form>
                                )}
                            </Formik>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SellerDashboard;