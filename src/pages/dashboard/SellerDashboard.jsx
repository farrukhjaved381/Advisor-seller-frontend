"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import AdvisorCard from "../../components/AdvisorCard"
import toast, { Toaster } from "react-hot-toast"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik"
import { rawGeographyData } from "../../components/Static/geographyData"
import { rawIndustryData } from "../../components/Static/industryData"
import { FaChevronDown, FaChevronRight } from "react-icons/fa"
import EditProfileModal from "../../components/EditProfileModal"

// Map selected industry id to top-level industry label
const mapIndustry = (selectedId) => {
  for (const category of rawIndustryData) {
    if (category.id === selectedId) return category.label
    if (category.children) {
      const child = category.children.find((c) => c.id === selectedId)
      if (child) return category.label // return parent label
    }
  }
  return "Technology" // fallback
}

// Map selected geography id to top-level geography label
const mapGeography = (selectedId) => {
  for (const country of rawGeographyData) {
    if (country.id === selectedId) return country.label
    if (country.children) {
      const child = country.children.find((c) => c.id === selectedId)
      if (child) return country.label // return parent label
    }
  }
  return "North America" // fallback
}

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
      <ErrorMessage name={name} component="p" className="text-red-500 text-sm mt-1" />
    </div>
  )
}

const RadioFilter = ({ title, data, fieldName, currentValue }) => {
  const { values, setFieldValue } = useFormikContext()
  const [query, setQuery] = useState("")
  const [collapsedParents, setCollapsedParents] = useState(new Set(data.map((item) => item.id)))
  const [visibleDescriptions, setVisibleDescriptions] = useState(new Set())

  // Function to find the selected item ID from the current value
  const findSelectedId = (searchValue) => {
    if (!searchValue) return null

    for (const category of data) {
      // Check if current value matches this category
      if (category.label === searchValue || category.id === searchValue) {
        return category.id
      }

      // Check children
      if (category.children) {
        for (const child of category.children) {
          if (child.label === searchValue || child.id === searchValue) {
            return child.id
          }
        }
      }
    }
    return null
  }

  const selectedId = findSelectedId(currentValue || values[fieldName])

  const handleToggleCollapse = (item) => {
    setCollapsedParents((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(item.id)) newSet.delete(item.id)
      else newSet.add(item.id)
      return newSet
    })
  }

  const handleToggleDescription = (itemId) => {
    setVisibleDescriptions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) newSet.delete(itemId)
      else newSet.add(itemId)
      return newSet
    })
  }

  const filterData = (items, currentQuery) => {
    if (!currentQuery) return items
    const lowerCaseQuery = currentQuery.toLowerCase()
    return items.filter((item) => {
      const itemMatches = item.label.toLowerCase().includes(lowerCaseQuery)
      if (item.children) {
        const filteredChildren = filterData(item.children, currentQuery)
        if (itemMatches || filteredChildren.length > 0) return true
      }
      return itemMatches
    })
  }

  const filteredData = filterData(data, query)

  const renderRadios = (items) => (
    <ul className="list-none space-y-2">
      {items.map((item) => {
        const isItemParent = item.children && item.children.length > 0
        const isCollapsed = collapsedParents.has(item.id)
        const isDescriptionVisible = visibleDescriptions.has(item.id)
        const isSelected = selectedId === item.id

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
                  type="radio"
                  name={fieldName}
                  value={item.id}
                  checked={isSelected}
                  onChange={() => setFieldValue(fieldName, item.id)}
                  className="form-radio h-4 w-4 text-primary focus:ring-primary transition-colors duration-200"
                />
                <span className="ml-2">{item.label}</span>
              </label>
              {fieldName === "industry" && !isItemParent && item.description && (
                <button
                  type="button"
                  onClick={() => handleToggleDescription(item.id)}
                  className="p-1 text-gray-500 hover:text-gray-700 transition"
                >
                  {isDescriptionVisible ? <FaChevronDown /> : <FaChevronRight />}
                </button>
              )}
            </div>
            {fieldName === "industry" && isDescriptionVisible && item.description && (
              <p className="text-xs text-gray-500 mt-1 ml-10 transition-all duration-300 ease-in-out">
                {item.description}
              </p>
            )}
            {isItemParent && !isCollapsed && (
              <ul className="mt-2 pl-4 border-l-2 border-primary/20">{renderRadios(item.children)}</ul>
            )}
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className="w-full">
      {title && <h3 className="block text-sm font-medium mb-2">{title}</h3>}
      {data.length > 5 && (
        <div className="relative mb-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${fieldName}`}
            className="w-full p-2 pr-10 rounded-xl border-[0.15rem] border-primary/30 focus:border-primary focus:outline-none transition"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
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
      )}
      <div className="bg-white max-h-64 overflow-y-auto">
        {filteredData.length > 0 ? (
          renderRadios(filteredData)
        ) : (
          <p className="text-gray-500 text-sm">No results found for "{query}".</p>
        )}
      </div>

      <ErrorMessage name={fieldName} component="p" className="text-red-500 text-sm mt-1" />
    </div>
  )
}

const SellerDashboard = () => {
  // Logout handler
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("access_token")
      await axios.post(
        "https://advisor-seller-backend.vercel.app/api/auth/logout",
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
    } catch (err) {
      // optionally handle errors
    } finally {
      // Clear cookies
      if (typeof document !== "undefined") {
        const cookies = document.cookie.split(";")
        for (const cookie of cookies) {
          const eqPos = cookie.indexOf("=")
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
        }
      }

      // Show toast first
      toast.success("Logged out successfully")

      // Redirect after 1–2 seconds
      setTimeout(() => {
        window.location.href = "/seller-login"
      }, 2000) // 2 seconds
    }
  }

  const [seller, setSeller] = useState(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [sortBy, setSortBy] = useState("newest")
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [userProfile, setUserProfile] = useState({ name: "", email: "", password: "" })

  const [selectedAdvisors, setSelectedAdvisors] = useState([])
  const [introductionRequests, setIntroductionRequests] = useState([])
  const [directContactList, setDirectContactList] = useState([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [introductionLoading, setIntroductionLoading] = useState(false)
  const [directListLoading, setDirectListLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSelectAdvisor = (advisorId) => {
    setSelectedAdvisors((prevSelected) => {
      if (prevSelected.includes(advisorId)) {
        return prevSelected.filter((id) => id !== advisorId)
      } else {
        return [...prevSelected, advisorId]
      }
    })
  }

  const handleBulkIntroduction = async () => {
    if (selectedAdvisors.length === 0) return
    
    try {
      setIntroductionLoading(true)
      const token = localStorage.getItem("access_token")
      
      const response = await axios.post(
        "https://advisor-seller-backend.vercel.app/api/connections/introduction",
        { advisorIds: selectedAdvisors },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      
      toast.success(`📧 Introduction emails sent to ${selectedAdvisors.length} advisors!`)
      setIntroductionRequests([...introductionRequests, ...selectedAdvisors])
      setSelectedAdvisors([])
    } catch (error) {
      toast.error("Failed to send introduction requests")
    } finally {
      setIntroductionLoading(false)
    }
  }

  const handleGetDirectList = async () => {
    try {
      setDirectListLoading(true)
      const token = localStorage.getItem("access_token")
      const response = await axios.post(
        "https://advisor-seller-backend.vercel.app/api/connections/direct-list",
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (response.status === 200 || response.status === 201) {
        const msg = response.data?.message || `Direct contact list sent! ${response.data?.advisorCount || ''} advisors notified.`;
        const sellerEmail = userProfile?.email || profile?.email || "your email";
        toast.success(
          `📧 ${msg}\nCheck your email (${sellerEmail}) for the contact list.`,
          { duration: 5000, id: "direct-list-success" }
        );
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error("No matching advisors found or seller profile not complete")
      } else if (error.response?.status === 429) {
        toast.error("Too many requests. Please try again later.")
      } else {
        toast.error(error.response?.data?.message || "Failed to request direct list")
      }
    } finally {
      setDirectListLoading(false)
    }
  }

  // Fetch core profile fields (name, email) from API, merge with localStorage for other fields (not name/email)
  const [profile, setProfile] = useState({})

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("access_token")
        if (!token) return

        const res = await axios.get("https://advisor-seller-backend.vercel.app/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.status === 200 && res.data) {
          // Only keep name and email, ignore password
          setUserProfile({
            name: res.data.name,
            email: res.data.email,
          })
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err)
      }
    }
    fetchUserProfile()
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("access_token")

        // Get user auth data
        const authRes = await axios.get("https://advisor-seller-backend.vercel.app/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })

        let combinedProfile = {
          id: authRes.data.id,
          name: authRes.data.name,
          email: authRes.data.email,
          role: authRes.data.role,
          isEmailVerified: authRes.data.isEmailVerified,
        }

        // Try to get seller profile from database
        try {
          const sellerRes = await axios.get("https://advisor-seller-backend.vercel.app/api/sellers/profile", {
            headers: { Authorization: `Bearer ${token}` },
          })

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
            }
          }
        } catch (sellerErr) {
          // If no seller profile exists, use empty values
          console.log("No seller profile found in database")
        }

        setProfile(combinedProfile)
      } catch (err) {
        console.error("Error fetching profile from API:", err)
      }
    }
    fetchProfile()
  }, [profileRefreshTrigger])

  const fetchMatches = async (sort = "newest") => {
    try {
      setMatchesLoading(true)
      const token = localStorage.getItem("access_token")
      if (!token) {
        toast.error("No token found, please log in again.")
        return
      }

      const res = await axios.get(`https://advisor-seller-backend.vercel.app/api/sellers/matches?sortBy=${sort}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 200 && res.data) {
        setMatches(res.data)
      } else {
        setMatches([])
        toast.error(res.data?.message || "Failed to fetch matches")
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch matches")
    } finally {
      setMatchesLoading(false)
    }
  }

  // Fetch seller profile
  const fetchSeller = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      if (!token) {
        toast.error("No token found, please log in again.")
        return
      }

      const res = await axios.get("https://advisor-seller-backend.vercel.app/api/sellers/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 200 && res.data) {
        setSeller(res.data)
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
        }))
        toast.success("Seller profile loaded successfully", { id: "profile-toast" })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch seller profile", { id: "profile-error" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeller()
    fetchMatches(sortBy)
  }, [profileRefreshTrigger])

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
    industry: Yup.string().min(1, "Please select an industry").required("Industry selection is required"),
    geography: Yup.string().min(1, "Please select a geography").required("Geography selection is required"),
    annualRevenue: Yup.number()
      .nullable()
      .transform((value) => (isNaN(value) || value === null || value === "" ? null : value))
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
  })

  // Enhanced submit handler with auto-refresh
  const handleEnhancedSubmit = async (values, { setSubmitting }) => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token) {
        toast.error("Unauthorized! Please log in again.")
        return
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
      }

      const res = await axios.patch("https://advisor-seller-backend.vercel.app/api/sellers/profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true,
      })

      if (res.status === 200) {
        toast.success("Seller profile updated successfully")

        // Update localStorage with new data
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
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
          }

          localStorage.setItem("user", JSON.stringify(updatedUser))
        }

        // Force refresh data and profile
        setProfileRefreshTrigger((prev) => prev + 1)

        // Auto-refresh page after 1 second
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast.error(res.data?.message || "Failed to update profile")
      }
    } catch (err) {
      console.error("Error updating seller profile:", err)
      toast.error("Something went wrong. Please try again later.")
    } finally {
      setSubmitting(false)
    }
  }

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
        const token = localStorage.getItem("access_token")
        await axios.patch("https://advisor-seller-backend.vercel.app/api/sellers/profile", values, {
          headers: { Authorization: `Bearer ${token}` },
        })
        toast.success("Profile updated successfully")
        await fetchSeller()
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to update profile")
      }
    },
  })

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
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:static inset-y-0 left-0 z-30 w-72 bg-white flex flex-col border-r border-gray-200 shadow-sm transition-transform duration-300 ease-in-out
      `}>
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between lg:justify-center mb-4">
            <img
              src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w-768,fit=crop,q=95/mk3JaNVZEltBD9g4/logo-transparency-mnlJLXr4jxIOR470.png"
              alt="Advisor Chooser"
              className="h-8 w-auto object-contain"
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-6">
          <div className="space-y-6">
            {/* Main Menu */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Main Menu</p>

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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <div>
                    <span className="font-medium text-sm">Dashboard</span>
                    <p className="text-xs opacity-70">View matched advisors</p>
                  </div>
                </div>
                {matches.length > 0 && (
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      activeTab === "pending" ? "bg-white/20" : "bg-gradient-to-r from-third to-primary text-white"
                    }`}
                  >
                    {matches.length}
                  </span>
                )}
              </button>
            </div>

            {/* Settings */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Settings</p>

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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <span className="font-medium text-sm">Profile</span>
                  <p className="text-xs opacity-70">Update your information</p>
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-6 border-t border-gray-100 space-y-4">
          

          {/* Sign Out */}
          <button
            className="w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center justify-center space-x-2 border border-red-200 hover:border-red-300"
            onClick={handleLogout}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between bg-white/95 backdrop-blur-sm shadow-lg border-b border-primary/10 px-4 lg:px-8 py-4 lg:py-6 relative overflow-hidden">
          {/* Background Accent */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-third/5"></div>
          
          {/* Left Section */}
          <div className="flex items-center space-x-4 relative z-10">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">Seller Dashboard</h1>
          </div>
          
          {/* Profile Section */}
          <div className="relative z-10">
            <button
              className="flex items-center gap-2 lg:gap-4 px-2 lg:px-4 py-2 rounded-xl hover:bg-primary/10 transition-all duration-300 group"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
            >
              <div className="text-right hidden sm:block">
                <span className="block font-semibold text-secondary group-hover:text-primary transition-colors text-sm lg:text-base">
                  {userProfile.name || "Loading..."}
                </span>
                <span className="block text-xs lg:text-sm text-gray-500">Seller Account</span>
              </div>
              <div className="relative">
                <div className="w-8 h-8 lg:w-12 lg:h-12 flex items-center justify-center bg-gradient-to-br from-primary to-third rounded-full text-white font-bold text-sm lg:text-base shadow-lg ring-2 ring-primary/20">
                  {(userProfile.name || "A").charAt(0)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 lg:w-4 lg:h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
            </button>
            {/* Enhanced Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-4 w-72 sm:w-80 bg-white/95 backdrop-blur-sm border border-primary/20 rounded-2xl shadow-2xl p-4 sm:p-6 z-50 animate-fadeIn">
                <div className="flex flex-col gap-4">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                    <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-primary to-third rounded-full text-white font-bold text-xl shadow-lg">
                      {(userProfile.name || "A").charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary text-lg">{userProfile.name}</h3>
                      <p className="text-sm text-gray-500">Seller Account</p>
                    </div>
                  </div>
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Name</label>
                    <input
                      type="text"
                      value={userProfile.name}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-gray-600"
                    />
                  </div>
                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                    <input
                      type="email"
                      value={userProfile.email}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-gray-600"
                    />
                  </div>
                  {/* Reset Password Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await axios.post(
                            "https://advisor-seller-backend.vercel.app/api/auth/forgot-password",
                            { email: userProfile.email },
                            { validateStatus: () => true },
                          )
                          if (res.status === 200 || res.status === 201) {
                            toast.success(res.data?.message || "Check your email to reset your password", {
                              duration: 2000,
                              id: "reset-password-success",
                            })
                            setTimeout(() => {
                              window.location.href = "/seller-login"
                            }, 2000)
                          } else {
                            toast.error(res.data?.message || "Failed to send reset link. Please try again.")
                          }
                        } catch (err) {
                          console.error(err)
                          toast.error("Network error. Please try again later.")
                        }
                      }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-primary to-third text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 font-medium transform hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                      </svg>
                      <span>Reset Password</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Tabs Content */}
        <div className="px-4 lg:px-6 py-4 overflow-y-auto flex-1">
          {activeTab === "pending" && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Matched Advisors</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
                    <button
                      onClick={handleBulkIntroduction}
                      disabled={selectedAdvisors.length === 0 || introductionLoading}
                      className="px-6 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-third text-white shadow-lg hover:from-primary/80 hover:to-third/80 hover:scale-105 hover:shadow-xl active:scale-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-0"
                    >
                      {introductionLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="hidden sm:inline">Sending...</span>
                          <span className="sm:hidden">Sending</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">Request Introductions ({selectedAdvisors.length})</span>
                          <span className="sm:hidden">Introductions ({selectedAdvisors.length})</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleGetDirectList}
                      disabled={directListLoading}
                      className="px-6 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-third text-white shadow-lg hover:from-primary/80 hover:to-third/80 hover:scale-105 hover:shadow-xl active:scale-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-0"
                    >
                      {directListLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Direct List</span>
                      )}
                    </button>
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value)
                      fetchMatches(e.target.value)
                    }}
                    className="border rounded px-3 py-2 text-sm w-full sm:w-auto"
                  >
                    <option value="newest">Newest</option>
                    <option value="years">Years</option>
                    <option value="company">Company</option>
                  </select>
                </div>
              </div>

              {matchesLoading ? (
                <div className="text-center py-10 text-gray-500">Loading matches...</div>
              ) : matches.length === 0 ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg text-center space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">No Advisor Matches Yet</h3>
                  <p className="text-gray-700">
                    Great opportunities are on their way! While we currently don't have matching advisors for your
                    profile, keep your details up-to-date and stay tuned. We are committed to finding the perfect
                    matches for you.
                  </p>
                  <button
                    onClick={() => fetchMatches(sortBy)}
                    className="mt-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                  >
                    Refresh Matches
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
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
            <div className="bg-gray-50 p-4 rounded-lg border mt-8">
              <h3 className="text-lg font-semibold mb-4">Introduction Requests Sent</h3>
              <ul>
                {introductionRequests.map((advisorId) => {
                  const advisor = matches.find((m) => m.id === advisorId)
                  return (
                    <li key={advisorId} className="mb-2">
                      <p className="text-gray-700">
                        Introduction request sent to <strong>{advisor ? advisor.companyName : "An Advisor"}</strong>.
                      </p>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Direct Contact List */}
          {directContactList.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border mt-8">
              <h3 className="text-lg font-semibold mb-4">Direct Contact List</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {directContactList.map((advisor) => (
                  <div key={advisor.id} className="bg-white shadow-lg rounded-lg overflow-hidden p-6">
                    <h4 className="text-lg font-semibold text-gray-800">{advisor.companyName}</h4>
                    <p className="text-sm text-gray-600">{advisor.advisorName}</p>
                    <p className="text-sm text-gray-600">{advisor.advisorEmail}</p>
                    <p className="text-sm text-gray-600">{advisor.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "company" && (
            <div className="w-full max-w-4xl mx-auto">
              {/* Header */}
              <div className="bg-white shadow-sm rounded-t-lg border-b border-gray-200 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-third rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
                      <p className="text-gray-600">Update your business information and preferences</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Container */}
              <div className="bg-white shadow-sm rounded-b-lg">
                <Formik
                  enableReinitialize
                  initialValues={enhancedInitialValues}
                  validationSchema={SellerSchema}
                  onSubmit={handleEnhancedSubmit}
                >
                  {({ isSubmitting, values }) => (
                    <Form className="p-8 space-y-8">
                      {/* Company Details Section */}
                      <div className="border-b border-gray-200 pb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          <span>Company Details</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                            <Field
                              name="companyName"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                              placeholder="Enter your company name"
                            />
                            <ErrorMessage name="companyName" component="p" className="text-red-500 text-sm" />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                            <Field
                              name="phone"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                              placeholder="+1 (555) 123-4567"
                            />
                            <ErrorMessage name="phone" component="p" className="text-red-500 text-sm" />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Website *</label>
                            <Field
                              name="website"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                              placeholder="https://www.yourcompany.com"
                            />
                            <ErrorMessage name="website" component="p" className="text-red-500 text-sm" />
                          </div>
                        </div>
                      </div>

                      {/* Financial Information Section */}
                      <div className="border-b border-gray-200 pb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>Financial Information</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Currency *</label>
                            <Field
                              as="select"
                              name="currency"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            >
                              <option value="USD">USD - US Dollar</option>
                              <option value="PKR">PKR - Pakistani Rupee</option>
                              <option value="EUR">EUR - Euro</option>
                              <option value="GBP">GBP - British Pound</option>
                            </Field>
                            <ErrorMessage name="currency" component="p" className="text-red-500 text-sm" />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Annual Revenue *</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                {values.currency === "USD"
                                  ? "$"
                                  : values.currency === "PKR"
                                    ? "₨"
                                    : values.currency === "EUR"
                                      ? "€"
                                      : "£"}
                              </span>
                              <Field
                                name="annualRevenue"
                                type="number"
                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                placeholder="1000000"
                              />
                            </div>
                            <ErrorMessage name="annualRevenue" component="p" className="text-red-500 text-sm" />
                          </div>
                        </div>
                      </div>

                      {/* Business Classification Section */}
                      <div className="border-b border-gray-200 pb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                          <span>Business Classification</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Industry Sector *</label>
                            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-80 overflow-y-auto">
                              <RadioFilter title="" data={rawIndustryData} fieldName="industry" />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Geographic Region *</label>
                            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-80 overflow-y-auto">
                              <RadioFilter title="" data={rawGeographyData} fieldName="geography" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Company Description Section */}
                      <div className="pb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          <label className="block text-sm font-medium text-gray-700">Business Description *</label>
                          <Field
                            as="textarea"
                            name="description"
                            rows="6"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
                            placeholder="Provide a detailed description of your business, products/services, target market, and what makes your company unique. This information helps us match you with the most suitable advisors."
                          />
                          <div className="flex justify-between items-center">
                            <ErrorMessage name="description" component="p" className="text-red-500 text-sm" />
                            <span className="text-xs text-gray-500">
                              {values.description ? values.description.length : 0}/1000 characters
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end pt-6 border-t border-gray-200">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-8 py-3 bg-gradient-to-r from-primary to-third text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2"
                        >
                          {isSubmitting ? (
                            <>
                              <svg
                                className="animate-spin h-5 w-5 text-white"
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
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
            background: '#fff',
            color: '#333',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  )
}

export default SellerDashboard