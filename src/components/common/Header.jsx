import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll effect to change header appearance
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle login/register based on user status
  const handleMemberLogin = () => {
    navigate("/authRegister");
    setIsMobileMenuOpen(false);
  };

  // Handle logo click
  const handleLogoClick = () => {
    // In your actual app, replace this with navigation to home
    // navigate("/");
    window.location.href = "https://www.advisorchooser.com";
    console.log("Logo clicked - navigate to home");
  };


  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg"
          : "bg-gradient-to-r from-gray-100 via-gray-50 to-white/80 backdrop-blur-sm border-b border-gray-100 shadow"
      }`}
    >
      <div className="container px-4 mx-auto sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full h-16 sm:h-18 lg:h-20">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <button
              onClick={handleLogoClick}
              className="flex items-center group"
            >
              <img
                src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop,q=95/mk3JaNVZEltBD9g4/logo-transparency-mnlJLXr4jxIOR470.png"
                alt="Advisor Chooser logo"
                className="object-contain w-auto h-8 transition-all duration-300 sm:h-10 lg:h-12 group-hover:scale-105"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
