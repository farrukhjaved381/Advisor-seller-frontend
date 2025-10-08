// Industry data structure
export const getIndustryData = () => {
  return {
    sectors: [
      {
        name: "Consumer & Retail",
        id: "consumer-retail",
        industryGroups: [
          { name: "Consumer Brands", id: "consumer-brands", description: "Apparel, footwear, accessories, home goods, personal care products, etc.", industries: [] },
          { name: "Consumer Services", id: "consumer-services", description: "Education services, fitness, beauty services, home services, etc.", industries: [] },
          { name: "Food & Beverage", id: "food-beverage", description: "Food processing, restaurants, beverages, agricultural products, food technology, etc.", industries: [] },
          { name: "Hospitality & Travel", id: "hospitality-travel", description: "Hotels, airlines, travel agencies, cruise lines, entertainment venues, etc.", industries: [] },
          { name: "Media & Entertainment", id: "media-entertainment", description: "Streaming services, content production, gaming, sports, publishing, etc.", industries: [] },
          { name: "Retail", id: "retail", description: "Department stores, specialty retail, e-commerce, grocery, discount retail, etc.", industries: [] },
        ],
      },
      {
        name: "Energy & Utilities",
        id: "energy-utilities",
        industryGroups: [
          { name: "Electric Utilities", id: "electric-utilities", description: "Power generation, transmission, distribution, grid modernization, etc.", industries: [] },
          { name: "Energy Technology", id: "energy-technology", description: "Smart grid, energy efficiency, carbon capture, energy management software, etc.", industries: [] },
          { name: "Oil & Gas", id: "oil-gas", description: "Upstream exploration, midstream transport, downstream refining, oilfield services, etc.", industries: [] },
          { name: "Renewable Energy", id: "renewable-energy", description: "Solar, wind, hydroelectric, energy storage, green hydrogen, etc.", industries: [] },
        ],
      },
      {
        name: "Financial Services",
        id: "financial-services",
        industryGroups: [
          { name: "Asset Management", id: "asset-management", description: "Mutual funds, hedge funds, private equity, wealth management, etc.", industries: [] },
          { name: "Banking", id: "banking", description: "Commercial banks, investment banks, regional banks, credit unions, etc.", industries: [] },
          { name: "Financial Technology", id: "financial-technology", description: "Payment processing, lending platforms, digital banking, blockchain finance, etc.", industries: [] },
          { name: "Insurance", id: "insurance", description: "Life, property & casualty, health, reinsurance, insurance technology, etc.", industries: [] },
        ],
      },
      {
        name: "Healthcare & Life Sciences",
        id: "healthcare-life-sciences",
        industryGroups: [
          { name: "Biotechnology", id: "biotechnology", description: "Gene therapy, cell therapy, molecular diagnostics, research tools, etc.", industries: [] },
          { name: "Healthcare IT", id: "healthcare-it", description: "Electronic health records, healthcare analytics, digital health platforms, etc.", industries: [] },
          { name: "Healthcare Services", id: "healthcare-services", description: "Hospitals, clinics, telemedicine, home healthcare, urgent care, etc.", industries: [] },
          { name: "Medical Devices", id: "medical-devices", description: "Diagnostic equipment, surgical instruments, implantable devices, wearables, etc.", industries: [] },
          { name: "Pharmaceuticals", id: "pharmaceuticals", description: "Drug development, generic drugs, specialty pharmaceuticals, vaccines, etc.", industries: [] },
        ],
      },
      {
        name: "Industrial & Manufacturing",
        id: "industrial-manufacturing",
        industryGroups: [
          { name: "Aerospace & Defense", id: "aerospace-defense", description: "Aircraft manufacturing, defense contractors, space technology, military equipment, etc.", industries: [] },
          { name: "Automotive", id: "automotive", description: "Vehicle manufacturing, auto parts, electric vehicles, autonomous driving technology, etc.", industries: [] },
          { name: "Heavy Machinery", id: "heavy-machinery", description: "Construction equipment, agricultural machinery, mining equipment, industrial tools, etc.", industries: [] },
          { name: "Materials, Chemicals & Mining", id: "materials-chemicals-mining", description: "Specialty chemicals, commodities, plastics, metals, building materials, etc.", industries: [] },
        ],
      },
      {
        name: "Professional Services",
        id: "professional-services",
        industryGroups: [
          { name: "Accounting & Tax", id: "accounting-tax", description: "Accounting firms, tax services, audit services, financial advisory, etc.", industries: [] },
          { name: "Consulting", id: "consulting", description: "Management consulting, IT consulting, strategy consulting, operations consulting, etc.", industries: [] },
          { name: "Legal & Regulatory", id: "legal-regulatory", description: "Law firms, legal technology, compliance services, regulatory consulting, etc.", industries: [] },
          { name: "Marketing & Advertising", id: "marketing-advertising", description: "Digital marketing, advertising agencies, public relations, market research, etc.", industries: [] },
        ],
      },
      {
        name: "Real Estate & Construction",
        id: "real-estate-construction",
        industryGroups: [
          { name: "Commercial Real Estate", id: "commercial-real-estate", description: "Office buildings, retail properties, industrial facilities, data centers, etc.", industries: [] },
          { name: "Construction", id: "construction", description: "General contracting, specialty trades, construction materials, civil engineering, etc.", industries: [] },
          { name: "Residential Real Estate", id: "residential-real-estate", description: "Home building, residential development, property management, senior housing, etc.", industries: [] },
        ],
      },
      {
        name: "Technology & Software",
        id: "technology-software",
        industryGroups: [
          { name: "Consumer Software", id: "consumer-software", description: "Mobile apps, gaming, social media, entertainment software, etc.", industries: [] },
          { name: "Emerging Technologies", id: "emerging-technologies", description: "AI/ML, blockchain, IoT, robotics, quantum computing, AR/VR, etc.", industries: [] },
          { name: "Enterprise Software", id: "enterprise-software", description: "ERP, CRM, HCM, SCM, business intelligence, workflow automation, etc.", industries: [] },
          { name: "Hardware & Semiconductors", id: "hardware-semiconductors", description: "Computer hardware, networking equipment, chips, electronic components, etc.", industries: [] },
          { name: "Telecommunications", id: "telecommunications", description: "Telecom services, equipment, wireless infrastructure, satellite communications, etc.", industries: [] },
        ],
      },
      {
        name: "Transportation & Logistics",
        id: "transportation-logistics",
        industryGroups: [
          { name: "Last-Mile Delivery", id: "last-mile-delivery", description: "Package delivery, food delivery, local logistics, drone delivery, etc.", industries: [] },
          { name: "Logistics Services", id: "logistics-services", description: "Third-party logistics, warehousing, distribution, supply chain management, etc.", industries: [] },
          { name: "Public Transportation", id: "public-transportation", description: "Airlines, mass transit, ride sharing, mobility services, etc.", industries: [] },
          { name: "Shipping, Freight & Distribution", id: "shipping-freight-distribution", description: "Ocean shipping, trucking, rail transport, air cargo, freight brokerage, etc.", industries: [] },
        ],
      },
    ],
  };
};