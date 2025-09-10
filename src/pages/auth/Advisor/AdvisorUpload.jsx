import React, { useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FaUpload, FaFileAlt, FaUser, FaQuoteLeft, FaFilePdf, FaCheckCircle, FaImage, FaPlus, FaTrash } from "react-icons/fa";

// =================== Advisor Upload Page ===================
const AdvisorUpload = () => {
    const [logoFile, setLogoFile] = useState(null);
    
    // Check if user already has complete profile on component mount
    React.useEffect(() => {
        const checkProfile = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const userRes = await axios.get(
                    "https://advisor-seller-backend.vercel.app/api/auth/profile",
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (userRes.data.isProfileComplete) {
                    window.location.href = '/advisor-dashboard';
                }
            } catch (err) {
                // Continue normally if check fails
            }
        };
        
        checkProfile();
    }, []);

    // Start with one testimonial
    const initialValues = {
        logoFile: null,
        testimonials: [{
            clientName: "",
            testimonial: "",
            pdfFile: null,
        }],
    };

    const validationSchema = Yup.object().shape({
        logoFile: Yup.mixed().required("Logo is required"),
        testimonials: Yup.array()
            .of(
                Yup.object().shape({
                    clientName: Yup.string().notRequired(),
                    testimonial: Yup.string().notRequired(),
                    pdfFile: Yup.mixed().notRequired(),
                })
            )
            .min(1, "At least one testimonial is required")
            .max(5, "Maximum 5 testimonials allowed")
            .test(
                "at-least-one-complete",
                "At least one complete testimonial is required",
                (arr) => arr && arr.some((t) => t.clientName && t.testimonial && t.pdfFile)
            ),
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
            const token = localStorage.getItem("access_token");
            
            // Check if profile already exists
            try {
                const userRes = await axios.get(
                    "https://advisor-seller-backend.vercel.app/api/auth/profile",
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (userRes.data.isProfileComplete) {
                    toast.success("Profile already exists! Redirecting to dashboard...");
                    sessionStorage.removeItem("advisor-profile");
                    window.location.href = '/advisor-dashboard';
                    return;
                }
            } catch (err) {
                // Continue with profile creation if check fails
            }

            const profileData = JSON.parse(sessionStorage.getItem("advisor-profile")) || {};

            // 1. Upload logo
            let logoUrl = "";
            if (logoFile) {
                logoUrl = await handleFileUpload(
                    logoFile,
                    "https://advisor-seller-backend.vercel.app/api/upload/logo"
                );
            } else {
                toast.error("Logo is required");
                return;
            }

            // 2. Upload testimonial PDFs
            const testimonials = await Promise.all(
                values.testimonials.map(async (t) => {
                    if (t.clientName && t.testimonial && t.pdfFile) {
                        const pdfUrl = await handleFileUpload(
                            t.pdfFile,
                            "https://advisor-seller-backend.vercel.app/api/upload/testimonial"
                        );
                        return {
                            clientName: t.clientName,
                            testimonial: t.testimonial,
                            pdfUrl,
                        };
                    }
                    return null;
                })
            );

            const filteredTestimonials = testimonials.filter(Boolean);

            if (filteredTestimonials.length === 0) {
                toast.error("At least one testimonial is required");
                return;
            }

            // 3. Final profile submit using JWT authentication
            const payload = {
                ...profileData,
                logoUrl,
                testimonials: filteredTestimonials,
            };

            await axios.post(
                "https://advisor-seller-backend.vercel.app/api/advisors/profile",
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );

            toast.success("Advisor profile created successfully! Redirecting to dashboard...");
            resetForm();
            setLogoFile(null);
            sessionStorage.removeItem("advisor-profile");
            
            // Redirect to dashboard
            window.location.href = '/advisor-dashboard';
        } catch (error) {
            console.error(error);
            if (error.response?.status === 409) {
                toast.success("Profile already exists! Redirecting to dashboard...");
                sessionStorage.removeItem("advisor-profile");
                window.location.href = '/advisor-dashboard';
            } else {
                toast.error("Error submitting form. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-brand to-brand-light py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto p-8 bg-brand-light shadow-2xl rounded-3xl border border-primary/10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-secondary mb-2">Complete Your Profile</h1>
                    <p className="text-secondary/70 text-lg">Upload your logo and client testimonials</p>
                    <div className="w-24 h-1 bg-gradient-to-r from-primary to-third mx-auto mt-4 rounded-full"></div>
                </div>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={onSubmit}
            >
                {({ isSubmitting, setFieldValue, values }) => (
                    <Form className="space-y-8">
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
                                                    setFieldValue("logoFile", file);
                                                }
                                            }}
                                            className="hidden"
                                            id="logo-upload"
                                        />
                                        <label
                                            htmlFor="logo-upload"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer bg-white hover:bg-primary/5 transition-all duration-200"
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
                                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center">
                                                <FaCheckCircle className="text-green-500 mr-2" />
                                                <span className="text-sm text-green-700 font-medium">
                                                    {logoFile.name}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <ErrorMessage
                                        name="logoFile"
                                        component="div"
                                        className="text-red-500 text-sm mt-2"
                                    />
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
                                        (t) => t.clientName && t.testimonial && t.pdfFile
                                    ).length;

                                    return (
                                        <div>
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-xl font-semibold text-secondary flex items-center">
                                                    <FaQuoteLeft className="mr-3 text-primary" />
                                                    Client Testimonials
                                                </h3>
                                                <div className="flex items-center space-x-3">
                                                    <div className="bg-primary/10 px-3 py-1 rounded-full">
                                                        <span className="text-primary font-medium text-sm">
                                                            {completedTestimonials}/{values.testimonials.length} completed
                                                        </span>
                                                    </div>
                                                    {values.testimonials.length < 5 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => push({ clientName: "", testimonial: "", pdfFile: null })}
                                                            className="flex items-center px-3 py-1 bg-primary text-white rounded-full hover:bg-primary/90 transition-all duration-200 text-sm"
                                                        >
                                                            <FaPlus className="mr-1" />
                                                            Add Testimonial
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {values.testimonials.map((testimonial, index) => {
                                                    const isCompleted = testimonial.clientName && testimonial.testimonial && testimonial.pdfFile;
                                                    
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
                                                                    {values.testimonials.length > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => remove(index)}
                                                                            className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                                                        >
                                                                            <FaTrash size={12} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <div>
                                                                    <Field
                                                                        name={`testimonials[${index}].clientName`}
                                                                        placeholder="Client Name"
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-sm bg-white"
                                                                    />
                                                                    <ErrorMessage
                                                                        name={`testimonials[${index}].clientName`}
                                                                        component="div"
                                                                        className="text-red-500 text-xs mt-1"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <Field
                                                                        as="textarea"
                                                                        name={`testimonials[${index}].testimonial`}
                                                                        placeholder="Write the testimonial here..."
                                                                        rows="3"
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-sm bg-white resize-none"
                                                                    />
                                                                    <ErrorMessage
                                                                        name={`testimonials[${index}].testimonial`}
                                                                        component="div"
                                                                        className="text-red-500 text-xs mt-1"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <div className="relative">
                                                                        <input
                                                                            type="file"
                                                                            accept="application/pdf"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files[0];
                                                                                if (file) {
                                                                                    setFieldValue(
                                                                                        `testimonials[${index}].pdfFile`,
                                                                                        file
                                                                                    );
                                                                                }
                                                                            }}
                                                                            className="hidden"
                                                                            id={`pdf-upload-${index}`}
                                                                        />
                                                                        <label
                                                                            htmlFor={`pdf-upload-${index}`}
                                                                            className="flex items-center justify-center w-full py-2 px-3 border border-dashed border-primary/30 rounded-lg cursor-pointer bg-white hover:bg-primary/5 transition-all duration-200"
                                                                        >
                                                                            <FaFilePdf className="mr-2 text-primary" />
                                                                            <span className="text-sm text-secondary">
                                                                                {testimonial.pdfFile ? 'Change PDF' : 'Upload PDF'}
                                                                            </span>
                                                                        </label>
                                                                    </div>

                                                                    {testimonial.pdfFile && (
                                                                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                                                            <div className="flex items-center">
                                                                                <FaFilePdf className="text-green-500 mr-2" />
                                                                                <span className="text-xs text-green-700 truncate">
                                                                                    {testimonial.pdfFile.name}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <ErrorMessage
                                                                        name={`testimonials[${index}].pdfFile`}
                                                                        component="div"
                                                                        className="text-red-500 text-xs mt-1"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                            
                                            <ErrorMessage
                                                name="testimonials"
                                                component="div"
                                                className="text-red-500 text-sm mt-4 text-center"
                                            />
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
                            className="flex justify-center pt-6"
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

export default AdvisorUpload;