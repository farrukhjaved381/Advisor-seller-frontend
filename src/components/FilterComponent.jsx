import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FilterComponent = ({ title, data, query, setQuery, setFieldValue, fieldName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const wrapperRef = useRef(null);

  // Updates the parent form's state whenever selected items change
  useEffect(() => {
    // Join the selected item IDs and set the field value
    const selectedIds = selectedItems.map(item => item.id).join(', ');
    setFieldValue(fieldName, selectedIds);
  }, [selectedItems, setFieldValue, fieldName]);

  // Handles clicks outside the component to close the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  // Toggles item selection
  const handleToggle = (item) => {
    setSelectedItems(prevItems => {
      const isSelected = prevItems.find(i => i.id === item.id);
      if (isSelected) {
        return prevItems.filter(i => i.id !== item.id);
      } else {
        return [...prevItems, item];
      }
    });
    setQuery('');
  };

  // Flattens the nested data structure for searching
  const flattenData = (items) => {
    let flatList = [];
    items.forEach(item => {
      flatList.push(item);
      if (item.children) {
        flatList = flatList.concat(flattenData(item.children));
      }
    });
    return flatList;
  };

  const flattenedData = flattenData(data);

  // Filters items based on the search query
  const filteredItems = flattenedData.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="w-full relative" ref={wrapperRef}>
      <h3 className="block text-sm font-medium mb-1">{title}</h3>
      <div className="relative">
        {/* Search input field */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={`Search ${title}`}
          aria-expanded={isOpen}
          className="w-full p-4 rounded-xl border-[0.15rem] border-primary/30 focus:border-primary focus:outline-none transition ease-in-out duration-300 placeholder-primary/60"
        />
        <div
          className="absolute top-4 right-4 cursor-pointer text-gray-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '▲' : '▼'}
        </div>
      </div>

      {/* Dropdown list with animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            <ul className="py-2">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => handleToggle(item)}
                    className={`cursor-pointer px-4 py-2 hover:bg-gray-100 ${
                      selectedItems.find(i => i.id === item.id) ? 'bg-primary text-white hover:bg-primary' : ''
                    }`}
                  >
                    {item.label}
                  </li>
                ))
              ) : (
                <li className="px-4 py-2 text-gray-500">No results found.</li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected tags display */}
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedItems.map((item) => (
          <span
            key={item.id}
            className="flex items-center bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full cursor-pointer"
            onClick={() => handleToggle(item)}
          >
            {item.label}
            <span className="ml-2 font-bold">×</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default FilterComponent;