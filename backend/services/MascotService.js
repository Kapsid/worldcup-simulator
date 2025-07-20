import { countries } from '../data/countries.js';

class MascotService {
  // Advanced mascot types with much more variety
  getMascotTypes() {
    return {
      // Traditional animals (30% chance)
      animals: { weight: 30, types: ['animal'] },
      // Mythical creatures (25% chance)
      mythical: { weight: 25, types: ['dragon', 'phoenix', 'spirit', 'guardian'] },
      // Human/Cultural figures (20% chance)
      cultural: { weight: 20, types: ['warrior', 'dancer', 'artist', 'hero'] },
      // Abstract/Geometric (15% chance)
      abstract: { weight: 15, types: ['sphere', 'crystal', 'flame', 'star'] },
      // Hybrid/Fantasy (10% chance)
      hybrid: { weight: 10, types: ['robot_animal', 'elemental', 'cosmic', 'magical_object'] }
    };
  }

  // Name generation templates for different types
  getNameTemplates() {
    return {
      animals: [
        { template: '{name} the {adjective}', weight: 3 },
        { template: '{adjective} {name}', weight: 2 },
        { template: '{prefix} {name}', weight: 2 },
        { template: '{name} {suffix}', weight: 1 }
      ],
      mythical: [
        { template: '{name} of {element}', weight: 3 },
        { template: '{element} {name}', weight: 2 },
        { template: 'The {adjective} {name}', weight: 2 },
        { template: '{name} the {power}', weight: 1 }
      ],
      cultural: [
        { template: '{name} the {adjective}', weight: 2 },
        { template: '{title} {name}', weight: 2 },
        { template: '{name} of {location}', weight: 1 }
      ],
      abstract: [
        { template: '{name}', weight: 3 },
        { template: 'The {adjective} {name}', weight: 2 },
        { template: '{name}-{number}', weight: 1 }
      ],
      hybrid: [
        { template: '{name}-{variant}', weight: 2 },
        { template: '{prefix} {name}', weight: 2 },
        { template: '{name} {model}', weight: 1 }
      ]
    };
  }

  // Advanced country-specific mascot data with multiple types
  getCountryMascotData() {
    return {
      // Europe
      ENG: {
        animals: ['Lion', 'Bulldog', 'Robin', 'Stag', 'Badger'],
        mythical: ['Griffin', 'Unicorn', 'Wyvern', 'Phoenix of Albion'],
        cultural: ['Knight', 'Archer', 'Bard', 'Royal Guard', 'Celtic Warrior'],
        abstract: ['Crown Prism', 'Union Spark', 'Royal Beacon', 'Thames Flow'],
        hybrid: ['Mecha-Lion', 'Cyber-Knight', 'Steam Guardian', 'Holo-Crown'],
        adjectives: ['Royal', 'Noble', 'Brave', 'Legendary', 'Majestic', 'Ancient'],
        elements: ['Mist', 'Stone', 'Steel', 'Emerald', 'Thunder'],
        powers: ['Protector', 'Guardian', 'Champion', 'Defender'],
        prefixes: ['Sir', 'Lord', 'The Great', 'Saint'],
        suffixes: ['Heart', 'Pride', 'Valor', 'Glory'],
        titles: ['Captain', 'Marshal', 'Duke', 'Earl'],
        locations: ['London', 'Camelot', 'the Highlands', 'Westminster']
      },
      FRA: {
        animals: ['Rooster', 'Eagle', 'Fox', 'Swan', 'Nightingale'],
        mythical: ['Gargoyle', 'Fée', 'Draconian', 'Spirit of Versailles'],
        cultural: ['Musketeer', 'Revolutionnaire', 'Artiste', 'Chef', 'Mime'],
        abstract: ['Étoile Lumière', 'Arc Triomphe', 'Seine Flow', 'Liberty Flame'],
        hybrid: ['Cyber-Coq', 'Holo-Musketeer', 'Nano-Artiste', 'Robo-Chef'],
        adjectives: ['Élégant', 'Magnifique', 'Courageux', 'Artistique', 'Révolutionnaire'],
        elements: ['Lumière', 'Vent', 'Feu', 'Cristal', 'Étoile'],
        powers: ['Liberté', 'Égalité', 'Fraternité', 'Inspiration'],
        prefixes: ['Le', 'La', 'Monsieur', 'Madame'],
        suffixes: ['Bleu', 'Rouge', 'Tricolore', 'de France'],
        titles: ['Capitaine', 'Général', 'Maître', 'Comte'],
        locations: ['Paris', 'Versailles', 'Loire', 'Provence']
      },
      GER: {
        animals: ['Eagle', 'Bear', 'Wolf'],
        cultural: ['Kaiser', 'Brewer'],
        adjectives: ['Strong', 'Mighty', 'Precise'],
        suffixes: ['Kraft', 'Meister'],
        prefixes: ['Herr', 'Der']
      },
      ESP: {
        animals: ['Bull', 'Eagle', 'Lynx'],
        cultural: ['Matador', 'Conquistador', 'Flamenco'],
        adjectives: ['Passionate', 'Fiery', 'Noble'],
        suffixes: ['Rojo', 'Sol', 'Fuego'],
        prefixes: ['El', 'Don']
      },
      ITA: {
        animals: ['Wolf', 'Lion'],
        cultural: ['Gladiator', 'Centurion', 'Maestro'],
        adjectives: ['Azzurro', 'Passionate', 'Artistic'],
        suffixes: ['Romano', 'Italia'],
        prefixes: ['Il', 'Signor']
      },
      
      // South America  
      BRA: {
        animals: ['Jaguar', 'Toucan', 'Capybara', 'Dolphin', 'Macaw', 'Sloth', 'Armadillo'],
        mythical: ['Curupira', 'Boitatá', 'Saci-Pererê', 'Iara', 'Amazon Spirit'],
        cultural: ['Sambista', 'Capoeirista', 'Carnavalesco', 'Pescador', 'Vaqueiro'],
        abstract: ['Sol Dourado', 'Ritmo Verde', 'Alegria Sphere', 'Tropical Wave'],
        hybrid: ['Cyber-Jaguar', 'Samba-Bot', 'Holo-Tucano', 'Nano-Carnival'],
        adjectives: ['Tropical', 'Vibrante', 'Alegre', 'Mágico', 'Selvagem', 'Festivo'],
        elements: ['Sol', 'Floresta', 'Rio', 'Ouro', 'Esmeralda'],
        powers: ['Alegria', 'Energia', 'Paixão', 'Magia'],
        prefixes: ['O', 'A', 'Seu', 'Dona'],
        suffixes: ['Verde', 'Ouro', 'do Brasil', 'Tropical'],
        titles: ['Rei', 'Rainha', 'Mestre', 'Capitão'],
        locations: ['Amazônia', 'Rio', 'Salvador', 'Pantanal']
      },
      ARG: {
        animals: ['Puma', 'Condor', 'Jaguar'],
        cultural: ['Gaucho', 'Tango'],
        adjectives: ['Passionate', 'Proud', 'Strong'],
        suffixes: ['Celeste', 'Pampa'],
        prefixes: ['El']
      },
      
      // North America
      USA: {
        animals: ['Eagle', 'Bear', 'Bison'],
        cultural: ['Ranger', 'Pioneer', 'Astronaut'],
        adjectives: ['Brave', 'Free', 'Bold'],
        suffixes: ['Star', 'Liberty', 'Spirit'],
        prefixes: ['Captain', 'Mister']
      },
      MEX: {
        animals: ['Eagle', 'Jaguar', 'Coyote'],
        cultural: ['Aztec', 'Mariachi', 'Luchador'],
        adjectives: ['Valiente', 'Ancient', 'Festive'],
        suffixes: ['Sol', 'Fuego'],
        prefixes: ['El']
      },
      
      // Asia
      JPN: {
        animals: ['Tiger', 'Crane', 'Dragon', 'Tanuki'],
        cultural: ['Samurai', 'Ninja', 'Sumo'],
        adjectives: ['Honorable', 'Swift', 'Wise'],
        suffixes: ['San', 'Kun'],
        prefixes: []
      },
      KOR: {
        animals: ['Tiger', 'Bear', 'Crane'],
        cultural: ['Warrior', 'Scholar'],
        adjectives: ['Dynamic', 'Strong', 'Swift'],
        suffixes: ['Ho', 'Rang'],
        prefixes: []
      },
      
      // Africa
      RSA: {
        animals: ['Lion', 'Springbok', 'Rhino'],
        cultural: ['Warrior', 'Chief'],
        adjectives: ['Proud', 'Rainbow', 'United'],
        suffixes: ['Pride', 'Spirit'],
        prefixes: []
      },
      NGA: {
        animals: ['Eagle', 'Lion'],
        cultural: ['Prince', 'Warrior'],
        adjectives: ['Super', 'Green', 'Mighty'],
        suffixes: ['Pride', 'Power'],
        prefixes: []
      },
      
      // Oceania
      AUS: {
        animals: ['Kangaroo', 'Koala', 'Wombat', 'Platypus'],
        cultural: ['Ranger', 'Surfer'],
        adjectives: ['Aussie', 'Golden', 'Sunny'],
        suffixes: ['Mate', 'Down Under'],
        prefixes: []
      },
      
      // Default
      DEFAULT: {
        animals: ['Lion', 'Eagle', 'Tiger', 'Bear'],
        cultural: ['Champion', 'Star', 'Hero'],
        adjectives: ['Brave', 'Strong', 'Swift'],
        suffixes: ['Spirit', 'Pride', 'Power'],
        prefixes: []
      }
    };
  }

  generateMascotName(countryCode) {
    const mascotData = this.getCountryMascotData();
    const countryData = mascotData[countryCode] || mascotData.DEFAULT;
    const mascotTypes = this.getMascotTypes();
    const nameTemplates = this.getNameTemplates();
    
    // Select mascot type based on weighted probability
    const selectedType = this.selectWeightedMascotType(mascotTypes);
    const mascotCategory = this.selectMascotFromType(selectedType, countryData);
    
    if (!mascotCategory.options || mascotCategory.options.length === 0) {
      // Fallback to animals if selected type not available
      const fallbackOptions = countryData.animals || mascotData.DEFAULT.animals;
      return fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
    }
    
    // Select appropriate template for this type
    const templates = nameTemplates[selectedType] || nameTemplates.animals;
    const template = this.selectWeightedTemplate(templates);
    
    // Generate name components
    const components = this.generateNameComponents(selectedType, countryData, mascotCategory);
    
    // Replace template variables
    let name = this.applyTemplate(template, components);
    
    return { name, type: selectedType, category: mascotCategory.category };
  }

  selectWeightedMascotType(mascotTypes) {
    const totalWeight = Object.values(mascotTypes).reduce((sum, type) => sum + type.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const [typeName, typeData] of Object.entries(mascotTypes)) {
      random -= typeData.weight;
      if (random <= 0) {
        return typeName;
      }
    }
    
    return 'animals'; // fallback
  }

  selectMascotFromType(type, countryData) {
    const typeMap = {
      animals: { options: countryData.animals, category: 'Animal Spirit' },
      mythical: { options: countryData.mythical, category: 'Mythical Being' },
      cultural: { options: countryData.cultural, category: 'Cultural Icon' },
      abstract: { options: countryData.abstract, category: 'Abstract Entity' },
      hybrid: { options: countryData.hybrid, category: 'Hybrid Creation' }
    };
    
    return typeMap[type] || typeMap.animals;
  }

  generateNameComponents(type, countryData, mascotCategory) {
    const base = mascotCategory.options[Math.floor(Math.random() * mascotCategory.options.length)];
    
    return {
      name: base,
      adjective: this.selectRandom(countryData.adjectives),
      element: this.selectRandom(countryData.elements),
      power: this.selectRandom(countryData.powers),
      prefix: this.selectRandom(countryData.prefixes),
      suffix: this.selectRandom(countryData.suffixes),
      title: this.selectRandom(countryData.titles),
      location: this.selectRandom(countryData.locations),
      number: Math.floor(Math.random() * 99) + 1,
      variant: ['Alpha', 'Prime', 'Neo', 'Ultra', 'Mega'][Math.floor(Math.random() * 5)],
      model: ['X1', 'Pro', '3000', 'Elite', 'Max'][Math.floor(Math.random() * 5)]
    };
  }

  applyTemplate(template, components) {
    return template
      .replace('{name}', components.name)
      .replace('{adjective}', components.adjective)
      .replace('{element}', components.element)
      .replace('{power}', components.power)
      .replace('{prefix}', components.prefix)
      .replace('{suffix}', components.suffix)
      .replace('{title}', components.title)
      .replace('{location}', components.location)
      .replace('{number}', components.number)
      .replace('{variant}', components.variant)
      .replace('{model}', components.model)
      .trim();
  }

  selectRandom(array) {
    if (!array || array.length === 0) return '';
    return array[Math.floor(Math.random() * array.length)];
  }

  selectWeightedTemplate(templates) {
    const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const template of templates) {
      random -= template.weight;
      if (random <= 0) {
        return template.template;
      }
    }
    
    return templates[0].template;
  }

  generateMascotImage(mascotData, countryCode, year) {
    // Generate detailed image based on mascot type and characteristics
    const { name, type, category } = mascotData;
    const seed = `${name}-${countryCode}-${year}-${type}`;
    
    // Select appropriate avatar style based on mascot type
    const imageStyle = this.selectImageStyle(type);
    const colorScheme = this.getCountryColors(countryCode);
    
    // Generate more detailed image URL with style parameters
    const encodedSeed = encodeURIComponent(seed);
    const styleParams = this.generateStyleParameters(type, colorScheme);
    
    // Multiple image generation approaches based on type
    const imageUrls = this.generateMultipleImageOptions(encodedSeed, imageStyle, styleParams);
    
    return {
      primary: imageUrls.primary,
      alternatives: imageUrls.alternatives,
      style: imageStyle,
      description: this.generateImageDescription(mascotData, countryCode)
    };
  }

  selectImageStyle(type) {
    const styleMap = {
      animals: ['bottts-neutral', 'adventurer', 'fun-emoji'],
      mythical: ['personas', 'avataaars', 'pixel-art'],
      cultural: ['adventurer', 'avataaars', 'personas'],
      abstract: ['shapes', 'identicon', 'beam'],
      hybrid: ['bottts', 'pixel-art', 'micah']
    };
    
    const styles = styleMap[type] || styleMap.animals;
    return styles[Math.floor(Math.random() * styles.length)];
  }

  getCountryColors(countryCode) {
    const colorSchemes = {
      BRA: { primary: '009639', secondary: 'FEDD00', accent: '002776' },
      FRA: { primary: '002395', secondary: 'FFFFFF', accent: 'ED2939' },
      ENG: { primary: 'CF142B', secondary: 'FFFFFF', accent: '00247D' },
      GER: { primary: '000000', secondary: 'DD0000', accent: 'FFCE00' },
      DEFAULT: { primary: '1E88E5', secondary: 'FFC107', accent: '4CAF50' }
    };
    
    return colorSchemes[countryCode] || colorSchemes.DEFAULT;
  }

  generateStyleParameters(type, colors) {
    const params = {
      backgroundColor: colors.primary,
      scale: 90,
      flip: Math.random() > 0.5
    };

    // Type-specific parameters
    switch (type) {
      case 'animals':
        params.mood = ['happy', 'excited', 'confident'][Math.floor(Math.random() * 3)];
        break;
      case 'mythical':
        params.backgroundType = ['gradientLinear', 'solid'][Math.floor(Math.random() * 2)];
        params.accessories = ['variant01', 'variant02', 'variant03'][Math.floor(Math.random() * 3)];
        break;
      case 'cultural':
        params.clothing = ['variant01', 'variant02'][Math.floor(Math.random() * 2)];
        break;
      case 'abstract':
        params.colors = [colors.primary, colors.secondary, colors.accent];
        break;
      case 'hybrid':
        params.eyes = ['variant01', 'variant02', 'variant03'][Math.floor(Math.random() * 3)];
        params.antennaColor = colors.accent;
        break;
    }

    return params;
  }

  generateMultipleImageOptions(seed, style, params) {
    const baseUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
    
    // Generate parameter string
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : value}`)
      .join('&');
    
    const primary = `${baseUrl}&${paramString}`;
    
    // Generate alternative versions
    const alternatives = [
      `${baseUrl}&${paramString}&flip=true`,
      `${baseUrl}&${paramString}&scale=85`,
      `${baseUrl}&${paramString}&backgroundColor=${params.backgroundColor}&radius=50`
    ];

    return { primary, alternatives };
  }

  generateImageDescription(mascotData, countryCode) {
    const { name, type, category } = mascotData;
    const country = countries.find(c => c.code === countryCode);
    const countryName = country ? country.name : 'the host nation';
    
    const typeDescriptions = {
      animals: `a majestic ${category.toLowerCase()} representing the wildlife spirit of ${countryName}`,
      mythical: `a legendary ${category.toLowerCase()} from the folklore of ${countryName}`,
      cultural: `a proud ${category.toLowerCase()} embodying the heritage of ${countryName}`,
      abstract: `a modern ${category.toLowerCase()} symbolizing the energy of ${countryName}`,
      hybrid: `a futuristic ${category.toLowerCase()} blending tradition and innovation of ${countryName}`
    };
    
    return `${name} is ${typeDescriptions[type] || typeDescriptions.animals}, designed with vibrant colors and dynamic features that capture the essence of the tournament spirit.`;
  }

  generateMascotDescription(mascotName, countryCode) {
    const country = countries.find(c => c.code === countryCode);
    const countryName = country ? country.name : 'the host nation';
    
    const descriptions = [
      `${mascotName} embodies the spirit and passion of ${countryName}, bringing joy and excitement to fans around the world.`,
      `Representing the heart and soul of ${countryName}, ${mascotName} is here to unite fans in celebration of the beautiful game.`,
      `Born from the rich culture of ${countryName}, ${mascotName} symbolizes the unity and friendship that football brings to all nations.`,
      `${mascotName} carries the dreams and hopes of ${countryName}, inspiring players and fans alike throughout the tournament.`,
      `With boundless energy and enthusiasm, ${mascotName} represents the vibrant spirit of ${countryName} and the global football community.`
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  generateMascotPersonality(mascotName, countryCode) {
    const personalities = [
      'energetic and playful',
      'wise and encouraging',
      'mischievous but lovable',
      'brave and adventurous',
      'friendly and welcoming',
      'competitive but fair',
      'cheerful and optimistic'
    ];
    
    const traits = [
      'loves to dance with fans',
      'always ready with a high-five',
      'enjoys playing football tricks',
      'brings good luck to teams',
      'speaks all languages through gestures',
      'has magical football skills',
      'can predict match outcomes'
    ];
    
    const personality = personalities[Math.floor(Math.random() * personalities.length)];
    const trait = traits[Math.floor(Math.random() * traits.length)];
    
    return `${mascotName} is ${personality}, and ${trait}. Known for bringing smiles to children and adults alike!`;
  }

  generateMascotBackstory(mascotName, countryCode) {
    const country = countries.find(c => c.code === countryCode);
    const countryName = country ? country.name : 'the host nation';
    
    const origins = [
      `discovered in an ancient football stadium`,
      `born from the collective dreams of football fans`,
      `emerged from a magical football during a full moon`,
      `found in a secret cave adorned with football murals`,
      `appeared when children wished for a tournament guardian`,
      `awakened by the sound of cheering crowds`,
      `created by the spirit of fair play itself`
    ];
    
    const origin = origins[Math.floor(Math.random() * origins.length)];
    
    return `Legend says ${mascotName} was ${origin} in ${countryName}. Since then, ${mascotName} has been the guardian of football joy, appearing whenever the World Cup comes to town.`;
  }

  generateMascot(countryCode, year) {
    const mascotData = this.generateMascotName(countryCode);
    const imageData = this.generateMascotImage(mascotData, countryCode, year);
    const description = this.generateMascotDescription(mascotData.name, countryCode);
    const personality = this.generateMascotPersonality(mascotData.name, countryCode);
    const backstory = this.generateMascotBackstory(mascotData.name, countryCode);
    
    return {
      name: mascotData.name,
      type: mascotData.type,
      category: mascotData.category,
      imageUrl: imageData.primary,
      imageAlternatives: imageData.alternatives,
      imageStyle: imageData.style,
      imageDescription: imageData.description,
      description,
      personality,
      backstory
    };
  }
}

export default new MascotService();