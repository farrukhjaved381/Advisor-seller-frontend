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
    <div className="overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-lg rounded-xl hover:shadow-xl group w-96">
      {/* Header Section */}
      <div className="relative p-4 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-third/5 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center flex-1 min-w-0 space-x-3 sm:space-x-4">
            <div className="relative flex-shrink-0">
              {advisor.logoUrl ? (
                <img 
                  className="object-contain w-12 h-12 border-2 border-white shadow-md sm:h-16 sm:w-16 rounded-xl" 
                  src={advisor.logoUrl} 
                  alt={advisor.companyName}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`h-12 w-12 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br from-primary to-third flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md ${advisor.logoUrl ? 'hidden' : 'flex'}`}>
                {advisor.companyName?.charAt(0) || 'A'}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="mb-1 text-lg font-bold text-gray-900 truncate sm:text-xl">{advisor.companyName}</h3>
              <div className="flex items-center mb-1 text-gray-600">
                <FaUser className="flex-shrink-0 w-3 h-3 mr-2 sm:w-4 sm:h-4" />
                <span className="text-sm font-medium truncate sm:text-base">{advisor.advisorName}</span>
              </div>
              <div className="flex flex-wrap items-center text-xs text-gray-500 gap-x-4 gap-y-1 sm:text-sm">
                <div className="flex items-center">
                  <FaAward className="flex-shrink-0 w-3 h-3 mr-1 sm:w-4 sm:h-4" />
                  <span>{advisor.yearsExperience} years</span>
                </div>
                <div className="flex items-center">
                  <FaChartLine className="flex-shrink-0 w-3 h-3 mr-1 sm:w-4 sm:h-4" />
                  <span>{advisor.numberOfTransactions} deals</span>
                </div>
                {advisor.phone && (
                  <div className="flex items-center">
                    <FaPhone className="flex-shrink-0 w-3 h-3 mr-1 sm:w-4 sm:h-4 text-primary" />
                    <span className="truncate max-w-[140px] sm:max-w-[220px]">{advisor.phone}</span>
                  </div>
                )}
                {advisor.advisorEmail && (
                  <div className="flex items-center">
                    <FaUser className="flex-shrink-0 w-3 h-3 mr-1 sm:w-4 sm:h-4 text-primary" />
                    <span className="truncate max-w-[140px] sm:max-w-[220px]">{advisor.advisorEmail}</span>
                  </div>
                )}
                {advisor.website && (
                  <div className="flex items-center">
                    <FaGlobe className="flex-shrink-0 w-3 h-3 mr-1 sm:w-4 sm:h-4 text-primary" />
                    <a href={advisor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-third transition-colors inline-flex items-center truncate max-w-[140px] sm:max-w-[220px]">
                      <span className="truncate">{advisor.website}</span>
                      <FaExternalLinkAlt className="flex-shrink-0 w-2 h-2 ml-1 sm:w-3 sm:h-3" />
                    </a>
                  </div>
                )}
              </div>
              {advisor.workedWithCimamplify && (
                <div className="inline-flex items-center gap-2 px-3 py-2 mt-3 text-indigo-700 border border-indigo-200 rounded-lg bg-indigo-50">
                  <img
                    src="/logo.png"
                    alt="CIM Amplify"
                    className="w-auto h-5"
                  />
                  <span className="text-xs font-semibold sm:text-sm">
                    This Advisor uses CIM Amplify to find more buyers
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-start flex-shrink-0 pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 transition-colors border-gray-300 rounded form-checkbox sm:h-5 sm:w-5 text-primary focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-4 sm:p-6 sm:space-y-6">
        {/* Description */}
        <div>
          <p className="leading-relaxed text-gray-700">{advisor.description}</p>
        </div>

        {/* Intro Video */}
        {advisor.introVideoUrl && (
          <div>
            <div className="flex items-center mb-2">
              <h4 className="font-semibold text-gray-900">Introduction Video</h4>
            </div>
            <div className="overflow-hidden bg-black border border-gray-200 rounded-lg">
              <video src={advisor.introVideoUrl} controls className="object-contain w-full h-48 bg-black" />
            </div>
          </div>
        )}

        {/* Revenue Range */}
        {/* <div className="p-3 border border-green-200 rounded-lg bg-green-50 sm:p-4">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center">
              <FaDollarSign className="flex-shrink-0 w-4 h-4 mr-2 text-green-600 sm:w-5 sm:h-5" />
              <span className="text-sm font-semibold text-green-800 sm:text-base">Revenue Range of their typical client</span>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-base font-bold text-green-900 break-words sm:text-lg">
                {formatCurrency(advisor.revenueRange?.min, advisor.currency)} - {formatCurrency(advisor.revenueRange?.max, advisor.currency)}
              </div>
            </div>
          </div>
        </div> */}

        {/* Industries */}
        {/* <div>
          <div className="flex items-center mb-2 sm:mb-3">
            <FaIndustry className="flex-shrink-0 w-3 h-3 mr-2 sm:w-4 sm:h-4 text-primary" />
            <h4 className="text-sm font-semibold text-gray-900 sm:text-base">Industries</h4>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(showAll ? advisor.industries : (advisor.industries || []).slice(0, 5))?.map((industry, index) => (
              <span key={index} className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 border border-blue-200 rounded-full sm:px-3 sm:text-sm">
                {industry}
              </span>
            ))}
          </div>
        </div> */}

        {/* Geographies */}
        {/* <div>
          <div className="flex items-center mb-2 sm:mb-3">
            <FaMapMarkerAlt className="flex-shrink-0 w-3 h-3 mr-2 sm:w-4 sm:h-4 text-primary" />
            <h4 className="text-sm font-semibold text-gray-900 sm:text-base">Geographies</h4>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(showAll ? advisor.geographies : (advisor.geographies || []).slice(0, 5))?.map((geography, index) => (
              <span key={index} className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 border border-green-200 rounded-full sm:px-3 sm:text-sm">
                {geography}
              </span>
            ))}
          </div>
        </div> */}

        {/* Show more/less toggle when lists are long */}
        {/* {(((advisor.industries || []).length > 5) || ((advisor.geographies || []).length > 5)) && (
          <div className="pt-1">
            <button
              type="button"
              className="text-sm font-semibold text-primary hover:text-third"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? 'Show less' : 'Show more'}
            </button>
          </div>
        )} */}

        {/* Licensing */}
        {/* {advisor.licensing && (
          <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
            <div className="flex items-center mb-2">
              <FaAward className="w-4 h-4 mr-2 text-purple-600" />
              <h4 className="font-semibold text-purple-900">Licensing & Credentials</h4>
            </div>
            <p className="text-sm text-purple-800">{advisor.licensing}</p>
          </div>
        )} */}

        {/* Testimonials */}
        {Array.isArray(advisor.testimonials) && advisor.testimonials.length > 0 && (
          <div>
            <div className="flex items-center mb-3">
              <FaQuoteLeft className="w-4 h-4 mr-2 text-primary" />
              <h4 className="font-semibold text-gray-900">Client Testimonials</h4>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {advisor.testimonials.map((t, idx) => {
                const text = t?.testimonial || '';
                const isLong = text.length > 220;
                const expanded = !!expandedTestimonials[idx];
                const visible = expanded || !isLong ? text : `${text.substring(0, 220)}…`;
                const initial = (t?.clientName || 'C').charAt(0).toUpperCase();
                return (
                  <div key={idx} className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
                    <div className="flex items-center gap-3 px-4 pt-4">
                      <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-gradient-to-br from-primary to-third">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{t?.clientName || 'Client'}</p>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <p className="mt-2 text-sm text-gray-700">
                        {visible}
                      </p>
                      {isLong && (
                        <button
                          type="button"
                          onClick={() => toggleTestimonial(idx)}
                          className="mt-2 text-xs font-semibold text-primary hover:text-third"
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
      <div className="px-4 py-3 border-t border-gray-100 sm:px-6 sm:py-4 bg-gray-50">
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