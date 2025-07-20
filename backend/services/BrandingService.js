import { countries } from '../data/countries.js';

class BrandingService {
  // Generate tournament logo based on World Cup visual traditions
  generateLogo(countryCode, year, tournamentName) {
    const country = countries.find(c => c.code === countryCode);
    const countryName = country ? country.name : 'Unknown';
    
    // Logo elements inspired by real World Cup logos
    const countryElements = this.getCountryElements(countryCode);
    const designElements = this.getDesignElements();
    const colorScheme = this.getColorScheme(countryCode);
    
    // Select 3-4 key elements for the logo
    const selectedElements = [];
    selectedElements.push(countryElements.primary);
    selectedElements.push(`Football/Soccer ball`);
    selectedElements.push(`${year} year mark`);
    if (Math.random() > 0.5) {
      selectedElements.push(countryElements.secondary);
    }
    
    const style = designElements[Math.floor(Math.random() * designElements.length)];
    
    // Generate placeholder logo (in production, would use actual image generation)
    const seed = `logo-${countryCode}-${year}-${Date.now()}`;
    const imageUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=${colorScheme.primary.slice(1)}`;
    
    const description = `The ${year} ${countryName} World Cup logo features ${selectedElements.join(', ')} in a ${style} design. The color palette draws from ${colorScheme.description}, creating a vibrant and memorable identity.`;
    
    return {
      imageUrl,
      description,
      elements: selectedElements,
      colorScheme
    };
  }
  
  getCountryElements(countryCode) {
    const elements = {
      BRA: { primary: 'Christ the Redeemer silhouette', secondary: 'Samba rhythm waves' },
      ARG: { primary: 'Sun of May', secondary: 'Tango dancers' },
      GER: { primary: 'Brandenburg Gate arch', secondary: 'Eagle wings' },
      FRA: { primary: 'Eiffel Tower outline', secondary: 'Fleur-de-lis' },
      ESP: { primary: 'Bull horns', secondary: 'Flamenco fan' },
      ITA: { primary: 'Colosseum arches', secondary: 'Renaissance patterns' },
      ENG: { primary: 'Three Lions', secondary: 'Crown elements' },
      JPN: { primary: 'Rising sun rays', secondary: 'Mount Fuji silhouette' },
      USA: { primary: 'Stars and stripes motif', secondary: 'Liberty torch' },
      MEX: { primary: 'Aztec pyramid steps', secondary: 'Eagle and serpent' },
      AUS: { primary: 'Southern Cross stars', secondary: 'Kangaroo silhouette' },
      RSA: { primary: 'Rainbow nation curves', secondary: 'Protea flower' },
      DEFAULT: { primary: 'National flag elements', secondary: 'Cultural symbols' }
    };
    
    return elements[countryCode] || elements.DEFAULT;
  }
  
  getDesignElements() {
    return [
      'modern geometric',
      'dynamic flowing',
      'traditional ornamental',
      'minimalist abstract',
      'vibrant cultural fusion',
      'bold contemporary'
    ];
  }
  
  getColorScheme(countryCode) {
    const schemes = {
      BRA: { primary: '#009739', secondary: '#FEDD00', accent: '#002776', description: 'Brazilian flag colors' },
      ARG: { primary: '#74ACDF', secondary: '#FFFFFF', accent: '#F6B40E', description: 'Argentine sky blue and white' },
      GER: { primary: '#000000', secondary: '#DD0000', accent: '#FFCE00', description: 'German tricolor' },
      FRA: { primary: '#002395', secondary: '#FFFFFF', accent: '#ED2939', description: 'French tricolor' },
      ESP: { primary: '#AA151B', secondary: '#F1BF00', accent: '#AA151B', description: 'Spanish red and gold' },
      ITA: { primary: '#009246', secondary: '#FFFFFF', accent: '#CE2B37', description: 'Italian tricolor' },
      ENG: { primary: '#CF142B', secondary: '#FFFFFF', accent: '#00247D', description: 'English red, white and blue' },
      JPN: { primary: '#BC002D', secondary: '#FFFFFF', accent: '#BC002D', description: 'Japanese red and white' },
      USA: { primary: '#002868', secondary: '#FFFFFF', accent: '#BF0A30', description: 'American patriotic colors' },
      MEX: { primary: '#006847', secondary: '#FFFFFF', accent: '#CE1126', description: 'Mexican tricolor' },
      DEFAULT: { primary: '#1E88E5', secondary: '#FFC107', accent: '#4CAF50', description: 'vibrant international colors' }
    };
    
    return schemes[countryCode] || schemes.DEFAULT;
  }
  
  // Generate tournament anthem
  generateAnthem(countryCode, year, tournamentName) {
    const country = countries.find(c => c.code === countryCode);
    const countryName = country ? country.name : 'the World';
    
    const styles = this.getMusicalStyles(countryCode);
    const style = styles[Math.floor(Math.random() * styles.length)];
    
    const title = this.generateAnthemTitle(countryName, year);
    const lyrics = this.generateAnthemLyrics(countryName, year);
    
    return {
      title,
      lyrics,
      style,
      duration: '2:30'
    };
  }
  
  getMusicalStyles(countryCode) {
    const styles = {
      BRA: ['Samba-inspired anthem', 'Bossa nova rhythm', 'Carnival celebration'],
      ARG: ['Tango-influenced melody', 'Folk-inspired anthem', 'Passionate orchestral'],
      ESP: ['Flamenco-fusion', 'Mediterranean melody', 'Festive Spanish rhythm'],
      ITA: ['Operatic anthem', 'Classical Italian', 'Modern tarantella'],
      ENG: ['Stadium rock anthem', 'Traditional brass band', 'Modern pop anthem'],
      FRA: ['Chanson-style melody', 'Electronic dance anthem', 'Classical French'],
      GER: ['Electronic dance anthem', 'Classical orchestral', 'Modern rock anthem'],
      JPN: ['J-Pop inspired', 'Traditional meets modern', 'Anime-style epic'],
      USA: ['Rock anthem', 'Hip-hop influenced', 'Country-pop fusion'],
      MEX: ['Mariachi-inspired', 'Modern Latin pop', 'Traditional folk melody'],
      DEFAULT: ['Uplifting orchestral', 'Modern pop anthem', 'World music fusion']
    };
    
    return styles[countryCode] || styles.DEFAULT;
  }
  
  generateAnthemTitle(countryName, year) {
    const templates = [
      `${countryName} Dreams ${year}`,
      `United by Football`,
      `Rise Up ${countryName}`,
      `Glory of ${year}`,
      `One Game, One World`,
      `Champions of Tomorrow`,
      `The Beautiful Game ${year}`,
      `${countryName} Celebrates`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  generateAnthemLyrics(countryName, year) {
    const verses = [
      `From ${countryName} to the world, we welcome you
Under one sky, dreams come true
Feel the rhythm, hear the call
${year} unites us all!`,

      `In ${countryName}, the stage is set
Champions rise, no regrets  
Every nation, every heart
Together we'll never part!`,

      `The beautiful game brings us near
${year} - our moment here
From every corner of the Earth
Football shows what dreams are worth!`
    ];
    
    const choruses = [
      `Oh-oh-oh, let the games begin!
Oh-oh-oh, may the best team win!
${countryName} ${year}, forever in our hearts
Where the world comes together, and magic starts!`,
      
      `Rise up, rise up, feel the beat!
${year} brings the world to its feet!
One ball, one dream, one destiny
${countryName} writes football history!`,
      
      `We are one, under the sun
${year} has just begun!
Feel the power, feel the pride
${countryName} by your side!`
    ];
    
    const verse = verses[Math.floor(Math.random() * verses.length)];
    const chorus = choruses[Math.floor(Math.random() * choruses.length)];
    
    return `[Verse 1]\n${verse}\n\n[Chorus]\n${chorus}\n\n[Verse 2]\nFlags are flying, colors bright\nUnder stadium lights tonight\nEvery goal a celebration\nUnited nations in elation!\n\n[Chorus]\n${chorus}\n\n[Bridge]\nFrom the group stage to the final\nEvery moment, pure and vital\n${countryName} ${year}\nThe memories we'll hold dear!\n\n[Final Chorus]\n${chorus}\n(${countryName}! ${countryName}! ${year}!)`;
  }

  // Generate official tournament ball design
  generateBallDesign(countryCode, year, tournamentName) {
    const country = countries.find(c => c.code === countryCode);
    const countryName = country ? country.name : 'the World';
    
    const ballName = this.generateBallName(countryName, year);
    const designElements = this.getBallDesignElements(countryCode);
    const colorScheme = this.getColorScheme(countryCode);
    const technology = this.getBallTechnology();
    
    // Generate ball pattern based on country inspiration
    const pattern = this.generateBallPattern(countryCode);
    const panelCount = this.selectPanelConfiguration();
    
    // Generate realistic football ball with country colors
    const seed = `ball-${countryCode}-${year}-${Date.now()}`;
    // Create a proper football ball using the shapes API with circular design
    const imageUrl = this.generateFootballBallImage(seed, colorScheme);
    
    const description = `The ${ballName} features ${designElements.pattern} with ${panelCount.description}. Inspired by ${designElements.inspiration}, the ball incorporates ${colorScheme.description} in a ${pattern.style} design. Advanced ${technology.name} technology ensures optimal flight characteristics and player control.`;
    
    return {
      name: ballName,
      imageUrl,
      description,
      designElements: {
        pattern: pattern.name,
        inspiration: designElements.inspiration,
        panelCount: panelCount.count,
        technology: technology.name
      },
      colorScheme,
      specifications: {
        circumference: '68-70 cm',
        weight: '410-450 grams',
        pressure: '0.6-1.1 atmosphere',
        technology: technology.description
      }
    };
  }

  generateBallName(countryName, year) {
    const prefixes = [
      `${countryName}`,
      `${year}`,
      'Mundial',
      'Copa',
      'Championship',
      'Victory',
      'Glory',
      'Unity'
    ];
    
    const suffixes = [
      'Sphere',
      'Star',
      'Dream',
      'Flight',
      'Motion',
      'Spirit',
      'Power',
      'Pro',
      'Elite',
      'Match'
    ];
    
    const patterns = [
      '{prefix} {suffix}',
      '{suffix} {year}',
      '{country} {suffix}',
      'The {suffix}',
      '{prefix}-{suffix}'
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return pattern
      .replace('{prefix}', prefix)
      .replace('{suffix}', suffix)
      .replace('{year}', year)
      .replace('{country}', countryName);
  }

  getBallDesignElements(countryCode) {
    const elements = {
      BRA: { 
        pattern: 'carnival-inspired curves and rhythmic waves',
        inspiration: 'the vibrant energy of Brazilian carnival and samba rhythms'
      },
      ARG: { 
        pattern: 'sun ray patterns radiating from center panels',
        inspiration: 'the Sun of May and Argentine passion for football'
      },
      GER: { 
        pattern: 'precise geometric lines and angular segments',
        inspiration: 'German engineering precision and architectural heritage'
      },
      FRA: { 
        pattern: 'elegant flowing curves with tricolor accents',
        inspiration: 'French artistry and the revolutionary spirit of liberty'
      },
      ESP: { 
        pattern: 'dynamic flame-like patterns',
        inspiration: 'Spanish passion and the energy of flamenco'
      },
      ITA: { 
        pattern: 'classical renaissance-inspired panels',
        inspiration: 'Italian artistic heritage and Roman architectural beauty'
      },
      ENG: { 
        pattern: 'traditional hexagonal panels with crown motifs',
        inspiration: 'English football tradition and royal heritage'
      },
      JPN: { 
        pattern: 'minimalist zen circles with origami-inspired folds',
        inspiration: 'Japanese harmony of tradition and innovation'
      },
      USA: { 
        pattern: 'star-spangled dynamic panels',
        inspiration: 'American dreams and the pursuit of excellence'
      },
      MEX: { 
        pattern: 'aztec-inspired geometric patterns',
        inspiration: 'ancient Mexican civilizations and modern festival colors'
      },
      DEFAULT: { 
        pattern: 'modern aerodynamic panel design',
        inspiration: 'the universal language of football'
      }
    };
    
    return elements[countryCode] || elements.DEFAULT;
  }

  generateBallPattern(countryCode) {
    const patterns = {
      BRA: { name: 'Samba Flow', style: 'flowing and rhythmic' },
      ARG: { name: 'Solar Radiance', style: 'radiating and bold' },
      GER: { name: 'Precision Grid', style: 'geometric and structured' },
      FRA: { name: 'Artistic Curves', style: 'elegant and sophisticated' },
      ESP: { name: 'Passion Flames', style: 'dynamic and energetic' },
      ITA: { name: 'Renaissance Beauty', style: 'classical and artistic' },
      ENG: { name: 'Traditional Crown', style: 'classic and noble' },
      JPN: { name: 'Zen Harmony', style: 'minimalist and balanced' },
      USA: { name: 'Liberty Stars', style: 'patriotic and dynamic' },
      MEX: { name: 'Aztec Heritage', style: 'cultural and vibrant' },
      DEFAULT: { name: 'Global Unity', style: 'modern and universal' }
    };
    
    return patterns[countryCode] || patterns.DEFAULT;
  }

  selectPanelConfiguration() {
    const configurations = [
      { count: 32, description: '32 traditional panels in classic configuration' },
      { count: 14, description: '14 thermally bonded panels for enhanced aerodynamics' },
      { count: 18, description: '18 seamless panels with advanced curvature' },
      { count: 6, description: '6 large panels with innovative surface texture' },
      { count: 12, description: '12 pentagonal panels in modern arrangement' }
    ];
    
    return configurations[Math.floor(Math.random() * configurations.length)];
  }

  getBallTechnology() {
    const technologies = [
      {
        name: 'AeroFlight',
        description: 'Advanced aerodynamic surface with micro-textured panels for stable flight trajectory'
      },
      {
        name: 'TouchGrip',
        description: 'Enhanced surface grip technology for superior ball control in all weather conditions'
      },
      {
        name: 'SpeedCore',
        description: 'Ultra-responsive core construction for consistent bounce and optimal energy return'
      },
      {
        name: 'WeatherShield',
        description: 'Water-resistant coating with temperature-stable materials for consistent performance'
      },
      {
        name: 'PrecisionFlight',
        description: 'Scientifically engineered panel geometry for predictable ball movement and accuracy'
      }
    ];
    
    return technologies[Math.floor(Math.random() * technologies.length)];
  }

  generateFootballBallImage(seed, colorScheme) {
    // Create a football ball SVG with realistic pentagon/hexagon pattern
    const ballSize = 200;
    const radius = ballSize / 2 - 10;
    const centerX = ballSize / 2;
    const centerY = ballSize / 2;
    
    // Create SVG with football pattern
    const svg = `<svg width="${ballSize}" height="${ballSize}" viewBox="0 0 ${ballSize} ${ballSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ballGradient" cx="0.3" cy="0.3" r="0.8">
          <stop offset="0%" style="stop-color:${colorScheme.secondary};stop-opacity:1" />
          <stop offset="60%" style="stop-color:${colorScheme.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colorScheme.accent};stop-opacity:1" />
        </radialGradient>
        <pattern id="footballPattern" patternUnits="userSpaceOnUse" width="40" height="40">
          <polygon points="20,5 35,15 35,25 20,35 5,25 5,15" fill="none" stroke="${colorScheme.accent}" stroke-width="2"/>
          <circle cx="20" cy="20" r="8" fill="none" stroke="${colorScheme.secondary}" stroke-width="1.5"/>
        </pattern>
      </defs>
      
      <!-- Main ball sphere -->
      <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="url(#ballGradient)" stroke="${colorScheme.accent}" stroke-width="3"/>
      
      <!-- Football pattern overlay -->
      <circle cx="${centerX}" cy="${centerY}" r="${radius - 3}" fill="url(#footballPattern)" opacity="0.3"/>
      
      <!-- Central pentagon -->
      <polygon points="${centerX},${centerY-15} ${centerX+14},${centerY-5} ${centerX+9},${centerY+12} ${centerX-9},${centerY+12} ${centerX-14},${centerY-5}" 
               fill="${colorScheme.accent}" stroke="${colorScheme.primary}" stroke-width="2" opacity="0.8"/>
      
      <!-- Hexagon patterns around center -->
      <polygon points="${centerX-20},${centerY-30} ${centerX-5},${centerY-35} ${centerX+10},${centerY-30} ${centerX+10},${centerY-15} ${centerX-5},${centerY-10} ${centerX-20},${centerY-15}" 
               fill="none" stroke="${colorScheme.primary}" stroke-width="2" opacity="0.6"/>
      <polygon points="${centerX+10},${centerY-15} ${centerX+25},${centerY-20} ${centerX+35},${centerY-5} ${centerX+30},${centerY+10} ${centerX+15},${centerY+15} ${centerX+10},${centerY}" 
               fill="none" stroke="${colorScheme.primary}" stroke-width="2" opacity="0.6"/>
      <polygon points="${centerX-30},${centerY+5} ${centerX-15},${centerY} ${centerX-10},${centerY+15} ${centerX-25},${centerY+25} ${centerX-40},${centerY+20} ${centerX-35},${centerY+5}" 
               fill="none" stroke="${colorScheme.primary}" stroke-width="2" opacity="0.6"/>
      
      <!-- Highlight for 3D effect -->
      <ellipse cx="${centerX-20}" cy="${centerY-20}" rx="15" ry="25" fill="white" opacity="0.3"/>
    </svg>`;
    
    // Convert SVG to data URL
    const encodedSvg = encodeURIComponent(svg);
    return `data:image/svg+xml,${encodedSvg}`;
  }
}

export default new BrandingService();