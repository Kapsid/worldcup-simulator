// Player Names Data Index
// This file provides easy access to all country name sets organized by region

// Import all regional name data
import scandinavianNames from './scandinavia.json';
import easternEuropeNames from './eastern-europe.json';
import balkansNames from './balkans.json';
import africaNames from './africa.json';
import asiaNames from './asia.json';
import southAmericaNames from './south-america.json';
import northCentralAmericaNames from './north-central-america.json';
import otherEuropeNames from './other-europe.json';

// Combine all name data into a single object
export const playerNames = {
  ...scandinavianNames,
  ...easternEuropeNames,
  ...balkansNames,
  ...africaNames,
  ...asiaNames,
  ...southAmericaNames,
  ...northCentralAmericaNames,
  ...otherEuropeNames
};

// Regional groupings for easy access
export const regions = {
  scandinavia: {
    name: 'Scandinavia',
    countries: ['SWE', 'NOR', 'DEN', 'FIN', 'ISL'],
    data: scandinavianNames
  },
  easternEurope: {
    name: 'Eastern Europe', 
    countries: ['POL', 'CZE', 'SVK', 'HUN', 'CRO', 'SRB', 'SVN', 'BGR', 'ROU'],
    data: easternEuropeNames
  },
  balkans: {
    name: 'Balkans',
    countries: ['BIH', 'MNE', 'MKD', 'ALB', 'XKX'],
    data: balkansNames
  },
  africa: {
    name: 'Africa',
    countries: ['NGA', 'GHA', 'SEN', 'MAR', 'DZA', 'TUN', 'EGY', 'CMR', 'CIV', 'ZAF', 'KEN', 'MLI'],
    data: africaNames
  },
  asia: {
    name: 'Asia',
    countries: ['KOR', 'IRN', 'KSA', 'AUS', 'THA', 'VNM', 'IND', 'CHN', 'IDN', 'MYS'],
    data: asiaNames
  },
  southAmerica: {
    name: 'South America',
    countries: ['CHI', 'URU', 'COL', 'PER', 'ECU', 'VEN', 'PAR', 'BOL'],
    data: southAmericaNames
  },
  northCentralAmerica: {
    name: 'North & Central America',
    countries: ['CAN', 'CRC', 'JAM', 'TTO', 'HND', 'GTM', 'PAN'],
    data: northCentralAmericaNames
  },
  otherEurope: {
    name: 'Other European Countries',
    countries: ['BEL', 'SUI', 'AUT', 'TUR', 'GRE', 'UKR', 'BLR', 'RUS', 'GEO'],
    data: otherEuropeNames
  }
};

// Helper function to get names for a specific country
export function getCountryNames(countryCode) {
  return playerNames[countryCode] || null;
}

// Helper function to get a random first name for a country
export function getRandomFirstName(countryCode) {
  const countryData = getCountryNames(countryCode);
  if (!countryData) return null;
  
  const firstNames = countryData.firstNames;
  return firstNames[Math.floor(Math.random() * firstNames.length)];
}

// Helper function to get a random surname for a country
export function getRandomSurname(countryCode) {
  const countryData = getCountryNames(countryCode);
  if (!countryData) return null;
  
  const surnames = countryData.surnames;
  return surnames[Math.floor(Math.random() * surnames.length)];
}

// Helper function to generate a random full name for a country
export function getRandomFullName(countryCode) {
  const firstName = getRandomFirstName(countryCode);
  const surname = getRandomSurname(countryCode);
  
  if (!firstName || !surname) return null;
  
  return `${firstName} ${surname}`;
}

// Get all available country codes
export function getAvailableCountries() {
  return Object.keys(playerNames);
}

// Get country names with their full country names
export function getCountryList() {
  return Object.entries(playerNames).map(([code, data]) => ({
    code,
    name: data.country,
    firstNameCount: data.firstNames.length,
    surnameCount: data.surnames.length
  }));
}

// Default export
export default playerNames;