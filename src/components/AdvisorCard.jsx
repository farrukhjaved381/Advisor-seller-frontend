import React from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaBuilding, FaUser, FaGlobe, FaPhone, FaMapMarkerAlt, FaIndustry, FaDollarSign, FaAward, FaQuoteLeft, FaExternalLinkAlt, FaFilePdf, FaChartLine } from 'react-icons/fa';

const AdvisorCard = ({ advisor, onSelect, isSelected }) => {
  const handleRequestIntroduction = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        'https://advisor-seller-backend.vercel.app/api/connections/introduction',
        { advisorIds: [advisor.id] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Introduction request sent!');
    } catch (error) {
      toast.error('Failed to send introduction request');
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
      <div className="relative bg-gradient-to-r from-primary/5 to-third/5 p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {advisor.logoUrl ? (
                <img 
                  className="h-16 w-16 rounded-xl object-cover border-2 border-white shadow-md" 
                  src={advisor.logoUrl} 
                  alt={advisor.companyName}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-third flex items-center justify-center text-white font-bold text-xl shadow-md ${advisor.logoUrl ? 'hidden' : 'flex'}`}>
                {advisor.companyName?.charAt(0) || 'A'}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{advisor.companyName}</h3>
              <div className="flex items-center text-gray-600 mb-2">
                <FaUser className="w-4 h-4 mr-2" />
                <span className="font-medium">{advisor.advisorName}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <FaAward className="w-4 h-4 mr-1" />
                  <span>{advisor.yearsExperience} years</span>
                </div>
                <div className="flex items-center">
                  <FaChartLine className="w-4 h-4 mr-1" />
                  <span>{advisor.numberOfTransactions} deals</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="form-checkbox h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-6">
        {/* Description */}
        <div>
          <p className="text-gray-700 leading-relaxed">{advisor.description}</p>
        </div>

        {/* Revenue Range */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FaDollarSign className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-semibold text-green-800">Revenue Range</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-900">
                {formatCurrency(advisor.revenueRange?.min, advisor.currency)} - {formatCurrency(advisor.revenueRange?.max, advisor.currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Industries */}
        <div>
          <div className="flex items-center mb-3">
            <FaIndustry className="w-4 h-4 text-primary mr-2" />
            <h4 className="font-semibold text-gray-900">Industries</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {advisor.industries?.map((industry, index) => (
              <span key={index} className="px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full border border-blue-200">
                {industry}
              </span>
            ))}
          </div>
        </div>

        {/* Geographies */}
        <div>
          <div className="flex items-center mb-3">
            <FaMapMarkerAlt className="w-4 h-4 text-primary mr-2" />
            <h4 className="font-semibold text-gray-900">Geographies</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {advisor.geographies?.map((geography, index) => (
              <span key={index} className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full border border-green-200">
                {geography}
              </span>
            ))}
          </div>
        </div>

        {/* Licensing */}
        {advisor.licensing && (
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center mb-2">
              <FaAward className="w-4 h-4 text-purple-600 mr-2" />
              <h4 className="font-semibold text-purple-900">Licensing & Credentials</h4>
            </div>
            <p className="text-purple-800 text-sm">{advisor.licensing}</p>
          </div>
        )}

        {/* Contact Information */}
        <div className="grid grid-cols-1 gap-3">
          {advisor.phone && (
            <div className="flex items-center text-gray-600">
              <FaPhone className="w-4 h-4 mr-3 text-primary" />
              <span className="text-sm">{advisor.phone}</span>
            </div>
          )}
          {advisor.website && (
            <div className="flex items-center text-gray-600">
              <FaGlobe className="w-4 h-4 mr-3 text-primary" />
              <a href={advisor.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-third transition-colors flex items-center">
                {advisor.website}
                <FaExternalLinkAlt className="w-3 h-3 ml-1" />
              </a>
            </div>
          )}
        </div>

        {/* Testimonials */}
        {advisor.testimonials && advisor.testimonials.length > 0 && (
          <div>
            <div className="flex items-center mb-3">
              <FaQuoteLeft className="w-4 h-4 text-primary mr-2" />
              <h4 className="font-semibold text-gray-900">Client Testimonials</h4>
            </div>
            <div className="space-y-3">
              {advisor.testimonials.slice(0, 2).map((testimonial, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 text-sm italic mb-2">"{testimonial.testimonial}"</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-600">— {testimonial.clientName}</p>
                    {testimonial.pdfUrl && (
                      <a href={testimonial.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-third transition-colors">
                        <FaFilePdf className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex space-x-3">
          <button
            onClick={handleRequestIntroduction}
            className="flex-1 bg-gradient-to-r from-primary to-third text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <FaUser className="w-4 h-4" />
            <span>Request Introduction</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvisorCard;