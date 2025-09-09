import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Use Link and useNavigate for better routing

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // Scroll effect to change header appearance
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle login/register based on user status
  const handleMemberLogin = () => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/"); // Use navigate for in-app routing
    } else {
      navigate("/authRegister");
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 border-b border-gray-200 shadow-lg"
          : "bg-gradient-to-r from-gray-100 via-gray-50 to-white/80 border-b border-gray-100 shadow"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 w-full">
          {/* Logo Section */}
          <div>
            <Link to="/" className="flex items-center">
              <img
                src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop,q=95/mk3JaNVZEltBD9g4/logo-transparency-mnlJLXr4jxIOR470.png"
                alt="Advisor Chooser logo"
                className="h-14 w-auto object-contain transition-all duration-300"
              />
            </Link>
          </div>

          {/* Navigation & Login Section */}
          <nav className="flex items-center space-x-6">
            {/* Member Login Button */}
            <button
              onClick={handleMemberLogin}
              className="bg-gradient-to-r from-third to-primary text-white font-semibold text-lg py-3 px-8 rounded-full shadow-lg hover:bg-third transition duration-300 ease-in-out"
            >
              Member Login
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;