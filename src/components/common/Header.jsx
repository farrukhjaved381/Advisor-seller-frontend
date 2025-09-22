import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Scroll effect to change header appearance
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle login/register based on user status
  const handleMemberLogin = () => {
    navigate("/seller-login");
    setIsMobileMenuOpen(false);
  };

  // Handle logo click
  const handleLogoClick = () => {
    // In your actual app, replace this with navigation to home
    console.log("Logo clicked - navigate to home");
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg"
          : "bg-gradient-to-r from-gray-100 via-gray-50 to-white/80 backdrop-blur-sm border-b border-gray-100 shadow"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20 w-full">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <button onClick={handleLogoClick} className="flex items-center group">
              <img
                src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=768,fit=crop,q=95/mk3JaNVZEltBD9g4/logo-transparency-mnlJLXr4jxIOR470.png"
                alt="Advisor Chooser logo"
                className="h-8 sm:h-10 lg:h-12 w-auto object-contain transition-all duration-300 group-hover:scale-105"
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={handleMemberLogin}
              className="bg-gradient-to-r from-primary to-third  text-white font-semibold text-sm lg:text-base py-2.5 px-6 lg:py-3 lg:px-8 rounded-full shadow-lg hover:shadow-xl "
            >
              See Best Advisors
              </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              <svg
                className={`h-6 w-6 transition-transform duration-300 ${
                  isMobileMenuOpen ? "rotate-90" : "rotate-0"
                }`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            isMobileMenuOpen 
              ? "max-h-96 opacity-100 pb-4" 
              : "max-h-0 opacity-0 pb-0"
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-100 mt-2">
            <button
              onClick={handleMemberLogin}
              className="w-full bg-gradient-to-r from-third to-primary text-white font-semibold text-base py-3 px-6 rounded-full shadow-lg hover:shadow-xl hover:bg-third transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out"
            >
              See Best Advisors
              </button>
          </div>
        </div>
      </div>

     
    </header>
  );
};

export default Header;
