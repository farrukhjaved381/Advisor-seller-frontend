import React from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdvisorCard = ({ advisor, onSelect, isSelected, onGetDirectList }) => {
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

  const handleGetDirectList = async () => {
    if (onGetDirectList) {
      onGetDirectList();
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img className="h-16 w-16 rounded-full object-cover" src={advisor.logoUrl} alt={advisor.companyName} />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">{advisor.companyName}</h3>
              <p className="text-sm text-gray-600">{advisor.advisorName}</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="form-checkbox h-5 w-5 text-blue-600 rounded"
          />
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">{advisor.description}</p>
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-800">Industries</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {advisor.industries.map((industry, index) => (
              <span key={index} className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-full">
                {industry}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-800">Geographies</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {advisor.geographies.map((geography, index) => (
              <span key={index} className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-full">
                {geography}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-800">Testimonials</h4>
          {advisor.testimonials.map((testimonial, index) => (
            <div key={index} className="mt-2">
              <p className="text-sm text-gray-600">"{testimonial.testimonial}"</p>
              <p className="text-xs text-gray-500 text-right">- {testimonial.clientName}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 bg-gray-50 flex space-x-2">
        <button
          onClick={handleRequestIntroduction}
          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Request Introduction
        </button>
        <button
          onClick={handleGetDirectList}
          className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition"
        >
          Get Direct List
        </button>
      </div>
    </div>
  );
};

export default AdvisorCard;
