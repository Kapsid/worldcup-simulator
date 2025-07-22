export const countryCities = {
  // Europe
  ENG: {
    capital: 'London',
    cities: ['London', 'Manchester', 'Liverpool', 'Birmingham', 'Leeds', 'Newcastle', 'Sheffield', 'Bristol', 'Leicester', 'Southampton']
  },
  FRA: {
    capital: 'Paris',
    cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Bordeaux', 'Lille', 'Rennes']
  },
  GER: {
    capital: 'Berlin',
    cities: ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart', 'Dortmund', 'Leipzig', 'Dresden', 'Nuremberg']
  },
  ESP: {
    capital: 'Madrid',
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Málaga', 'Zaragoza', 'Palma', 'Las Palmas', 'Murcia']
  },
  ITA: {
    capital: 'Rome',
    cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Venice']
  },
  NED: {
    capital: 'Amsterdam',
    cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere']
  },
  BEL: {
    capital: 'Brussels',
    cities: ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges']
  },
  POR: {
    capital: 'Lisbon',
    cities: ['Lisbon', 'Porto', 'Braga', 'Coimbra', 'Funchal', 'Setúbal']
  },
  POL: {
    capital: 'Warsaw',
    cities: ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Katowice']
  },
  
  // South America
  BRA: {
    capital: 'Brasília',
    cities: ['Brasília', 'São Paulo', 'Rio de Janeiro', 'Salvador', 'Belo Horizonte', 'Fortaleza', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre']
  },
  ARG: {
    capital: 'Buenos Aires',
    cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata', 'Salta', 'San Juan']
  },
  URU: {
    capital: 'Montevideo',
    cities: ['Montevideo', 'Salto', 'Paysandú', 'Maldonado']
  },
  CHI: {
    capital: 'Santiago',
    cities: ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco']
  },
  COL: {
    capital: 'Bogotá',
    cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga']
  },
  
  // North America
  USA: {
    capital: 'Washington D.C.',
    cities: ['Washington D.C.', 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'Dallas', 'San Diego']
  },
  MEX: {
    capital: 'Mexico City',
    cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Zapopan', 'Mérida', 'Cancún']
  },
  CAN: {
    capital: 'Ottawa',
    cities: ['Ottawa', 'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Quebec City', 'Winnipeg']
  },
  
  // Asia
  JPN: {
    capital: 'Tokyo',
    cities: ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo', 'Kyoto', 'Kobe', 'Fukuoka', 'Hiroshima', 'Sendai']
  },
  KOR: {
    capital: 'Seoul',
    cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan']
  },
  CHN: {
    capital: 'Beijing',
    cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Wuhan', 'Xi\'an', 'Hangzhou', 'Nanjing', 'Qingdao']
  },
  IND: {
    capital: 'New Delhi',
    cities: ['New Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow']
  },
  
  // Africa
  RSA: {
    capital: 'Pretoria',
    cities: ['Pretoria', 'Johannesburg', 'Cape Town', 'Durban', 'Port Elizabeth', 'Bloemfontein', 'Nelspruit', 'Polokwane']
  },
  NGA: {
    capital: 'Abuja',
    cities: ['Abuja', 'Lagos', 'Kano', 'Ibadan', 'Port Harcourt', 'Kaduna']
  },
  EGY: {
    capital: 'Cairo',
    cities: ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez']
  },
  MAR: {
    capital: 'Rabat',
    cities: ['Rabat', 'Casablanca', 'Marrakech', 'Fez', 'Tangier', 'Agadir']
  },
  
  // Oceania
  AUS: {
    capital: 'Canberra',
    cities: ['Canberra', 'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle']
  },
  NZL: {
    capital: 'Wellington',
    cities: ['Wellington', 'Auckland', 'Christchurch', 'Hamilton', 'Dunedin']
  },
  
  // Default for countries not listed
  DEFAULT: {
    capital: 'Capital City',
    cities: ['Capital City', 'Major City 1', 'Major City 2', 'Major City 3', 'Major City 4']
  }
};

export function getCountryCities(countryCode, limit = 8) {
  const countryData = countryCities[countryCode] || countryCities.DEFAULT;
  const cities = [...countryData.cities];
  
  // Ensure capital is always included
  if (!cities.includes(countryData.capital)) {
    cities.unshift(countryData.capital);
  }
  
  // Limit cities to requested number (2-10)
  const finalLimit = Math.max(2, Math.min(10, limit));
  const selectedCities = cities.slice(0, finalLimit);
  
  return {
    capital: countryData.capital,
    cities: selectedCities.map(city => ({
      name: city,
      isCapital: city === countryData.capital
    }))
  };
}