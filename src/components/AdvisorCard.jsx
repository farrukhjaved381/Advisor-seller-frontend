import React from 'react';
import { FaBuilding, FaUser, FaGlobe, FaPhone, FaMapMarkerAlt, FaIndustry, FaDollarSign, FaAward, FaQuoteLeft, FaExternalLinkAlt, FaChartLine, FaEnvelope } from 'react-icons/fa';

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
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`📧 Introduction email sent to ${advisor.companyName}!`);
    } catch (error) {
      alert('Failed to send introduction request');
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
    <div className="w-full max-w-2xl mx-auto overflow-hidden transition-all duration-300 bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-2xl">
      {/* Header Section */}
      <div className="relative p-6 border-b border-gray-100 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Logo + Info */}
          <div className="flex items-start flex-1 min-w-0 gap-4">
            {/* Logo */}
            <div className="relative flex-shrink-0">
              {advisor.logoUrl ? (
                <img 
                  className="object-cover w-20 h-20 bg-white border-4 border-white shadow-lg rounded-2xl" 
                  src={advisor.logoUrl} 
                  alt={advisor.companyName}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg ${advisor.logoUrl ? 'hidden' : 'flex'}`}>
                {advisor.companyName?.charAt(0) || 'A'}
              </div>
            </div>

            {/* Company Info */}
            <div className="flex-1 min-w-0">
              {/* Company Name - with proper wrapping */}
              <h3 className="mb-2 text-2xl font-bold leading-tight text-gray-900 break-words">
                {advisor.companyName}
              </h3>
              
              {/* Advisor Name */}
              <div className="flex items-center mb-3 text-gray-700">
                <FaUser className="flex-shrink-0 w-4 h-4 mr-2 text-blue-600" />
                <span className="text-base font-medium break-words">{advisor.advisorName}</span>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <div className="flex items-center px-3 py-1 text-sm font-semibold text-yellow-700 bg-yellow-100 rounded-full">
                  <FaAward className="w-4 h-4 mr-1.5" />
                  <span>{advisor.yearsExperience} years</span>
                </div>
                <div className="flex items-center px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 rounded-full">
                  <FaChartLine className="w-4 h-4 mr-1.5" />
                  <span>{advisor.numberOfTransactions} deals</span>
                </div>
              </div>

              {/* Contact Info Grid */}
              <div className="space-y-2 text-sm text-gray-600">
                {advisor.phone && (
                  <div className="flex items-center">
                    <FaPhone className="flex-shrink-0 w-4 h-4 mr-2 text-blue-600" />
                    <span className="break-all">{advisor.phone}</span>
                  </div>
                )}
                {advisor.advisorEmail && (
                  <div className="flex items-center">
                    <FaEnvelope className="flex-shrink-0 w-4 h-4 mr-2 text-blue-600" />
                    <span className="break-all">{advisor.advisorEmail}</span>
                  </div>
                )}
                {advisor.website && (
                  <div className="flex items-center">
                    <FaGlobe className="flex-shrink-0 w-4 h-4 mr-2 text-blue-600" />
                    <a 
                      href={advisor.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center text-blue-600 break-all transition-colors hover:text-purple-600 hover:underline"
                    >
                      <span className="break-all">{advisor.website.replace(/^https?:\/\//, '')}</span>
                      <FaExternalLinkAlt className="flex-shrink-0 w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Checkbox */}
          <div className="flex-shrink-0 pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-6 h-6 text-blue-600 transition-colors border-gray-300 rounded cursor-pointer form-checkbox focus:ring-blue-500 focus:ring-2"
            />
          </div>
        </div>

        {/* CIM Amplify Badge */}
        {advisor.workedWithCimamplify && (
          <div className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-sm font-semibold text-indigo-700 border-2 border-indigo-300 rounded-xl bg-indigo-50">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            </svg>
            <span>Uses CIM Amplify to find more buyers</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-6">
        {/* Description */}
        {advisor.description && (
          <div>
            <p className="text-base leading-relaxed text-gray-700">{advisor.description}</p>
          </div>
        )}

        {/* Intro Video */}
        {advisor.introVideoUrl && (
          <div>
            <h4 className="mb-3 text-lg font-semibold text-gray-900">Introduction Video</h4>
            <div className="overflow-hidden bg-black border border-gray-200 shadow-inner rounded-xl">
              <video 
                src={advisor.introVideoUrl} 
                controls 
                className="object-contain w-full bg-black h-60"
              />
            </div>
          </div>
        )}

        {/* Testimonials */}
        {Array.isArray(advisor.testimonials) && advisor.testimonials.length > 0 && (
          <div>
            <div className="flex items-center mb-4">
              <FaQuoteLeft className="w-5 h-5 mr-2 text-blue-600" />
              <h4 className="text-lg font-semibold text-gray-900">Client Testimonials</h4>
            </div>
            <div className="space-y-4">
              {advisor.testimonials.map((t, idx) => {
                const text = t?.testimonial || '';
                const isLong = text.length > 220;
                const expanded = !!expandedTestimonials[idx];
                const visible = expanded || !isLong ? text : `${text.substring(0, 220)}…`;
                const initial = (t?.clientName || 'C').charAt(0).toUpperCase();
                
                return (
                  <div 
                    key={idx} 
                    className="p-5 transition-all border border-gray-200 shadow-sm bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl hover:shadow-md hover:border-blue-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-lg font-bold text-white rounded-full shadow-md bg-gradient-to-br from-blue-500 to-purple-600">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-gray-900 break-words">
                          {t?.clientName || 'Client'}
                        </p>
                      </div>
                    </div>
                    <p className="text-base leading-relaxed text-gray-700">
                      "{visible}"
                    </p>
                    {isLong && (
                      <button
                        type="button"
                        onClick={() => toggleTestimonial(idx)}
                        className="mt-3 text-sm font-semibold text-blue-600 transition-colors hover:text-purple-600"
                      >
                        {expanded ? '← Read less' : 'Read more →'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
        <button
          onClick={handleRequestIntroduction}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <FaEnvelope className="w-5 h-5" />
              <span>Request Introduction</span>
            </>
          )}
        </button>
      </div> */}
    </div>
  );
};
export default AdvisorCard;