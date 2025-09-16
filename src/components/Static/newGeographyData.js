// Geography data structure
export const getGeoData = () => {
  return {
    continents: [
      {
        name: "Africa",
        id: "africa",
        regions: [
          {
            name: "Algeria",
            id: "algeria",
            subRegions: [
              { name: "Adrar", id: "adrar" },
              { name: "Alger", id: "alger" },
              { name: "Annaba", id: "annaba" },
            ],
          },
          { name: "Angola", id: "angola" },
          { name: "Benin", id: "benin" },
          { name: "Botswana", id: "botswana" },
          { name: "Egypt", id: "egypt" },
          { name: "Kenya", id: "kenya" },
          { name: "Nigeria", id: "nigeria" },
          { name: "South Africa", id: "south-africa" },
        ],
      },
      {
        name: "Asia",
        id: "asia",
        regions: [
          {
            name: "China",
            id: "china",
            subRegions: [
              { name: "Beijing Shi", id: "beijing-shi" },
              { name: "Shanghai Shi", id: "shanghai-shi" },
              { name: "Guangdong Sheng", id: "guangdong-sheng" },
            ],
          },
          {
            name: "India",
            id: "india",
            subRegions: [
              { name: "Delhi", id: "delhi" },
              { name: "Maharashtra", id: "maharashtra" },
              { name: "Karnataka", id: "karnataka" },
            ],
          },
          {
            name: "Japan",
            id: "japan",
            subRegions: [
              { name: "Tokyo", id: "tokyo" },
              { name: "Osaka", id: "osaka" },
              { name: "Kyoto", id: "kyoto" },
            ],
          },
          { name: "Singapore", id: "singapore" },
          { name: "Thailand", id: "thailand" },
          { name: "Vietnam", id: "vietnam" },
        ],
      },
      {
        name: "Europe",
        id: "europe",
        regions: [
          {
            name: "United Kingdom",
            id: "uk",
            subRegions: [
              { name: "England", id: "england" },
              { name: "Scotland", id: "scotland" },
              { name: "Wales", id: "wales" },
            ],
          },
          {
            name: "Germany",
            id: "germany",
            subRegions: [
              { name: "Bavaria", id: "bavaria" },
              { name: "Berlin", id: "berlin" },
              { name: "Hamburg", id: "hamburg" },
            ],
          },
          {
            name: "France",
            id: "france",
            subRegions: [
              { name: "Île-de-France", id: "ile-de-france" },
              { name: "Provence-Alpes-Côte d'Azur", id: "provence-alpes-cote-dazur" },
            ],
          },
          { name: "Netherlands", id: "netherlands" },
          { name: "Switzerland", id: "switzerland" },
          { name: "Italy", id: "italy" },
        ],
      },
      {
        name: "North America",
        id: "north-america",
        regions: [
          {
            name: "United States",
            id: "usa",
            subRegions: [
              { name: "California", id: "california" },
              { name: "New York", id: "new-york" },
              { name: "Texas", id: "texas" },
              { name: "Florida", id: "florida" },
            ],
          },
          {
            name: "Canada",
            id: "canada",
            subRegions: [
              { name: "Ontario", id: "ontario" },
              { name: "Quebec", id: "quebec" },
              { name: "British Columbia", id: "british-columbia" },
            ],
          },
          {
            name: "Mexico",
            id: "mexico",
            subRegions: [
              { name: "Ciudad de México", id: "ciudad-de-mexico" },
              { name: "Jalisco", id: "jalisco" },
            ],
          },
        ],
      },
      {
        name: "Oceania",
        id: "oceania",
        regions: [
          {
            name: "Australia",
            id: "australia",
            subRegions: [
              { name: "New South Wales", id: "new-south-wales" },
              { name: "Victoria", id: "victoria" },
              { name: "Queensland", id: "queensland" },
            ],
          },
          {
            name: "New Zealand",
            id: "new-zealand",
            subRegions: [
              { name: "Auckland", id: "auckland" },
              { name: "Wellington", id: "wellington" },
            ],
          },
        ],
      },
      {
        name: "South America",
        id: "south-america",
        regions: [
          {
            name: "Brazil",
            id: "brazil",
            subRegions: [
              { name: "São Paulo", id: "sao-paulo" },
              { name: "Rio de Janeiro", id: "rio-de-janeiro" },
            ],
          },
          { name: "Argentina", id: "argentina" },
          { name: "Chile", id: "chile" },
          { name: "Colombia", id: "colombia" },
        ],
      },
    ],
  };
};