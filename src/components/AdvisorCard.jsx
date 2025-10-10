import React from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { FaBuilding, FaUser, FaGlobe, FaPhone, FaMapMarkerAlt, FaIndustry, FaDollarSign, FaAward, FaQuoteLeft, FaExternalLinkAlt, FaChartLine } from 'react-icons/fa';

const AdvisorCard = ({ advisor, onSelect, isSelected }) => {
  const [loading, setLoading] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);
  const [expandedTestimonials, setExpandedTestimonials] = React.useState({});

  const toggleTestimonial = (idx) => {
    setExpandedTestimonials((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };
  
  const handleRequestIntroduction = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      await axios.post(
        'http://localhost:3000/api/connections/introduction',
        { advisorIds: [advisor.id] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`📧 Introduction email sent to ${advisor.companyName}!`);
    } catch (error) {
      toast.error('Failed to send introduction request');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="w-full max-w-sm overflow-hidden transition-all duration-300 bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-2xl hover:scale-[1.02] group sm:max-w-md lg:max-w-lg xl:max-w-xl">
      {/* Header Section */}
      <div className="relative p-5 border-b border-gray-100 bg-gradient-to-r from-primary/10 to-third/10 sm:p-7">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-center flex-1 min-w-0 gap-4 sm:gap-5">
            <div className="relative flex-shrink-0">
              {advisor.logoUrl ? (
                <img 
                  className="object-contain bg-white border-2 border-white shadow-lg w-14 h-14 sm:w-18 sm:h-18 rounded-2xl" 
                  src={advisor.logoUrl} 
                  alt={advisor.companyName}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-primary to-third flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg ${advisor.logoUrl ? 'hidden' : 'flex'}`}>
                {advisor.companyName?.charAt(0) || 'A'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="mb-2 text-xl font-semibold tracking-tight text-gray-900 truncate sm:text-2xl">{advisor.companyName}</h3>
              <div className="flex items-center mb-2 text-gray-600">
                <FaUser className="w-4 h-4 mr-2 text-primary" />
                <span className="text-base font-medium truncate">{advisor.advisorName}</span>
              </div>
              <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-2">
                <div className="flex items-center">
                  <FaAward className="w-4 h-4 mr-1 text-yellow-500" />
                  <span>{advisor.yearsExperience} yrs</span>
                </div>
                <div className="flex items-center">
                  <FaChartLine className="w-4 h-4 mr-1 text-green-500" />
                  <span>{advisor.numberOfTransactions} deals</span>
                </div>
                {advisor.phone && (
                  <div className="flex items-center">
                    <FaPhone className="w-4 h-4 mr-1 text-primary" />
                    <span className="truncate max-w-[120px] sm:max-w-[180px]">{advisor.phone}</span>
                  </div>
                )}
                {advisor.advisorEmail && (
                  <div className="flex items-center">
                    <FaUser className="w-4 h-4 mr-1 text-primary" />
                    <span className="truncate max-w-[120px] sm:max-w-[180px]">{advisor.advisorEmail}</span>
                  </div>
                )}
                {advisor.website && (
                  <div className="flex items-center">
                    <FaGlobe className="w-4 h-4 mr-1 text-primary" />
                    <a href={advisor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-third transition-colors inline-flex items-center truncate max-w-[120px] sm:max-w-[180px]">
                      <span className="truncate">{advisor.website}</span>
                      <FaExternalLinkAlt className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>
              {advisor.workedWithCimamplify && (
                <div className="inline-flex items-center gap-2 px-3 py-2 mt-4 text-indigo-700 border border-indigo-200 rounded-lg bg-indigo-50">
                  <img
                    src="/logo.png"
                    alt="CIM Amplify"
                    className="w-auto h-5"
                  />
                  <span className="text-sm font-semibold">
                    This Advisor uses CIM Amplify to find more buyers
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center ml-auto">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-5 h-5 transition-colors border-gray-300 rounded form-checkbox text-primary focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-5 sm:p-7 sm:space-y-6">
        {/* Description */}
        <div>
          <p className="text-base leading-relaxed text-gray-700">{advisor.description}</p>
        </div>

        {/* Intro Video */}
        {advisor.introVideoUrl && (
          <div>
            <div className="flex items-center mb-3">
              <h4 className="text-base font-semibold text-gray-900">Introduction Video</h4>
            </div>
            <div className="overflow-hidden bg-black border border-gray-200 rounded-lg">
              <video src={advisor.introVideoUrl} controls className="object-contain w-full h-40 bg-black rounded-lg sm:h-56" />
            </div>
          </div>
        )}

        {/* Testimonials */}
        {Array.isArray(advisor.testimonials) && advisor.testimonials.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <FaQuoteLeft className="w-5 h-5 mr-2 text-primary" />
              <h4 className="text-base font-semibold text-gray-900">Client Testimonials</h4>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {advisor.testimonials.map((t, idx) => {
                const text = t?.testimonial || '';
                const isLong = text.length > 220;
                const expanded = !!expandedTestimonials[idx];
                const visible = expanded || !isLong ? text : `${text.substring(0, 220)}…`;
                const initial = (t?.clientName || 'C').charAt(0).toUpperCase();
                return (
                  <div key={idx} className="overflow-hidden transition-shadow border border-gray-200 shadow-sm bg-gray-50 rounded-xl hover:shadow-md">
                    <div className="flex items-center gap-4 px-5 pt-5">
                      <div className="flex items-center justify-center w-10 h-10 text-base font-bold text-white rounded-full bg-gradient-to-br from-primary to-third">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-gray-900 truncate">{t?.clientName || 'Client'}</p>
                      </div>
                    </div>
                    <div className="px-5 pb-5">
                      <p className="mt-3 text-base text-gray-700">
                        {visible}
                      </p>
                      {isLong && (
                        <button
                          type="button"
                          onClick={() => toggleTestimonial(idx)}
                          className="mt-3 text-sm font-semibold text-primary hover:text-third"
                        >
                          {expanded ? 'Read less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-4 border-t border-gray-100 sm:px-7 sm:py-5 bg-gray-50">
        {/* <button
          onClick={handleRequestIntroduction}
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-third text-white py-2.5 sm:py-3 px-4 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
        >
          {loading ? (
            <>
              <svg className="w-3 h-3 animate-spin sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <FaUser className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Request Introduction</span>
              <span className="sm:hidden">Request Intro</span>
            </>
          )}
        </button> */}
      </div>
    </div>
  );
};

export default AdvisorCard;