import { confederations } from '../../data/confederations.js';
import { countries } from '../../data/countries.js';

// Create a ranking lookup map for faster access
const rankingLookup = new Map();
countries.forEach(country => {
  rankingLookup.set(country.name, country.worldRanking || 999);
});

class QualificationTeamService {
  /**
   * Generate teams for each confederation (ALL teams, excluding host for qualification)
   */
  generateConfederationTeams(confederationId, hostCountryCode) {
    const confederation = confederations.find(c => c.id === confederationId);
    if (!confederation) return [];

    // Get ALL countries from this confederation
    let confederationCountries = countries.filter(country =>
      country.confederation === confederationId
    );

    // Remove host country from confederation teams (host gets automatic qualification)
    if (hostCountryCode) {
      confederationCountries = confederationCountries.filter(country =>
        country.code !== hostCountryCode
      );
    }

    // Sort by ranking (world rankings if available, otherwise world ranking)
    confederationCountries.sort((a, b) => this.getTeamRanking(a) - this.getTeamRanking(b));

    return confederationCountries.map((country, index) => {
      const team = {
        teamId: `${confederationId}_${country.code}`,
        name: country.name,
        country: country.name,
        flag: country.flag,
        ranking: country.worldRanking || 999,
        confederationRank: index + 1
      };

      return team;
    });
  }

  /**
   * Get team ranking from various sources
   */
  getTeamRanking(team, currentWorld = null) {
    // Check if we have world rankings from the current world
    if (currentWorld && currentWorld.countryRankings) {
      const worldRanking = currentWorld.countryRankings.find(
        ranking => ranking.code === team.countryCode || ranking.code === team.code
      );
      if (worldRanking) {
        return worldRanking.rank || 999;
      }
    }

    // Fallback to existing system
    return team.ranking || rankingLookup.get(team.name) || rankingLookup.get(team.country) || 999;
  }

  /**
   * Calculate team power based on world ranking
   */
  calculateTeamPower(worldRanking) {
    // Handle undefined/null rankings (fallback to worst ranking)
    if (!worldRanking || worldRanking === null || worldRanking === undefined) {
      return 1;
    }

    if (worldRanking <= 5) return 20;      // Top 5 teams
    if (worldRanking <= 10) return 19;     // Top 10 teams  
    if (worldRanking <= 15) return 18;     // Top 15 teams
    if (worldRanking <= 20) return 17;     // Top 20 teams
    if (worldRanking <= 30) return 16;     // Top 30 teams
    if (worldRanking <= 40) return 15;     // Top 40 teams
    if (worldRanking <= 50) return 14;     // Top 50 teams
    if (worldRanking <= 60) return 13;     // Top 60 teams
    if (worldRanking <= 70) return 12;     // Top 70 teams
    if (worldRanking <= 80) return 11;     // Top 80 teams
    if (worldRanking <= 90) return 10;     // Top 90 teams
    if (worldRanking <= 100) return 9;     // Top 100 teams
    if (worldRanking <= 120) return 8;     // Top 120 teams
    if (worldRanking <= 140) return 7;     // Top 140 teams
    if (worldRanking <= 160) return 6;     // Top 160 teams
    if (worldRanking <= 180) return 5;     // Top 180 teams
    if (worldRanking <= 200) return 4;     // Top 200 teams
    if (worldRanking <= 220) return 3;     // Top 220 teams
    if (worldRanking <= 240) return 2;     // Top 240 teams
    return 1;                              // Everyone else
  }

  /**
   * Extract country code from teamId (e.g., "uefa_MLT" -> "MLT")
   */
  extractCountryCode(teamId) {
    if (!teamId) return teamId;
    // Split by underscore and take the last part
    const parts = teamId.split('_');
    return parts.length > 1 ? parts[parts.length - 1] : teamId;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export default new QualificationTeamService();