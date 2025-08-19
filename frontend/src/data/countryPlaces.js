// Comprehensive country places and landmarks data for ALL football nations
export const countryPlaces = {
  // Europe
  'GER': {
    capital: 'Berlin',
    places: [
      {
        name: 'Brandenburg Gate',
        description: 'Iconic neoclassical monument and symbol of Berlin unity',
        type: 'Monument',
        image: '🏛️'
      },
      {
        name: 'Neuschwanstein Castle',
        description: 'Fairy-tale castle in Bavaria that inspired Disney castles',
        type: 'Castle',
        image: '🏰'
      },
      {
        name: 'Cologne Cathedral',
        description: 'Gothic masterpiece and UNESCO World Heritage Site',
        type: 'Religious Site',
        image: '⛪'
      },
      {
        name: 'Black Forest',
        description: 'Mystical forest region famous for cuckoo clocks',
        type: 'Nature',
        image: '🌲'
      }
    ]
  },
  'ESP': {
    capital: 'Madrid',
    places: [
      {
        name: 'Sagrada Familia',
        description: 'Gaudí\'s unfinished architectural masterpiece in Barcelona',
        type: 'Religious Site',
        image: '⛪'
      },
      {
        name: 'Alhambra',
        description: 'Moorish palace complex in Granada with stunning Islamic art',
        type: 'Palace',
        image: '🏰'
      },
      {
        name: 'Park Güell',
        description: 'Colorful mosaic park designed by Antoni Gaudí',
        type: 'Park',
        image: '🌺'
      },
      {
        name: 'Camino de Santiago',
        description: 'Historic pilgrimage route across northern Spain',
        type: 'Cultural Route',
        image: '🚶'
      }
    ]
  },
  'FRA': {
    capital: 'Paris',
    places: [
      {
        name: 'Eiffel Tower',
        description: 'Iconic iron tower and symbol of Paris romance',
        type: 'Monument',
        image: '🗼'
      },
      {
        name: 'Palace of Versailles',
        description: 'Opulent royal residence with magnificent gardens',
        type: 'Palace',
        image: '🏰'
      },
      {
        name: 'Mont-Saint-Michel',
        description: 'Medieval abbey on a tidal island in Normandy',
        type: 'Religious Site',
        image: '⛪'
      },
      {
        name: 'Loire Valley',
        description: 'Region of Renaissance châteaux and vineyards',
        type: 'Region',
        image: '🍷'
      }
    ]
  },
  'ITA': {
    capital: 'Rome',
    places: [
      {
        name: 'Colosseum',
        description: 'Ancient Roman amphitheater, wonder of the world',
        type: 'Historical Site',
        image: '🏛️'
      },
      {
        name: 'Venice Canals',
        description: 'Romantic waterways with gondolas and palaces',
        type: 'City',
        image: '🚤'
      },
      {
        name: 'Leaning Tower of Pisa',
        description: 'Famous tilted bell tower in Tuscany',
        type: 'Monument',
        image: '🗼'
      },
      {
        name: 'Amalfi Coast',
        description: 'Stunning coastal cliffs with colorful towns',
        type: 'Nature',
        image: '🌊'
      }
    ]
  },
  'ENG': {
    capital: 'London',
    places: [
      {
        name: 'Big Ben',
        description: 'Iconic clock tower symbol of London',
        type: 'Monument',
        image: '🏰'
      },
      {
        name: 'Stonehenge',
        description: 'Mysterious prehistoric stone circle in Wiltshire',
        type: 'Historical Site',
        image: '🗿'
      },
      {
        name: 'Tower Bridge',
        description: 'Victorian bascule bridge over the River Thames',
        type: 'Bridge',
        image: '🌉'
      },
      {
        name: 'Lake District',
        description: 'Scenic region of lakes and mountains in Cumbria',
        type: 'Nature',
        image: '⛰️'
      }
    ]
  },
  'NED': {
    capital: 'Amsterdam',
    places: [
      {
        name: 'Keukenhof Gardens',
        description: 'World\'s largest flower garden with millions of tulips',
        type: 'Garden',
        image: '🌷'
      },
      {
        name: 'Kinderdijk Windmills',
        description: 'Historic windmills UNESCO World Heritage Site',
        type: 'Historical Site',
        image: '💨'
      },
      {
        name: 'Giethoorn',
        description: 'Venice of the North - village with canals instead of roads',
        type: 'Village',
        image: '🚤'
      },
      {
        name: 'Anne Frank House',
        description: 'Museum in the hiding place of Anne Frank',
        type: 'Museum',
        image: '🏠'
      }
    ]
  },

  // South America
  'BRA': {
    capital: 'Brasília',
    places: [
      {
        name: 'Christ the Redeemer',
        description: 'Iconic statue overlooking Rio de Janeiro',
        type: 'Monument',
        image: '✝️'
      },
      {
        name: 'Amazon Rainforest',
        description: 'World\'s largest tropical rainforest ecosystem',
        type: 'Nature',
        image: '🌿'
      },
      {
        name: 'Iguazu Falls',
        description: 'Spectacular waterfalls on Brazil-Argentina border',
        type: 'Nature',
        image: '💦'
      },
      {
        name: 'Copacabana Beach',
        description: 'Famous beach in Rio with golden sand and vibrant culture',
        type: 'Beach',
        image: '🏖️'
      }
    ]
  },
  'ARG': {
    capital: 'Buenos Aires',
    places: [
      {
        name: 'Tango Streets of Buenos Aires',
        description: 'Birthplace of tango with colorful neighborhoods',
        type: 'Cultural District',
        image: '💃'
      },
      {
        name: 'Patagonia',
        description: 'Vast wilderness with glaciers and dramatic landscapes',
        type: 'Nature',
        image: '⛰️'
      },
      {
        name: 'Mendoza Wine Region',
        description: 'World-renowned wine region at the foot of the Andes',
        type: 'Wine Region',
        image: '🍷'
      },
      {
        name: 'Perito Moreno Glacier',
        description: 'Advancing glacier in Los Glaciares National Park',
        type: 'Nature',
        image: '🧊'
      }
    ]
  },

  // North America
  'USA': {
    capital: 'Washington, D.C.',
    places: [
      {
        name: 'Statue of Liberty',
        description: 'Symbol of freedom and democracy in New York Harbor',
        type: 'Monument',
        image: '🗽'
      },
      {
        name: 'Grand Canyon',
        description: 'Massive geological wonder in Arizona',
        type: 'Nature',
        image: '🏜️'
      },
      {
        name: 'Golden Gate Bridge',
        description: 'Iconic suspension bridge in San Francisco',
        type: 'Bridge',
        image: '🌉'
      },
      {
        name: 'Yellowstone National Park',
        description: 'First national park with geysers and wildlife',
        type: 'Nature',
        image: '🌋'
      }
    ]
  },
  'MEX': {
    capital: 'Mexico City',
    places: [
      {
        name: 'Chichen Itza',
        description: 'Ancient Maya city and Wonder of the World',
        type: 'Historical Site',
        image: '🏛️'
      },
      {
        name: 'Teotihuacan',
        description: 'Ancient Mesoamerican city with massive pyramids',
        type: 'Historical Site',
        image: '🔺'
      },
      {
        name: 'Cenotes of Yucatan',
        description: 'Natural swimming holes in underground caves',
        type: 'Nature',
        image: '💎'
      },
      {
        name: 'Day of the Dead Celebrations',
        description: 'Colorful cultural tradition honoring ancestors',
        type: 'Cultural Event',
        image: '💀'
      }
    ]
  },

  // Asia
  'JPN': {
    capital: 'Tokyo',
    places: [
      {
        name: 'Mount Fuji',
        description: 'Sacred mountain and symbol of Japan',
        type: 'Nature',
        image: '🗻'
      },
      {
        name: 'Fushimi Inari Shrine',
        description: 'Thousands of red torii gates on mountainside',
        type: 'Religious Site',
        image: '⛩️'
      },
      {
        name: 'Cherry Blossom Season',
        description: 'Beautiful sakura blooms across the country',
        type: 'Natural Phenomenon',
        image: '🌸'
      },
      {
        name: 'Bamboo Grove of Arashiyama',
        description: 'Mystical bamboo forest in Kyoto',
        type: 'Nature',
        image: '🎋'
      }
    ]
  },
  'KOR': {
    capital: 'Seoul',
    places: [
      {
        name: 'Gyeongbokgung Palace',
        description: 'Grand royal palace from the Joseon Dynasty',
        type: 'Palace',
        image: '🏰'
      },
      {
        name: 'Jeju Island',
        description: 'Volcanic island with beautiful beaches and nature',
        type: 'Island',
        image: '🌺'
      },
      {
        name: 'Bukchon Hanok Village',
        description: 'Traditional Korean houses in historic neighborhood',
        type: 'Historic District',
        image: '🏘️'
      },
      {
        name: 'Seoraksan National Park',
        description: 'Mountain park with dramatic peaks and temples',
        type: 'Nature',
        image: '⛰️'
      }
    ]
  },

  // Africa
  'EGY': {
    capital: 'Cairo',
    places: [
      {
        name: 'Pyramids of Giza',
        description: 'Ancient wonders and the Great Sphinx',
        type: 'Historical Site',
        image: '🔺'
      },
      {
        name: 'Valley of the Kings',
        description: 'Royal tombs of ancient pharaohs in Luxor',
        type: 'Historical Site',
        image: '🏺'
      },
      {
        name: 'Abu Simbel',
        description: 'Massive rock temples built by Ramesses II',
        type: 'Temple',
        image: '🏛️'
      },
      {
        name: 'Red Sea Coral Reefs',
        description: 'World-class diving with vibrant marine life',
        type: 'Nature',
        image: '🐠'
      }
    ]
  },
  'MAR': {
    capital: 'Rabat',
    places: [
      {
        name: 'Marrakech Medina',
        description: 'Historic walled city with bustling souks',
        type: 'Historic City',
        image: '🕌'
      },
      {
        name: 'Sahara Desert',
        description: 'Vast desert with golden dunes and camel treks',
        type: 'Nature',
        image: '🏜️'
      },
      {
        name: 'Blue City of Chefchaouen',
        description: 'Mountain town painted in stunning blue hues',
        type: 'City',
        image: '🔵'
      },
      {
        name: 'Hassan II Mosque',
        description: 'Magnificent mosque with minaret overlooking ocean',
        type: 'Religious Site',
        image: '🕌'
      }
    ]
  },

  // Oceania
  // More European Countries
  'POR': {
    capital: 'Lisbon',
    places: [
      {
        name: 'Tower of Belém',
        description: 'Historic fortress and UNESCO World Heritage Site',
        type: 'Monument',
        image: '🏰'
      },
      {
        name: 'Pena Palace',
        description: 'Colorful romantic palace in Sintra mountains',
        type: 'Palace',
        image: '🌈'
      },
      {
        name: 'Douro Valley',
        description: 'Terraced vineyards along scenic river valley',
        type: 'Wine Region',
        image: '🍷'
      },
      {
        name: 'Azores Islands',
        description: 'Volcanic islands with crater lakes and hot springs',
        type: 'Nature',
        image: '🌋'
      }
    ]
  },
  'BEL': {
    capital: 'Brussels',
    places: [
      {
        name: 'Grand Place',
        description: 'UNESCO World Heritage medieval town square',
        type: 'Historic Square',
        image: '🏛️'
      },
      {
        name: 'Bruges Canals',
        description: 'Fairy-tale medieval city with romantic waterways',
        type: 'Historic City',
        image: '🚤'
      },
      {
        name: 'Atomium',
        description: 'Iconic building representing iron crystal structure',
        type: 'Architecture',
        image: '⚛️'
      },
      {
        name: 'Belgian Chocolate Museums',
        description: 'World-famous chocolate heritage and tastings',
        type: 'Cultural Site',
        image: '🍫'
      }
    ]
  },
  'SUI': {
    capital: 'Bern',
    places: [
      {
        name: 'Matterhorn',
        description: 'Iconic pyramid-shaped mountain peak',
        type: 'Nature',
        image: '⛰️'
      },
      {
        name: 'Jungfraujoch',
        description: 'Top of Europe with glaciers and mountain railways',
        type: 'Nature',
        image: '🚞'
      },
      {
        name: 'Lake Geneva',
        description: 'Alpine lake surrounded by vineyards and mountains',
        type: 'Nature',
        image: '🏔️'
      },
      {
        name: 'Rhine Falls',
        description: 'Europe\'s most powerful waterfall',
        type: 'Nature',
        image: '💦'
      }
    ]
  },
  'SWE': {
    capital: 'Stockholm',
    places: [
      {
        name: 'Gamla Stan',
        description: 'Medieval old town with cobblestone streets',
        type: 'Historic District',
        image: '🏘️'
      },
      {
        name: 'Northern Lights',
        description: 'Aurora Borealis in Swedish Lapland',
        type: 'Natural Phenomenon',
        image: '🌌'
      },
      {
        name: 'Vasa Museum',
        description: 'Preserved 17th-century warship',
        type: 'Museum',
        image: '⚓'
      },
      {
        name: 'Archipelago',
        description: '30,000 islands and skerries in Baltic Sea',
        type: 'Nature',
        image: '🏝️'
      }
    ]
  },
  'DEN': {
    capital: 'Copenhagen',
    places: [
      {
        name: 'Little Mermaid Statue',
        description: 'Iconic bronze sculpture inspired by Hans Christian Andersen',
        type: 'Monument',
        image: '🧜‍♀️'
      },
      {
        name: 'Tivoli Gardens',
        description: 'Historic amusement park in city center',
        type: 'Amusement Park',
        image: '🎡'
      },
      {
        name: 'Nyhavn',
        description: 'Colorful 17th-century waterfront district',
        type: 'Historic District',
        image: '🌈'
      },
      {
        name: 'Kronborg Castle',
        description: 'Shakespeare\'s Hamlet castle in Helsingør',
        type: 'Castle',
        image: '🏰'
      }
    ]
  },
  'NOR': {
    capital: 'Oslo',
    places: [
      {
        name: 'Norwegian Fjords',
        description: 'Dramatic waterfalls and steep cliffs',
        type: 'Nature',
        image: '🏔️'
      },
      {
        name: 'Northern Lights',
        description: 'Aurora Borealis in Arctic wilderness',
        type: 'Natural Phenomenon',
        image: '🌌'
      },
      {
        name: 'Midnight Sun',
        description: '24-hour daylight in summer months',
        type: 'Natural Phenomenon',
        image: '☀️'
      },
      {
        name: 'Stave Churches',
        description: 'Medieval wooden churches unique to Norway',
        type: 'Religious Site',
        image: '⛪'
      }
    ]
  },
  'POL': {
    capital: 'Warsaw',
    places: [
      {
        name: 'Krakow Old Town',
        description: 'Medieval city center and UNESCO World Heritage Site',
        type: 'Historic City',
        image: '🏰'
      },
      {
        name: 'Wieliczka Salt Mine',
        description: 'Underground salt mine with chapels and sculptures',
        type: 'Historical Site',
        image: '⛏️'
      },
      {
        name: 'Malbork Castle',
        description: 'World\'s largest brick castle complex',
        type: 'Castle',
        image: '🏰'
      },
      {
        name: 'Tatra Mountains',
        description: 'Dramatic mountain range on Polish-Slovak border',
        type: 'Nature',
        image: '⛰️'
      }
    ]
  },
  'CZE': {
    capital: 'Prague',
    places: [
      {
        name: 'Prague Castle',
        description: 'Largest ancient castle complex in the world',
        type: 'Castle',
        image: '🏰'
      },
      {
        name: 'Charles Bridge',
        description: 'Historic stone bridge with baroque statues',
        type: 'Bridge',
        image: '🌉'
      },
      {
        name: 'Český Krumlov',
        description: 'Medieval town with Renaissance castle',
        type: 'Historic Town',
        image: '🏘️'
      },
      {
        name: 'Karlštejn Castle',
        description: 'Gothic castle built by Holy Roman Emperor',
        type: 'Castle',
        image: '🏰'
      }
    ]
  },
  'AUT': {
    capital: 'Vienna',
    places: [
      {
        name: 'Schönbrunn Palace',
        description: 'Imperial summer palace with baroque gardens',
        type: 'Palace',
        image: '🏰'
      },
      {
        name: 'Salzburg Old Town',
        description: 'Mozart\'s birthplace and baroque architecture',
        type: 'Historic City',
        image: '🎼'
      },
      {
        name: 'Hallstatt',
        description: 'Picturesque lakeside village in Austrian Alps',
        type: 'Village',
        image: '🏔️'
      },
      {
        name: 'Melk Abbey',
        description: 'Magnificent baroque monastery on Danube River',
        type: 'Religious Site',
        image: '⛪'
      }
    ]
  },

  // More South American Countries
  'URU': {
    capital: 'Montevideo',
    places: [
      {
        name: 'Punta del Este',
        description: 'Glamorous beach resort and yacht harbor',
        type: 'Beach Resort',
        image: '🏖️'
      },
      {
        name: 'Colonia del Sacramento',
        description: 'Colonial Portuguese town across from Buenos Aires',
        type: 'Historic Town',
        image: '🏘️'
      },
      {
        name: 'Casapueblo',
        description: 'Unique white sculpture-house and museum',
        type: 'Art Installation',
        image: '🎨'
      },
      {
        name: 'Thermal Springs',
        description: 'Natural hot springs throughout the country',
        type: 'Nature',
        image: '♨️'
      }
    ]
  },
  'CHI': {
    capital: 'Santiago',
    places: [
      {
        name: 'Atacama Desert',
        description: 'World\'s driest non-polar desert',
        type: 'Nature',
        image: '🏜️'
      },
      {
        name: 'Easter Island (Rapa Nui)',
        description: 'Remote island with mysterious Moai statues',
        type: 'Historical Site',
        image: '🗿'
      },
      {
        name: 'Torres del Paine',
        description: 'Dramatic granite towers in Patagonia',
        type: 'Nature',
        image: '⛰️'
      },
      {
        name: 'Valparaíso',
        description: 'Colorful port city with historic funiculars',
        type: 'Historic City',
        image: '🚡'
      }
    ]
  },
  'COL': {
    capital: 'Bogotá',
    places: [
      {
        name: 'Cartagena Old Town',
        description: 'Colonial walled city on Caribbean coast',
        type: 'Historic City',
        image: '🏰'
      },
      {
        name: 'Coffee Cultural Landscape',
        description: 'UNESCO coffee-growing region in Andes',
        type: 'Cultural Landscape',
        image: '☕'
      },
      {
        name: 'Tayrona National Park',
        description: 'Tropical beaches and jungle on Caribbean coast',
        type: 'Nature',
        image: '🏖️'
      },
      {
        name: 'Salt Cathedral',
        description: 'Underground church carved in salt mine',
        type: 'Religious Site',
        image: '⛪'
      }
    ]
  },
  'PER': {
    capital: 'Lima',
    places: [
      {
        name: 'Machu Picchu',
        description: 'Ancient Inca citadel high in Andes Mountains',
        type: 'Historical Site',
        image: '🏛️'
      },
      {
        name: 'Amazon Rainforest',
        description: 'Pristine jungle with incredible biodiversity',
        type: 'Nature',
        image: '🌿'
      },
      {
        name: 'Lake Titicaca',
        description: 'World\'s highest navigable lake with floating islands',
        type: 'Nature',
        image: '🏔️'
      },
      {
        name: 'Nazca Lines',
        description: 'Mysterious ancient geoglyphs in desert',
        type: 'Historical Site',
        image: '🛸'
      }
    ]
  },
  'ECU': {
    capital: 'Quito',
    places: [
      {
        name: 'Galápagos Islands',
        description: 'Unique wildlife laboratory that inspired Darwin',
        type: 'Nature',
        image: '🐢'
      },
      {
        name: 'Quito Historic Center',
        description: 'Best-preserved colonial city in Latin America',
        type: 'Historic City',
        image: '⛪'
      },
      {
        name: 'Cotopaxi Volcano',
        description: 'Active stratovolcano with glaciated peak',
        type: 'Nature',
        image: '🌋'
      },
      {
        name: 'Baños Hot Springs',
        description: 'Adventure capital with thermal baths',
        type: 'Nature',
        image: '♨️'
      }
    ]
  },

  // African Countries
  'NGA': {
    capital: 'Abuja',
    places: [
      {
        name: 'Zuma Rock',
        description: 'Massive monolith known as Gateway to Abuja',
        type: 'Nature',
        image: '🪨'
      },
      {
        name: 'Yankari National Park',
        description: 'Wildlife reserve with elephants and hot springs',
        type: 'Nature',
        image: '🐘'
      },
      {
        name: 'Osun-Osogbo Grove',
        description: 'Sacred forest and UNESCO World Heritage Site',
        type: 'Cultural Site',
        image: '🌳'
      },
      {
        name: 'Olumo Rock',
        description: 'Historic rock formation with caves and shrines',
        type: 'Nature',
        image: '🏔️'
      }
    ]
  },
  'GHA': {
    capital: 'Accra',
    places: [
      {
        name: 'Cape Coast Castle',
        description: 'Historic slave trade fortress on Atlantic coast',
        type: 'Historical Site',
        image: '🏰'
      },
      {
        name: 'Kakum Canopy Walk',
        description: 'Treetop walkway through tropical rainforest',
        type: 'Nature',
        image: '🌳'
      },
      {
        name: 'Lake Volta',
        description: 'One of world\'s largest artificial lakes',
        type: 'Nature',
        image: '🏞️'
      },
      {
        name: 'Mole National Park',
        description: 'Largest wildlife park with elephants and hippos',
        type: 'Nature',
        image: '🐘'
      }
    ]
  },
  'SEN': {
    capital: 'Dakar',
    places: [
      {
        name: 'Gorée Island',
        description: 'UNESCO site commemorating slave trade history',
        type: 'Historical Site',
        image: '🏝️'
      },
      {
        name: 'Pink Lake (Lac Rose)',
        description: 'Unique pink-colored salt lake',
        type: 'Nature',
        image: '🌸'
      },
      {
        name: 'Djoudj National Bird Sanctuary',
        description: 'Major bird migration site in Sahel',
        type: 'Nature',
        image: '🦩'
      },
      {
        name: 'Casamance Region',
        description: 'Lush forests and traditional villages',
        type: 'Cultural Region',
        image: '🌿'
      }
    ]
  },
  'CIV': {
    capital: 'Yamoussoukro',
    places: [
      {
        name: 'Basilica of Our Lady of Peace',
        description: 'Largest church in the world by area',
        type: 'Religious Site',
        image: '⛪'
      },
      {
        name: 'Taï National Park',
        description: 'Primary rainforest with endangered species',
        type: 'Nature',
        image: '🌳'
      },
      {
        name: 'Grand-Bassam',
        description: 'Colonial town and UNESCO World Heritage Site',
        type: 'Historic Town',
        image: '🏘️'
      },
      {
        name: 'Assinie Beach',
        description: 'Palm-fringed beaches on Atlantic coast',
        type: 'Beach',
        image: '🏖️'
      }
    ]
  },
  'CMR': {
    capital: 'Yaoundé',
    places: [
      {
        name: 'Mount Cameroon',
        description: 'Active volcano and highest peak in West Africa',
        type: 'Nature',
        image: '🌋'
      },
      {
        name: 'Waza National Park',
        description: 'Savanna park with lions, elephants, and giraffes',
        type: 'Nature',
        image: '🦁'
      },
      {
        name: 'Limbe Beaches',
        description: 'Black volcanic sand beaches with mountain backdrop',
        type: 'Beach',
        image: '🏖️'
      },
      {
        name: 'Foumban Royal Palace',
        description: 'Traditional Bamoun kingdom palace and museum',
        type: 'Palace',
        image: '👑'
      }
    ]
  },
  'TUN': {
    capital: 'Tunis',
    places: [
      {
        name: 'Carthage Ruins',
        description: 'Ancient Phoenician and Roman archaeological site',
        type: 'Historical Site',
        image: '🏛️'
      },
      {
        name: 'Sidi Bou Said',
        description: 'Blue and white cliffside village',
        type: 'Village',
        image: '🔵'
      },
      {
        name: 'Sahara Desert',
        description: 'Golden sand dunes and desert oases',
        type: 'Nature',
        image: '🏜️'
      },
      {
        name: 'El Djem Amphitheatre',
        description: 'Best-preserved Roman colosseum in Africa',
        type: 'Historical Site',
        image: '🏛️'
      }
    ]
  },
  'ALG': {
    capital: 'Algiers',
    places: [
      {
        name: 'Casbah of Algiers',
        description: 'Historic medina and UNESCO World Heritage Site',
        type: 'Historic District',
        image: '🕌'
      },
      {
        name: 'Sahara Desert',
        description: 'Vast desert with Tuareg culture and oases',
        type: 'Nature',
        image: '🏜️'
      },
      {
        name: 'Djémila Roman Ruins',
        description: 'Well-preserved Roman city in mountains',
        type: 'Historical Site',
        image: '🏛️'
      },
      {
        name: 'Tassili n\'Ajjer',
        description: 'Ancient rock art and desert landscapes',
        type: 'Nature',
        image: '🗿'
      }
    ]
  },

  // Asian Countries
  'CHN': {
    capital: 'Beijing',
    places: [
      {
        name: 'Great Wall of China',
        description: 'Ancient fortification across northern China',
        type: 'Historical Site',
        image: '🏯'
      },
      {
        name: 'Forbidden City',
        description: 'Imperial palace complex in Beijing',
        type: 'Palace',
        image: '🏰'
      },
      {
        name: 'Terracotta Army',
        description: 'Thousands of life-sized warrior sculptures',
        type: 'Historical Site',
        image: '🏺'
      },
      {
        name: 'Li River',
        description: 'Scenic river with limestone karst mountains',
        type: 'Nature',
        image: '🏔️'
      }
    ]
  },
  'IRN': {
    capital: 'Tehran',
    places: [
      {
        name: 'Persepolis',
        description: 'Ancient capital of Persian Empire',
        type: 'Historical Site',
        image: '🏛️'
      },
      {
        name: 'Isfahan',
        description: 'City of stunning Islamic architecture and gardens',
        type: 'Historic City',
        image: '🕌'
      },
      {
        name: 'Shiraz',
        description: 'City of poetry, gardens, and wine culture',
        type: 'Cultural City',
        image: '🌹'
      },
      {
        name: 'Mount Damavand',
        description: 'Highest peak in Middle East and dormant volcano',
        type: 'Nature',
        image: '🏔️'
      }
    ]
  },
  'SAU': {
    capital: 'Riyadh',
    places: [
      {
        name: 'Mecca (Kaaba)',
        description: 'Holiest site in Islam and pilgrimage destination',
        type: 'Religious Site',
        image: '🕋'
      },
      {
        name: 'Medina',
        description: 'Second holiest city with Prophet\'s Mosque',
        type: 'Religious Site',
        image: '🕌'
      },
      {
        name: 'Mada\'in Salih',
        description: 'Nabatean rock-cut tombs in desert',
        type: 'Historical Site',
        image: '🏛️'
      },
      {
        name: 'Empty Quarter Desert',
        description: 'Largest continuous sand desert in world',
        type: 'Nature',
        image: '🏜️'
      }
    ]
  },
  'QAT': {
    capital: 'Doha',
    places: [
      {
        name: 'Museum of Islamic Art',
        description: 'Stunning modern museum on Corniche waterfront',
        type: 'Museum',
        image: '🏛️'
      },
      {
        name: 'Souq Waqif',
        description: 'Traditional marketplace with spices and crafts',
        type: 'Market',
        image: '🛒'
      },
      {
        name: 'The Pearl Qatar',
        description: 'Luxury artificial island development',
        type: 'Modern District',
        image: '🏝️'
      },
      {
        name: 'Inland Sea (Khor Al Adaid)',
        description: 'Unique desert sea accessible only by 4WD',
        type: 'Nature',
        image: '🏜️'
      }
    ]
  },

  // North American Countries  
  'CAN': {
    capital: 'Ottawa',
    places: [
      {
        name: 'Niagara Falls',
        description: 'Powerful waterfalls on US-Canada border',
        type: 'Nature',
        image: '💦'
      },
      {
        name: 'Banff National Park',
        description: 'Rocky Mountain peaks, lakes, and glaciers',
        type: 'Nature',
        image: '🏔️'
      },
      {
        name: 'CN Tower',
        description: 'Iconic telecommunications tower in Toronto',
        type: 'Architecture',
        image: '🗼'
      },
      {
        name: 'Northern Lights',
        description: 'Aurora Borealis in Canadian wilderness',
        type: 'Natural Phenomenon',
        image: '🌌'
      }
    ]
  },
  'CRC': {
    capital: 'San José',
    places: [
      {
        name: 'Manuel Antonio National Park',
        description: 'Tropical beaches with wildlife and rainforest',
        type: 'Nature',
        image: '🏖️'
      },
      {
        name: 'Arenal Volcano',
        description: 'Active stratovolcano with hot springs',
        type: 'Nature',
        image: '🌋'
      },
      {
        name: 'Monteverde Cloud Forest',
        description: 'Misty mountain forest with incredible biodiversity',
        type: 'Nature',
        image: '🌿'
      },
      {
        name: 'Tortuguero National Park',
        description: 'Sea turtle nesting beaches and canals',
        type: 'Nature',
        image: '🐢'
      }
    ]
  },

  // Oceania
  'AUS': {
    capital: 'Canberra',
    places: [
      {
        name: 'Sydney Opera House',
        description: 'Architectural masterpiece and performing arts venue',
        type: 'Architecture',
        image: '🎭'
      },
      {
        name: 'Great Barrier Reef',
        description: 'World\'s largest coral reef system',
        type: 'Nature',
        image: '🐠'
      },
      {
        name: 'Uluru (Ayers Rock)',
        description: 'Sacred monolith in the heart of Australia',
        type: 'Nature',
        image: '🪨'
      },
      {
        name: 'Blue Mountains',
        description: 'Eucalyptus forests and dramatic cliff formations',
        type: 'Nature',
        image: '🌿'
      }
    ]
  },
  'NZL': {
    capital: 'Wellington',
    places: [
      {
        name: 'Milford Sound',
        description: 'Dramatic fjord with waterfalls and mountains',
        type: 'Nature',
        image: '🏔️'
      },
      {
        name: 'Rotorua Geysers',
        description: 'Geothermal wonderland with hot springs',
        type: 'Nature',
        image: '♨️'
      },
      {
        name: 'Bay of Islands',
        description: 'Subtropical paradise with 144 islands',
        type: 'Nature',
        image: '🏝️'
      },
      {
        name: 'Hobbiton Movie Set',
        description: 'Lord of the Rings filming location',
        type: 'Cultural Site',
        image: '🏠'
      }
    ]
  },

  // More European Countries
  'RUS': {
    capital: 'Moscow',
    places: [
      {
        name: 'Red Square',
        description: 'Historic square with Kremlin and St. Basil\'s Cathedral',
        type: 'Historic Square',
        image: '🏛️'
      },
      {
        name: 'Trans-Siberian Railway',
        description: 'World\'s longest railway journey across Russia',
        type: 'Transportation',
        image: '🚂'
      },
      {
        name: 'Lake Baikal',
        description: 'World\'s deepest and oldest freshwater lake',
        type: 'Nature',
        image: '🏞️'
      },
      {
        name: 'Hermitage Museum',
        description: 'One of world\'s largest art collections in St. Petersburg',
        type: 'Museum',
        image: '🎨'
      }
    ]
  },
  'UKR': {
    capital: 'Kyiv',
    places: [
      {
        name: 'Kiev Pechersk Lavra',
        description: 'Historic monastery complex with underground caves',
        type: 'Religious Site',
        image: '⛪'
      },
      {
        name: 'Lviv Historic Center',
        description: 'UNESCO World Heritage medieval city',
        type: 'Historic City',
        image: '🏰'
      },
      {
        name: 'Chernobyl Exclusion Zone',
        description: 'Site of 1986 nuclear disaster, now wildlife preserve',
        type: 'Historical Site',
        image: '☢️'
      },
      {
        name: 'Carpathian Mountains',
        description: 'Mountain range with traditional villages',
        type: 'Nature',
        image: '⛰️'
      }
    ]
  },
  'TUR': {
    capital: 'Ankara',
    places: [
      {
        name: 'Hagia Sophia',
        description: 'Historic Byzantine church-turned-mosque in Istanbul',
        type: 'Religious Site',
        image: '🕌'
      },
      {
        name: 'Cappadocia',
        description: 'Fairy chimneys and hot air balloon flights',
        type: 'Nature',
        image: '🎈'
      },
      {
        name: 'Pamukkale',
        description: 'White travertine terraces with thermal pools',
        type: 'Nature',
        image: '♨️'
      },
      {
        name: 'Ephesus',
        description: 'Ancient Greek city with well-preserved ruins',
        type: 'Historical Site',
        image: '🏛️'
      }
    ]
  },
  'CRO': {
    capital: 'Zagreb',
    places: [
      {
        name: 'Dubrovnik Old Town',
        description: 'Medieval walled city on Adriatic coast',
        type: 'Historic City',
        image: '🏰'
      },
      {
        name: 'Plitvice Lakes',
        description: 'Cascading lakes connected by waterfalls',
        type: 'Nature',
        image: '💦'
      },
      {
        name: 'Diocletian\'s Palace',
        description: 'Roman palace complex in Split',
        type: 'Historical Site',
        image: '🏛️'
      },
      {
        name: 'Hvar Island',
        description: 'Lavender fields and crystal-clear waters',
        type: 'Island',
        image: '💜'
      }
    ]
  },
  'SER': {
    capital: 'Belgrade',
    places: [
      {
        name: 'Kalemegdan Fortress',
        description: 'Historic fortress overlooking Danube and Sava rivers',
        type: 'Fortress',
        image: '🏰'
      },
      {
        name: 'Novi Sad',
        description: 'Danube city with Petrovaradin Fortress',
        type: 'Historic City',
        image: '🏛️'
      },
      {
        name: 'Studenica Monastery',
        description: '12th-century Serbian Orthodox monastery',
        type: 'Religious Site',
        image: '⛪'
      },
      {
        name: 'Tara National Park',
        description: 'Pristine wilderness with Drina River canyon',
        type: 'Nature',
        image: '🌲'
      }
    ]
  },
  'GRE': {
    capital: 'Athens',
    places: [
      {
        name: 'Acropolis of Athens',
        description: 'Ancient citadel with Parthenon temple',
        type: 'Historical Site',
        image: '🏛️'
      },
      {
        name: 'Santorini',
        description: 'Volcanic island with blue-domed churches',
        type: 'Island',
        image: '🔵'
      },
      {
        name: 'Meteora',
        description: 'Monasteries perched on towering rock pillars',
        type: 'Religious Site',
        image: '⛪'
      },
      {
        name: 'Mykonos',
        description: 'Cosmopolitan island with windmills and beaches',
        type: 'Island',
        image: '🏖️'
      }
    ]
  },
  'BUL': {
    capital: 'Sofia',
    places: [
      {
        name: 'Rila Monastery',
        description: 'UNESCO World Heritage Orthodox monastery',
        type: 'Religious Site',
        image: '⛪'
      },
      {
        name: 'Plovdiv Old Town',
        description: 'Ancient city with Roman theater',
        type: 'Historic City',
        image: '🏛️'
      },
      {
        name: 'Veliko Tarnovo',
        description: 'Medieval capital with Tsarevets fortress',
        type: 'Historic City',
        image: '🏰'
      },
      {
        name: 'Black Sea Coast',
        description: 'Golden beaches and seaside resorts',
        type: 'Beach',
        image: '🏖️'
      }
    ]
  },
  'ROU': {
    capital: 'Bucharest',
    places: [
      {
        name: 'Bran Castle',
        description: 'Medieval castle linked to Dracula legend',
        type: 'Castle',
        image: '🏰'
      },
      {
        name: 'Peleș Castle',
        description: 'Neo-Renaissance palace in Carpathian Mountains',
        type: 'Palace',
        image: '👑'
      },
      {
        name: 'Danube Delta',
        description: 'Biodiversity hotspot with unique wetlands',
        type: 'Nature',
        image: '🦆'
      },
      {
        name: 'Transylvania',
        description: 'Historic region with medieval towns',
        type: 'Region',
        image: '🏰'
      }
    ]
  },
  'HUN': {
    capital: 'Budapest',
    places: [
      {
        name: 'Parliament Building',
        description: 'Neo-Gothic parliament on Danube riverbank',
        type: 'Architecture',
        image: '🏛️'
      },
      {
        name: 'Thermal Baths',
        description: 'Historic thermal springs and spa culture',
        type: 'Cultural Site',
        image: '♨️'
      },
      {
        name: 'Fisherman\'s Bastion',
        description: 'Neo-Gothic terrace with panoramic city views',
        type: 'Monument',
        image: '🏰'
      },
      {
        name: 'Lake Balaton',
        description: 'Central Europe\'s largest freshwater lake',
        type: 'Nature',
        image: '🏞️'
      }
    ]
  },
  'SVK': {
    capital: 'Bratislava',
    places: [
      {
        name: 'Spis Castle',
        description: 'One of Europe\'s largest castle complexes',
        type: 'Castle',
        image: '🏰'
      },
      {
        name: 'High Tatras',
        description: 'Mountain range with alpine lakes',
        type: 'Nature',
        image: '⛰️'
      },
      {
        name: 'Bojnice Castle',
        description: 'Fairy-tale romantic castle',
        type: 'Castle',
        image: '🏰'
      },
      {
        name: 'Orava Castle',
        description: 'Dramatic clifftop castle',
        type: 'Castle',
        image: '🏰'
      }
    ]
  },
  'SVN': {
    capital: 'Ljubljana',
    places: [
      {
        name: 'Lake Bled',
        description: 'Alpine lake with island church and castle',
        type: 'Nature',
        image: '🏰'
      },
      {
        name: 'Postojna Cave',
        description: 'Spectacular underground cave system',
        type: 'Nature',
        image: '🕳️'
      },
      {
        name: 'Triglav National Park',
        description: 'Alpine wilderness around Slovenia\'s highest peak',
        type: 'Nature',
        image: '⛰️'
      },
      {
        name: 'Piran',
        description: 'Venetian-style coastal town on Adriatic',
        type: 'Historic Town',
        image: '🌊'
      }
    ]
  },

  // More Asian Countries
  'IND': {
    capital: 'New Delhi',
    places: [
      {
        name: 'Taj Mahal',
        description: 'Iconic white marble mausoleum in Agra',
        type: 'Monument',
        image: '🕌'
      },
      {
        name: 'Rajasthan Palaces',
        description: 'Magnificent palaces and forts in desert state',
        type: 'Palace',
        image: '🏰'
      },
      {
        name: 'Kerala Backwaters',
        description: 'Network of lagoons and canals with houseboats',
        type: 'Nature',
        image: '🚤'
      },
      {
        name: 'Himalayas',
        description: 'World\'s highest mountain range',
        type: 'Nature',
        image: '🏔️'
      }
    ]
  },
  'THA': {
    capital: 'Bangkok',
    places: [
      {
        name: 'Grand Palace',
        description: 'Ornate royal complex with Temple of Emerald Buddha',
        type: 'Palace',
        image: '🏰'
      },
      {
        name: 'Phi Phi Islands',
        description: 'Tropical paradise with crystal-clear waters',
        type: 'Island',
        image: '🏝️'
      },
      {
        name: 'Ayutthaya',
        description: 'Ancient capital with temple ruins',
        type: 'Historical Site',
        image: '🏛️'
      },
      {
        name: 'Chiang Mai Temples',
        description: 'Northern city with hundreds of Buddhist temples',
        type: 'Religious Site',
        image: '⛩️'
      }
    ]
  },
  'VIE': {
    capital: 'Hanoi',
    places: [
      {
        name: 'Ha Long Bay',
        description: 'UNESCO site with limestone pillars and emerald waters',
        type: 'Nature',
        image: '🏔️'
      },
      {
        name: 'Hoi An Ancient Town',
        description: 'Well-preserved trading port with lanterns',
        type: 'Historic Town',
        image: '🏮'
      },
      {
        name: 'Sapa Rice Terraces',
        description: 'Stunning mountain terraces cultivated by ethnic minorities',
        type: 'Nature',
        image: '🌾'
      },
      {
        name: 'Cu Chi Tunnels',
        description: 'Underground network from Vietnam War',
        type: 'Historical Site',
        image: '🕳️'
      }
    ]
  },
  'IDN': {
    capital: 'Jakarta',
    places: [
      {
        name: 'Borobudur',
        description: 'Massive Buddhist temple complex in Java',
        type: 'Religious Site',
        image: '⛩️'
      },
      {
        name: 'Bali Temples',
        description: 'Hindu temples with dramatic volcanic backdrops',
        type: 'Religious Site',
        image: '🌋'
      },
      {
        name: 'Komodo National Park',
        description: 'Home to Komodo dragons and pristine reefs',
        type: 'Nature',
        image: '🦎'
      },
      {
        name: 'Raja Ampat',
        description: 'Marine biodiversity hotspot for diving',
        type: 'Nature',
        image: '🐠'
      }
    ]
  },
  'MYS': {
    capital: 'Kuala Lumpur',
    places: [
      {
        name: 'Petronas Twin Towers',
        description: 'Iconic twin skyscrapers in Kuala Lumpur',
        type: 'Architecture',
        image: '🏢'
      },
      {
        name: 'George Town Penang',
        description: 'UNESCO World Heritage colonial city',
        type: 'Historic City',
        image: '🏛️'
      },
      {
        name: 'Borneo Rainforest',
        description: 'Ancient rainforest with orangutans',
        type: 'Nature',
        image: '🐒'
      },
      {
        name: 'Langkawi Islands',
        description: 'Tropical archipelago with beaches and mangroves',
        type: 'Island',
        image: '🏖️'
      }
    ]
  },

  // More African Countries
  'RSA': {
    capital: 'Cape Town',
    places: [
      {
        name: 'Table Mountain',
        description: 'Flat-topped mountain overlooking Cape Town',
        type: 'Nature',
        image: '⛰️'
      },
      {
        name: 'Kruger National Park',
        description: 'Premier safari destination with Big Five',
        type: 'Nature',
        image: '🦁'
      },
      {
        name: 'Cape of Good Hope',
        description: 'Dramatic cliffs where two oceans meet',
        type: 'Nature',
        image: '🌊'
      },
      {
        name: 'Robben Island',
        description: 'Historic prison island where Mandela was held',
        type: 'Historical Site',
        image: '🏝️'
      }
    ]
  },
  'KEN': {
    capital: 'Nairobi',
    places: [
      {
        name: 'Maasai Mara',
        description: 'World-famous wildlife reserve with Great Migration',
        type: 'Nature',
        image: '🦁'
      },
      {
        name: 'Mount Kenya',
        description: 'Africa\'s second highest peak',
        type: 'Nature',
        image: '⛰️'
      },
      {
        name: 'Lamu Old Town',
        description: 'Swahili cultural heritage on Indian Ocean',
        type: 'Historic Town',
        image: '🏛️'
      },
      {
        name: 'Amboseli National Park',
        description: 'Elephant herds with Mount Kilimanjaro backdrop',
        type: 'Nature',
        image: '🐘'
      }
    ]
  },
  'ZIM': {
    capital: 'Harare',
    places: [
      {
        name: 'Victoria Falls',
        description: 'One of world\'s largest waterfalls on Zambezi River',
        type: 'Nature',
        image: '💦'
      },
      {
        name: 'Great Zimbabwe',
        description: 'Ancient stone city ruins',
        type: 'Historical Site',
        image: '🏛️'
      },
      {
        name: 'Mana Pools National Park',
        description: 'UNESCO site with elephants and wild dogs',
        type: 'Nature',
        image: '🐘'
      },
      {
        name: 'Matobo Hills',
        description: 'Granite rock formations with ancient art',
        type: 'Nature',
        image: '🗿'
      }
    ]
  },

  // More South American Countries
  'VEN': {
    capital: 'Caracas',
    places: [
      {
        name: 'Angel Falls',
        description: 'World\'s highest uninterrupted waterfall',
        type: 'Nature',
        image: '💦'
      },
      {
        name: 'Canaima National Park',
        description: 'Tepuis (table mountains) and pristine wilderness',
        type: 'Nature',
        image: '⛰️'
      },
      {
        name: 'Los Roques',
        description: 'Caribbean archipelago with coral reefs',
        type: 'Nature',
        image: '🏝️'
      },
      {
        name: 'Orinoco Delta',
        description: 'Vast river delta with indigenous communities',
        type: 'Nature',
        image: '🚤'
      }
    ]
  },
  'BOL': {
    capital: 'Sucre',
    places: [
      {
        name: 'Salar de Uyuni',
        description: 'World\'s largest salt flat creating mirror effect',
        type: 'Nature',
        image: '🧂'
      },
      {
        name: 'La Paz',
        description: 'World\'s highest capital city in Andes',
        type: 'City',
        image: '🏔️'
      },
      {
        name: 'Lake Titicaca',
        description: 'Highest navigable lake with floating islands',
        type: 'Nature',
        image: '🏞️'
      },
      {
        name: 'Tiwanaku',
        description: 'Pre-Columbian archaeological site',
        type: 'Historical Site',
        image: '🏛️'
      }
    ]
  },
  'PAR': {
    capital: 'Asunción',
    places: [
      {
        name: 'Jesuit Missions',
        description: 'UNESCO World Heritage colonial missions',
        type: 'Historical Site',
        image: '⛪'
      },
      {
        name: 'Iguazu Falls',
        description: 'Spectacular waterfalls shared with Brazil and Argentina',
        type: 'Nature',
        image: '💦'
      },
      {
        name: 'Pantanal',
        description: 'World\'s largest tropical wetland',
        type: 'Nature',
        image: '🐊'
      },
      {
        name: 'Encarnación',
        description: 'City with beautiful beaches on Paraná River',
        type: 'City',
        image: '🏖️'
      }
    ]
  },

  // More Caribbean & CONCACAF Countries
  'JAM': {
    capital: 'Kingston',
    places: [
      {
        name: 'Blue Mountains',
        description: 'Coffee-growing mountains and UNESCO Biosphere Reserve',
        type: 'Nature',
        image: '☕'
      },
      {
        name: 'Dunn\'s River Falls',
        description: 'Famous terraced waterfalls near Ocho Rios',
        type: 'Nature',
        image: '💦'
      },
      {
        name: 'Bob Marley Museum',
        description: 'Former home of reggae legend Bob Marley',
        type: 'Museum',
        image: '🎵'
      },
      {
        name: 'Seven Mile Beach',
        description: 'World-famous beach in Negril',
        type: 'Beach',
        image: '🏖️'
      }
    ]
  },
  'PAN': {
    capital: 'Panama City',
    places: [
      {
        name: 'Panama Canal',
        description: 'Engineering marvel connecting Atlantic and Pacific',
        type: 'Infrastructure',
        image: '🚢'
      },
      {
        name: 'Casco Viejo',
        description: 'Historic colonial quarter in Panama City',
        type: 'Historic District',
        image: '🏛️'
      },
      {
        name: 'Bocas del Toro',
        description: 'Caribbean archipelago with pristine reefs',
        type: 'Island',
        image: '🏝️'
      },
      {
        name: 'Monteverde Cloud Forest',
        description: 'Misty forest with incredible biodiversity',
        type: 'Nature',
        image: '🌿'
      }
    ]
  },
  'HON': {
    capital: 'Tegucigalpa',
    places: [
      {
        name: 'Copán Ruins',
        description: 'UNESCO Maya archaeological site with hieroglyphs',
        type: 'Historical Site',
        image: '🏛️'
      },
      {
        name: 'Roatán Island',
        description: 'Caribbean island with world-class diving',
        type: 'Island',
        image: '🐠'
      },
      {
        name: 'Pico Bonito National Park',
        description: 'Tropical rainforest with rivers and waterfalls',
        type: 'Nature',
        image: '🌿'
      },
      {
        name: 'Bay Islands',
        description: 'Caribbean paradise with coral reefs',
        type: 'Island',
        image: '🏝️'
      }
    ]
  },
  'GUI': {
    capital: 'Guatemala City',
    places: [
      {
        name: 'Tikal',
        description: 'Ancient Maya city with towering pyramids',
        type: 'Historical Site',
        image: '🔺'
      },
      {
        name: 'Lake Atitlán',
        description: 'Volcanic lake surrounded by indigenous villages',
        type: 'Nature',
        image: '🏔️'
      },
      {
        name: 'Antigua Guatemala',
        description: 'Colonial city with baroque architecture',
        type: 'Historic City',
        image: '⛪'
      },
      {
        name: 'Pacaya Volcano',
        description: 'Active volcano perfect for hiking',
        type: 'Nature',
        image: '🌋'
      }
    ]
  },

  // More Middle Eastern & Central Asian Countries
  'ISR': {
    capital: 'Jerusalem',
    places: [
      {
        name: 'Western Wall',
        description: 'Holiest prayer site in Judaism',
        type: 'Religious Site',
        image: '🕍'
      },
      {
        name: 'Dead Sea',
        description: 'Lowest point on Earth with healing properties',
        type: 'Nature',
        image: '🏜️'
      },
      {
        name: 'Masada',
        description: 'Ancient fortress on desert plateau',
        type: 'Historical Site',
        image: '🏛️'
      },
      {
        name: 'Tel Aviv Beaches',
        description: 'Mediterranean coastline with vibrant nightlife',
        type: 'Beach',
        image: '🏖️'
      }
    ]
  },
  'KAZ': {
    capital: 'Nur-Sultan',
    places: [
      {
        name: 'Charyn Canyon',
        description: 'Grand Canyon of Kazakhstan with red rock formations',
        type: 'Nature',
        image: '🏜️'
      },
      {
        name: 'Almaty Mountains',
        description: 'Tian Shan mountain range with alpine lakes',
        type: 'Nature',
        image: '⛰️'
      },
      {
        name: 'Mausoleum of Khoja Ahmed Yasawi',
        description: 'UNESCO World Heritage Sufi shrine',
        type: 'Religious Site',
        image: '🕌'
      },
      {
        name: 'Baikonur Cosmodrome',
        description: 'World\'s first and largest space launch facility',
        type: 'Modern Site',
        image: '🚀'
      }
    ]
  },
  'UZB': {
    capital: 'Tashkent',
    places: [
      {
        name: 'Samarkand',
        description: 'Silk Road city with stunning Islamic architecture',
        type: 'Historic City',
        image: '🕌'
      },
      {
        name: 'Bukhara',
        description: 'Ancient trading center with preserved medieval core',
        type: 'Historic City',
        image: '🏛️'
      },
      {
        name: 'Khiva',
        description: 'Walled city like an open-air museum',
        type: 'Historic City',
        image: '🏰'
      },
      {
        name: 'Aral Sea',
        description: 'Environmental disaster site and ship graveyard',
        type: 'Historical Site',
        image: '🚢'
      }
    ]
  },

  // More African Countries
  'DRC': {
    capital: 'Kinshasa',
    places: [
      {
        name: 'Congo River',
        description: 'Second longest river in Africa',
        type: 'Nature',
        image: '🌊'
      },
      {
        name: 'Virunga National Park',
        description: 'Africa\'s oldest park with mountain gorillas',
        type: 'Nature',
        image: '🦍'
      },
      {
        name: 'Boyoma Falls',
        description: 'Series of seven cataracts on Congo River',
        type: 'Nature',
        image: '💦'
      },
      {
        name: 'Salonga National Park',
        description: 'Largest tropical rainforest reserve in Africa',
        type: 'Nature',
        image: '🌿'
      }
    ]
  },
  'BFA': {
    capital: 'Ouagadougou',
    places: [
      {
        name: 'Ruins of Loropéni',
        description: 'UNESCO World Heritage stone ruins',
        type: 'Historical Site',
        image: '🏛️'
      },
      {
        name: 'W National Park',
        description: 'Transboundary park with diverse wildlife',
        type: 'Nature',
        image: '🐘'
      },
      {
        name: 'Banfora Cascades',
        description: 'Beautiful waterfalls and natural pools',
        type: 'Nature',
        image: '💦'
      },
      {
        name: 'Sindou Peaks',
        description: 'Dramatic sandstone rock formations',
        type: 'Nature',
        image: '🗿'
      }
    ]
  },
  'MLI': {
    capital: 'Bamako',
    places: [
      {
        name: 'Timbuktu',
        description: 'Historic city and UNESCO World Heritage Site',
        type: 'Historic City',
        image: '🏛️'
      },
      {
        name: 'Djenné Mosque',
        description: 'Largest mud brick building in the world',
        type: 'Religious Site',
        image: '🕌'
      },
      {
        name: 'Dogon Country',
        description: 'Traditional villages on dramatic cliffs',
        type: 'Cultural Site',
        image: '🏘️'
      },
      {
        name: 'Niger River',
        description: 'Lifeline river flowing through the country',
        type: 'Nature',
        image: '🌊'
      }
    ]
  },

  // More European Countries  
  'WAL': {
    capital: 'Cardiff',
    places: [
      {
        name: 'Snowdonia National Park',
        description: 'Mountain wilderness with highest peak in Wales',
        type: 'Nature',
        image: '⛰️'
      },
      {
        name: 'Conwy Castle',
        description: 'Medieval fortress and UNESCO World Heritage Site',
        type: 'Castle',
        image: '🏰'
      },
      {
        name: 'Pembrokeshire Coast',
        description: 'Dramatic coastline with puffins and seals',
        type: 'Nature',
        image: '🌊'
      },
      {
        name: 'Caerphilly Castle',
        description: 'One of Britain\'s greatest medieval castles',
        type: 'Castle',
        image: '🏰'
      }
    ]
  },
  'SCO': {
    capital: 'Edinburgh',
    places: [
      {
        name: 'Edinburgh Castle',
        description: 'Historic fortress dominating the city skyline',
        type: 'Castle',
        image: '🏰'
      },
      {
        name: 'Loch Ness',
        description: 'Mysterious lake famous for its legendary monster',
        type: 'Nature',
        image: '🏞️'
      },
      {
        name: 'Isle of Skye',
        description: 'Dramatic landscapes and medieval castles',
        type: 'Island',
        image: '🏰'
      },
      {
        name: 'Scottish Highlands',
        description: 'Rugged mountains and ancient clan heritage',
        type: 'Nature',
        image: '⛰️'
      }
    ]
  },
  'NIR': {
    capital: 'Belfast',
    places: [
      {
        name: 'Giant\'s Causeway',
        description: 'UNESCO site with hexagonal basalt columns',
        type: 'Nature',
        image: '🗿'
      },
      {
        name: 'Titanic Belfast',
        description: 'Museum at birthplace of RMS Titanic',
        type: 'Museum',
        image: '🚢'
      },
      {
        name: 'Dunluce Castle',
        description: 'Dramatic clifftop castle ruins',
        type: 'Castle',
        image: '🏰'
      },
      {
        name: 'Mourne Mountains',
        description: 'Granite peaks inspiring CS Lewis\'s Narnia',
        type: 'Nature',
        image: '⛰️'
      }
    ]
  },
  'IRE': {
    capital: 'Dublin',
    places: [
      {
        name: 'Cliffs of Moher',
        description: 'Dramatic 700-foot cliffs on Atlantic coast',
        type: 'Nature',
        image: '🌊'
      },
      {
        name: 'Ring of Kerry',
        description: 'Scenic drive through mountains and coastline',
        type: 'Nature',
        image: '🚗'
      },
      {
        name: 'Trinity College Library',
        description: 'Historic library with Book of Kells',
        type: 'Cultural Site',
        image: '📚'
      },
      {
        name: 'Killarney National Park',
        description: 'Lakes, mountains, and ancient oak forests',
        type: 'Nature',
        image: '🌲'
      }
    ]
  },
  'FIN': {
    capital: 'Helsinki',
    places: [
      {
        name: 'Northern Lights',
        description: 'Aurora Borealis in Finnish Lapland',
        type: 'Natural Phenomenon',
        image: '🌌'
      },
      {
        name: 'Suomenlinna',
        description: 'Sea fortress and UNESCO World Heritage Site',
        type: 'Historical Site',
        image: '🏰'
      },
      {
        name: 'Midnight Sun',
        description: '24-hour daylight in summer months',
        type: 'Natural Phenomenon',
        image: '☀️'
      },
      {
        name: 'Saimaa Lake District',
        description: 'Thousands of lakes and endangered seals',
        type: 'Nature',
        image: '🦭'
      }
    ]
  },
  'EST': {
    capital: 'Tallinn',
    places: [
      {
        name: 'Tallinn Old Town',
        description: 'Best-preserved medieval city in Northern Europe',
        type: 'Historic City',
        image: '🏰'
      },
      {
        name: 'Lahemaa National Park',
        description: 'Pristine forests, bogs, and coastal cliffs',
        type: 'Nature',
        image: '🌲'
      },
      {
        name: 'Saaremaa Island',
        description: 'Island with windmills and medieval castle',
        type: 'Island',
        image: '💨'
      },
      {
        name: 'Tartu',
        description: 'University city with medieval charm',
        type: 'Historic City',
        image: '🏛️'
      }
    ]
  },
  'LAT': {
    capital: 'Riga',
    places: [
      {
        name: 'Riga Old Town',
        description: 'UNESCO World Heritage medieval center',
        type: 'Historic City',
        image: '🏰'
      },
      {
        name: 'Gauja National Park',
        description: 'River valley with castles and caves',
        type: 'Nature',
        image: '🏰'
      },
      {
        name: 'Jūrmala Beach',
        description: 'Popular Baltic Sea resort with wooden architecture',
        type: 'Beach',
        image: '🏖️'
      },
      {
        name: 'Rundale Palace',
        description: 'Baroque palace with magnificent gardens',
        type: 'Palace',
        image: '👑'
      }
    ]
  },
  'LIT': {
    capital: 'Vilnius',
    places: [
      {
        name: 'Vilnius Old Town',
        description: 'UNESCO World Heritage baroque city center',
        type: 'Historic City',
        image: '⛪'
      },
      {
        name: 'Trakai Castle',
        description: 'Island castle on lake near Vilnius',
        type: 'Castle',
        image: '🏰'
      },
      {
        name: 'Curonian Spit',
        description: 'UNESCO sand dune peninsula with unique ecosystems',
        type: 'Nature',
        image: '🏖️'
      },
      {
        name: 'Hill of Crosses',
        description: 'Pilgrimage site with thousands of crosses',
        type: 'Religious Site',
        image: '✝️'
      }
    ]
  },

  // Default fallback for countries not listed
  'DEFAULT': {
    capital: 'Capital City',
    places: [
      {
        name: 'National Stadium',
        description: 'Home venue for international football matches',
        type: 'Stadium',
        image: '🏟️'
      },
      {
        name: 'Historic City Center',
        description: 'Cultural heart with traditional architecture',
        type: 'Historic District',
        image: '🏛️'
      },
      {
        name: 'National Park',
        description: 'Protected natural area showcasing local wildlife',
        type: 'Nature',
        image: '🌳'
      },
      {
        name: 'Cultural Museum',
        description: 'Repository of national heritage and history',
        type: 'Museum',
        image: '🏛️'
      }
    ]
  }
}

// Function to get places for a country
export const getCountryPlaces = (countryCode) => {
  return countryPlaces[countryCode] || countryPlaces['DEFAULT']
}