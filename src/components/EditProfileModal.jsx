import React from "react";
import { Formik, Form, Field, ErrorMessage, useFormikContext } from "formik";
import * as Yup from "yup";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { rawGeographyData } from './Static/geographyData';
import { rawIndustryData } from './Static/industryData';
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

// Marks all error fields as touched after submit so messages render
const ValidationTouched = ({ submitCount, errors, setTouched }) => {
    React.useEffect(() => {
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
        }
    }, [submitCount]);
    return null;
};

const SellerSchema = Yup.object().shape({
    companyName: Yup.string()
        .min(2, "Company name must be at least 2 characters")
        .max(100, "Company name must not exceed 100 characters")
        .required("Company name is required"),
    phone: Yup.string()
        .matches(/^\+?[1-9]\d{1,14}$/, "Enter a valid phone number with country code")
        .min(10, "Phone number must be at least 10 digits")
        .required("Phone is required"),
    website: Yup.string()
        .matches(/^https?:\/\/.+\..+/, "Website must be a valid URL (https://example.com)")
        .url("Enter a valid website URL")
        .required("Website is required"),
    industry: Yup.string()
        .min(1, "Please select an industry")
        .required("Industry is required"),
    geography: Yup.string()
        .min(1, "Please select a geography")
        .required("Geography is required"),
    annualRevenue: Yup.number()
        .nullable()
        .transform(value => (isNaN(value) || value === null || value === '' ? null : value))
        .min(1000, "Annual revenue must be at least $1,000")
        .max(999999999, "Annual revenue is too large")
        .required("Annual revenue is required")
        .typeError("Annual revenue must be a valid number"),
    currency: Yup.string()
        .oneOf(["USD", "PKR", "EUR", "GBP"], "Please select a valid currency")
        .required("Currency is required"),
    description: Yup.string()
        .min(20, "Description must be at least 20 characters")
        .max(1000, "Description must not exceed 1000 characters")
        .matches(/^(?!\s*$).+/, "Description cannot be empty or just whitespace")
        .required("Description is required"),
});

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

const EditProfileModal = ({ isOpen, onClose, profile, onProfileUpdate }) => {
    const initialValues = {
        companyName: profile.companyName || "",
        phone: profile.phone || "",
        website: profile.website || "",
        industry: profile.industry || "",
        geography: profile.geography || "",
        annualRevenue: profile.annualRevenue || "",
        currency: profile.currency || "USD",
        description: profile.description || "",
    };

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const token = localStorage.getItem("access_token");
            await axios.patch(
                "https://api.advisorchooser.com/docs/api/sellers/profile",
                values,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            toast.success("Profile updated successfully");
            onProfileUpdate();
            onClose();
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to update profile"
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                >
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="bg-white rounded-lg shadow-xl p-8 w-full max-w-4xl"
                    >
                        <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
                        <Formik
                            initialValues={initialValues}
                            validationSchema={SellerSchema}
                            onSubmit={handleSubmit}
                        >
                            {({ isSubmitting, errors, submitCount, setTouched }) => (
                                <Form className="flex flex-col gap-4">
                                    {submitCount > 0 && Object.keys(errors || {}).length > 0 && (
                                        <div className="mb-2 p-2 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
                                            Please fix {Object.keys(errors).length} highlighted field{Object.keys(errors).length>1?'s':''}.
                                        </div>
                                    )}
                                    <ValidationTouched submitCount={submitCount} errors={errors} setTouched={setTouched} />
                                    <AnimatedInput name="companyName" placeholder="Company Name" />
                                    <AnimatedInput name="phone" placeholder="Phone" />
                                    <AnimatedInput name="website" placeholder="Website" />
                                    <div className="w-full flex flex-col space-y-4">
                                        <div className="flex items-end justify-between">
                                            <h3 className="block text-sm font-bold text-gray-700">Revenue Size Range</h3>
                                            <div className="w-24">
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
                                    </div>
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
                                    <div className="flex justify-end space-x-4">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                        >
                                            {isSubmitting ? "Updating..." : "Update Profile"}
                                        </button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EditProfileModal;
