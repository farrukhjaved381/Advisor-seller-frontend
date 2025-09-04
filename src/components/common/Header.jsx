import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Header = () => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const navigate = useNavigate();

    const navLinks = [
        { label: "Benefits", href: "https://cimamplify.com/#Benefits" },
        { label: "How it Works", href: "https://cimamplify.com/#How%20it%20Works" },
        { label: "Guidelines", href: "https://cimamplify.com/#Guidelines" },
        { label: "FAQs", href: "https://cimamplify.com/#FAQs" },
    ];

    // 🔹 Handle Member Login click
    const handleMemberLogin = () => {
        const user = localStorage.getItem("user"); // or use your API logic

        if (user) {
            // user already registered
            navigate("/");
        } else {
            // user not registered
            navigate("/authRegister");
        }
    };

    return (
        <div className="bg-white/70 backdrop-blur w-full flex-wrap min-w-[50%] h-16 fixed top-0 left-0 z-50 flex justify-around whitespace-nowrap items-center border-b-[0.1rem] border-b-gray-400 font-poppins">
            {/* Logo */}
            <div className="h-full w-[13%] min-w-[8%] flex justify-center items-center">
                <a href="https://cimamplify.com/" target="_blank" rel="noopener noreferrer">
                    <img
                        src="src/assets/fullLogo.svg"
                        alt="logo"
                        className="object-contain h-10 cursor-pointer"
                    />
                </a>
            </div>

            {/* Navbar */}
            <div className="h-full w-[35%] flex justify-between items-center">
                <div
                    className="flex w-full flex-nowrap whitespace-nowrap h-full justify-between items-center space-x-4 relative"
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    {/* Links */}
                    {navLinks.map((link, index) => (
                        <div
                            key={index}
                            className="relative flex flex-col items-center"
                            onMouseEnter={() => setHoveredIndex(index)}
                        >
                            <a
                                href={link.href}
                                className="text-lg font-semibold text-[#616a76] transition-all duration-300 hover:text-primary hover:text-xl"
                            >
                                {link.label}
                            </a>

                            {/* Slider */}
                            {hoveredIndex === index && (
                                <motion.span
                                    layoutId="navbar-slider"
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 25,
                                        mass: 1.2,
                                    }}
                                    className="absolute -bottom-5 h-[4px] w-full bg-primary rounded-full origin-center"
                                />
                            )}
                        </div>
                    ))}

                    {/* Button */}
                    <div className="h-[70%] max-w-[25%] min-w-[25%] bg-primary text-white font-semibold text-lg flex justify-center items-center rounded-md hover:scale-105 transition-transform duration-200 px-2 hover:drop-shadow-lg">
                        <button onClick={handleMemberLogin}>Member Login</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
