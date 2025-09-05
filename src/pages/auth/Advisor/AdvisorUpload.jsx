import React, { useState } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

// =================== Advisor Upload Page ===================
const AdvisorUpload = () => {
    const [logoFile, setLogoFile] = useState(null);

    // ✅ Use Array.from instead of fill (to avoid shared references)
    const initialValues = {
        logoFile: null,
        testimonials: Array.from({ length: 5 }, () => ({
            clientName: "",
            testimonial: "",
            pdfFile: null,
        })),
    };

    const validationSchema = Yup.object().shape({
        logoFile: Yup.mixed().required("Logo is required"),
        testimonials: Yup.array()
            .of(
                Yup.object().shape({
                    clientName: Yup.string().notRequired(),
                    testimonial: Yup.string().when("clientName", {
                        is: (val) => !!val && val.trim() !== "",
                        then: (schema) => schema.required("Testimonial required"),
                        otherwise: (schema) => schema.notRequired(),
                    }),
                    pdfFile: Yup.mixed().when("clientName", {
                        is: (val) => !!val && val.trim() !== "",
                        then: (schema) => schema.required("PDF required"),
                        otherwise: (schema) => schema.notRequired(),
                    }),
                })
            )
            .test(
                "at-least-one",
                "At least one testimonial is required",
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
            const token = localStorage.getItem("access_token");
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
            
            // Redirect to dashboard after success
            setTimeout(() => {
                window.location.href = '/advisor-dashboard';
            }, 2000);
        } catch (error) {
            console.error(error);
            toast.error("Error submitting form. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto p-6 bg-white shadow-xl rounded-2xl"
        >
            <h2 className="text-2xl font-bold mb-4">Upload Logo & Testimonials</h2>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={onSubmit}
            >
                {({ isSubmitting, setFieldValue, values }) => (
                    <Form className="space-y-4">
                        {/* Logo Upload */}
                        <div>
                            <label>Logo Upload</label>
                            <input
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setLogoFile(file);
                                        setFieldValue("logoFile", file);
                                    }
                                }}
                            />
                            <ErrorMessage
                                name="logoFile"
                                component="div"
                                className="text-red-500 text-sm mt-1"
                            />
                        </div>

                        {/* Testimonials */}
                        <FieldArray name="testimonials">
                            {() => {
                                const completedTestimonials = values.testimonials.filter(
                                    (t) => t.clientName && t.testimonial && t.pdfFile
                                ).length;

                                return (
                                    <div>
                                        <label className="block mb-2">
                                            Testimonials ({completedTestimonials}/5 completed)
                                        </label>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                            {values.testimonials.map((_, index) => (
                                                <div
                                                    key={index}
                                                    className="p-3 border rounded-lg bg-gray-50"
                                                >
                                                    <div className="text-sm font-medium mb-2">
                                                        Testimonial {index + 1}
                                                    </div>

                                                    <Field
                                                        name={`testimonials.${index}.clientName`}
                                                        placeholder="Client Name"
                                                        className="w-full p-2 border rounded mb-2 text-sm"
                                                    />
                                                    <Field
                                                        as="textarea"
                                                        name={`testimonials.${index}.testimonial`}
                                                        placeholder="Testimonial"
                                                        rows="3"
                                                        className="w-full p-2 border rounded mb-2 text-sm"
                                                    />
                                                    <input
                                                        type="file"
                                                        accept="application/pdf"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                setFieldValue(
                                                                    `testimonials.${index}.pdfFile`,
                                                                    file
                                                                );
                                                            }
                                                        }}
                                                        className="w-full text-xs"
                                                    />

                                                    {values.testimonials[index].pdfFile && (
                                                        <span className="text-green-600 text-xs mt-1 block">
                                                            PDF selected: {values.testimonials[index].pdfFile.name}
                                                        </span>
                                                    )}

                                                    <ErrorMessage
                                                        name={`testimonials.${index}.clientName`}
                                                        component="div"
                                                        className="text-red-500 text-xs mt-1"
                                                    />
                                                    <ErrorMessage
                                                        name={`testimonials.${index}.testimonial`}
                                                        component="div"
                                                        className="text-red-500 text-xs"
                                                    />
                                                    <ErrorMessage
                                                        name={`testimonials.${index}.pdfFile`}
                                                        component="div"
                                                        className="text-red-500 text-xs"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }}
                        </FieldArray>

                        {/* Final Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700"
                        >
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </button>
                    </Form>
                )}
            </Formik>
        </motion.div>
    );
};

export default AdvisorUpload;