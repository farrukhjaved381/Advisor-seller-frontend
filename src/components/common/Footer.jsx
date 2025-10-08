import React from "react";
import { FaLinkedin } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-[#132328] text-white py-10">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 pl-[30rem] text-center md:text-left">
          {/* Quick Links */}
          <div>
            <h3 className="text-teal-400 font-semibold mb-4">QUICK LINKS</h3>
            <ul className="space-y-2">
              <li><a href="https://cimamplify.com/#Benefits" className="hover:text-teal-300 cursor-pointer">Benefits</a></li>
              <li><a href="https://cimamplify.com/#How%20it%20Works" className="hover:text-teal-300 cursor-pointer">How it Works</a></li>
              <li><a href="https://cimamplify.com/#Guidelines" className="hover:text-teal-300 cursor-pointer">Guidelines</a></li>
              <li><a href="https://cimamplify.com/#FAQs" className="hover:text-teal-300 cursor-pointer">FAQs</a></li>
              <li><a href="https://cimamplify.com/about" className="hover:text-teal-300 cursor-pointer">About</a></li>
              <li><a href="https://cimamplify.com/contact" className="hover:text-teal-300 cursor-pointer">Contact</a></li>
            </ul>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-teal-400 font-semibold mb-4">ACTIONS</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-teal-300 cursor-pointer">Buyer Registration</a></li>
              <li><a href="https://cimamplify.com/Advisor%20Registration" className="hover:text-teal-300 cursor-pointer">Add a Deal</a></li>
              <li><a href="#" className="hover:text-teal-300 cursor-pointer">Buyer Login</a></li>
              <li><a href="https://cimamplify.com/Advisor%20Registration" className="hover:text-teal-300 cursor-pointer">See the best Advisors</a></li>
            </ul>

            <div className="flex gap-4 text-2xl relative top-5">
              <a href="https://www.linkedin.com/company/cimamplify/" className="p-2 rounded-full border border-white hover:border-teal-400 hover:text-teal-400 transition">
                <FaLinkedin />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div 
            id="copyright" 
            className="flex flex-col justify-between items-end md:items-start text-end min-h-full"
          >
            <span className="text-gray-400 text-sm mt-auto">
              © 2025 CIM Amplify. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
