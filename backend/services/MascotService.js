import { countries } from '../data/countries.js';

class MascotService {
  // Mascot name templates based on country characteristics
  getMascotTemplates() {
    return {
      animals: [
        { template: '{animal} the {adjective}', weight: 3 },
        { template: '{adjective} {animal}', weight: 2 },
        { template: '{animal} {suffix}', weight: 2 },
        { template: '{prefix} {animal}', weight: 1 }
      ],
      cultural: [
        { template: '{cultural} the {adjective}', weight: 2 },
        { template: '{adjective} {cultural}', weight: 2 },
        { template: '{cultural} {suffix}', weight: 1 }
      ]
    };
  }

  // Country-specific mascot data
  getCountryMascotData() {
    return {
      // Europe
      ENG: {
        animals: ['Lion', 'Bulldog', 'Robin'],
        cultural: ['Knight', 'Guard', 'Beefeater'],
        adjectives: ['Royal', 'Noble', 'Proud', 'Brave'],
        suffixes: ['Pride', 'Heart', 'Spirit'],
        prefixes: ['Sir', 'Lord']
      },
      FRA: {
        animals: ['Rooster', 'Eagle'],
        cultural: ['Musketeer', 'Chef', 'Artist'],
        adjectives: ['Gallant', 'Élégant', 'Magnifique'],
        suffixes: ['Bleu', 'Rouge', 'Tricolore'],
        prefixes: ['Le', 'Monsieur']
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
        animals: ['Jaguar', 'Parrot', 'Toucan', 'Capybara'],
        cultural: ['Samba', 'Capoeira'],
        adjectives: ['Tropical', 'Vibrant', 'Joyful'],
        suffixes: ['Verde', 'Ouro', 'Carnaval'],
        prefixes: ['O']
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
    const templates = this.getMascotTemplates();
    
    // Randomly choose between animal or cultural mascot
    const useAnimal = Math.random() < 0.7; // 70% chance for animal
    const mascotType = useAnimal ? 'animals' : 'cultural';
    const mascotOptions = countryData[mascotType];
    
    if (!mascotOptions || mascotOptions.length === 0) {
      // Fallback to animal if cultural not available
      const fallbackOptions = countryData.animals || mascotData.DEFAULT.animals;
      const mascot = fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
      return mascot;
    }
    
    // Select template
    const templateGroup = useAnimal ? templates.animals : templates.cultural;
    const template = this.selectWeightedTemplate(templateGroup);
    
    // Select components
    const mascot = mascotOptions[Math.floor(Math.random() * mascotOptions.length)];
    const adjective = countryData.adjectives[Math.floor(Math.random() * countryData.adjectives.length)];
    const suffix = countryData.suffixes[Math.floor(Math.random() * countryData.suffixes.length)];
    const prefix = countryData.prefixes.length > 0 ? 
      countryData.prefixes[Math.floor(Math.random() * countryData.prefixes.length)] : '';
    
    // Replace template variables
    let name = template
      .replace('{animal}', mascot)
      .replace('{cultural}', mascot)
      .replace('{adjective}', adjective)
      .replace('{suffix}', suffix)
      .replace('{prefix}', prefix)
      .trim();
    
    return name;
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

  generateMascotImage(mascotName, countryCode, year) {
    // Generate a unique seed based on mascot name and tournament info
    const seed = `${mascotName}-${countryCode}-${year}`;
    
    // Using a placeholder image service that generates consistent images based on seed
    // In production, this would integrate with an actual image generation API
    const encodedSeed = encodeURIComponent(seed);
    const encodedName = encodeURIComponent(mascotName);
    
    // Using placeholder service - in production this would be replaced with actual image generation
    return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodedSeed}&scale=80&backgroundColor=b6e3f4`;
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

  generateMascot(countryCode, year) {
    const name = this.generateMascotName(countryCode);
    const imageUrl = this.generateMascotImage(name, countryCode, year);
    const description = this.generateMascotDescription(name, countryCode);
    
    return {
      name,
      imageUrl,
      description
    };
  }
}

export default new MascotService();