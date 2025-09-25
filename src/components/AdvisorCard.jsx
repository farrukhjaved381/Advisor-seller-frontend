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
        'https://advisor-seller-backend.vercel.app/api/connections/introduction',
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
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-primary/5 to-third/5 p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              {advisor.logoUrl ? (
                <img 
                  className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl object-cover border-2 border-white shadow-md" 
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
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 truncate">{advisor.companyName}</h3>
              <div className="flex items-center text-gray-600 mb-1">
                <FaUser className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base truncate">{advisor.advisorName}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center">
                  <FaAward className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                  <span>{advisor.yearsExperience} years</span>
                </div>
                <div className="flex items-center">
                  <FaChartLine className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                  <span>{advisor.numberOfTransactions} deals</span>
                </div>
                {advisor.phone && (
                  <div className="flex items-center">
                    <FaPhone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-primary flex-shrink-0" />
                    <span className="truncate max-w-[140px] sm:max-w-[220px]">{advisor.phone}</span>
                  </div>
                )}
                {advisor.advisorEmail && (
                  <div className="flex items-center">
                    <FaUser className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-primary flex-shrink-0" />
                    <span className="truncate max-w-[140px] sm:max-w-[220px]">{advisor.advisorEmail}</span>
                  </div>
                )}
                {advisor.website && (
                  <div className="flex items-center">
                    <FaGlobe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-primary flex-shrink-0" />
                    <a href={advisor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-third transition-colors inline-flex items-center truncate max-w-[140px] sm:max-w-[220px]">
                      <span className="truncate">{advisor.website}</span>
                      <FaExternalLinkAlt className="w-2 h-2 sm:w-3 sm:h-3 ml-1 flex-shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-start pt-1 flex-shrink-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="form-checkbox h-4 w-4 sm:h-5 sm:w-5 text-primary focus:ring-primary border-gray-300 rounded transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Description */}
        <div>
          <p className="text-gray-700 leading-relaxed">{advisor.description}</p>
        </div>

        {/* Revenue Range */}
        {/* <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center">
              <FaDollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 flex-shrink-0" />
              <span className="font-semibold text-green-800 text-sm sm:text-base">Revenue Range of their typical client</span>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-base sm:text-lg font-bold text-green-900 break-words">
                {formatCurrency(advisor.revenueRange?.min, advisor.currency)} - {formatCurrency(advisor.revenueRange?.max, advisor.currency)}
              </div>
            </div>
          </div>
        </div> */}

        {/* Industries */}
        {/* <div>
          <div className="flex items-center mb-2 sm:mb-3">
            <FaIndustry className="w-3 h-3 sm:w-4 sm:h-4 text-primary mr-2 flex-shrink-0" />
            <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Industries</h4>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(showAll ? advisor.industries : (advisor.industries || []).slice(0, 5))?.map((industry, index) => (
              <span key={index} className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-blue-800 bg-blue-100 rounded-full border border-blue-200">
                {industry}
              </span>
            ))}
          </div>
        </div> */}

        {/* Geographies */}
        {/* <div>
          <div className="flex items-center mb-2 sm:mb-3">
            <FaMapMarkerAlt className="w-3 h-3 sm:w-4 sm:h-4 text-primary mr-2 flex-shrink-0" />
            <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Geographies</h4>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(showAll ? advisor.geographies : (advisor.geographies || []).slice(0, 5))?.map((geography, index) => (
              <span key={index} className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-green-800 bg-green-100 rounded-full border border-green-200">
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
              className="text-primary hover:text-third text-sm font-semibold"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? 'Show less' : 'Show more'}
            </button>
          </div>
        )} */}

        {/* Licensing */}
        {/* {advisor.licensing && (
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center mb-2">
              <FaAward className="w-4 h-4 text-purple-600 mr-2" />
              <h4 className="font-semibold text-purple-900">Licensing & Credentials</h4>
            </div>
            <p className="text-purple-800 text-sm">{advisor.licensing}</p>
          </div>
        )} */}

        {/* Intro Video */}
        {advisor.introVideoUrl && (
          <div>
            <div className="flex items-center mb-2">
              <h4 className="font-semibold text-gray-900">Introduction Video</h4>
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-200 bg-black">
              <video src={advisor.introVideoUrl} controls className="w-full h-48 object-contain bg-black" />
            </div>
          </div>
        )}

        {/* Testimonials */}
        {Array.isArray(advisor.testimonials) && advisor.testimonials.length > 0 && (
          <div>
            <div className="flex items-center mb-3">
              <FaQuoteLeft className="w-4 h-4 text-primary mr-2" />
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
                  <div key={idx} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                    <div className="flex items-center gap-3 px-4 pt-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-third text-white flex items-center justify-center text-sm font-bold">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{t?.clientName || 'Client'}</p>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <p className="text-gray-700 text-sm mt-2">
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
      <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-100">
        {/* <button
          onClick={handleRequestIntroduction}
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-third text-white py-2.5 sm:py-3 px-4 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
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
