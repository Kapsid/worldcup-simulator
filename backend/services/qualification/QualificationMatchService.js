import QualificationTeamService from './QualificationTeamService.js';

class QualificationMatchService {
  /**
   * Generate all matches for all groups with proper round-robin
   */
  generateAllMatches(confederations) {
    const allMatches = [];

    // First, generate all matches for each confederation and organize by round
    const confederationMatches = {};
    let maxRounds = 0;

    for (const confederation of confederations) {
      confederationMatches[confederation.confederationId] = {};

      for (const group of confederation.groups) {
        const groupMatches = this.generateAllGroupMatches(
          confederation.confederationId,
          group
        );

        // Organize matches by round
        const matchesByRound = this.organizeMatchesByRound(groupMatches, group.teams.length);

        for (const [round, matches] of Object.entries(matchesByRound)) {
          const roundNum = parseInt(round);
          if (!confederationMatches[confederation.confederationId][roundNum]) {
            confederationMatches[confederation.confederationId][roundNum] = [];
          }
          confederationMatches[confederation.confederationId][roundNum].push(...matches);
          maxRounds = Math.max(maxRounds, roundNum);
        }
      }
    }

    // Now assign matchdays - each round across all confederations gets a matchday
    for (let round = 1; round <= maxRounds; round++) {
      for (const confederation of confederations) {
        const roundMatches = confederationMatches[confederation.confederationId][round] || [];

        roundMatches.forEach(match => {
          match.round = round;
          match.matchday = round;
          allMatches.push(match);
        });
      }
    }

    return allMatches;
  }

  /**
   * Generate all matches for a single group (complete round-robin)
   */
  generateAllGroupMatches(confederationId, group) {
    const teams = group.teams;
    const n = teams.length;
    const matches = [];

    if (n < 2) return matches;

    // Check if this confederation plays home and away matches
    const isDoubleRoundRobin = confederationId === 'uefa' || confederationId === 'conmebol' || confederationId === 'caf' || confederationId === 'ofc' || confederationId === 'afc';

    // Generate all possible matches
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const teamA = teams[i];
        const teamB = teams[j];

        // First match: teamA at home
        matches.push({
          matchId: `${group.groupId}_${teamA.teamId}_vs_${teamB.teamId}`,
          groupId: group.groupId,
          homeTeam: {
            teamId: teamA.teamId,
            name: teamA.name,
            country: teamA.country,
            flag: teamA.flag,
            ranking: teamA.ranking
          },
          awayTeam: {
            teamId: teamB.teamId,
            name: teamB.name,
            country: teamB.country,
            flag: teamB.flag,
            ranking: teamB.ranking
          },
          homeScore: null,
          awayScore: null,
          played: false,
          date: new Date()
        });

        // For double round-robin confederations, add the return match
        if (isDoubleRoundRobin) {
          matches.push({
            matchId: `${group.groupId}_${teamB.teamId}_vs_${teamA.teamId}`,
            groupId: group.groupId,
            homeTeam: {
              teamId: teamB.teamId,
              name: teamB.name,
              country: teamB.country,
              flag: teamB.flag,
              ranking: teamB.ranking
            },
            awayTeam: {
              teamId: teamA.teamId,
              name: teamA.name,
              country: teamA.country,
              flag: teamA.flag,
              ranking: teamA.ranking
            },
            homeScore: null,
            awayScore: null,
            played: false,
            date: new Date()
          });
        }
      }
    }

    return matches;
  }

  /**
   * Organize matches into rounds ensuring balanced distribution using round-robin algorithm
   */
  organizeMatchesByRound(matches, numTeams) {
    if (matches.length === 0) return {};

    // Get all unique teams
    const allTeams = new Set();
    matches.forEach(match => {
      allTeams.add(match.homeTeam.teamId);
      allTeams.add(match.awayTeam.teamId);
    });
    const teamIds = Array.from(allTeams);
    const n = teamIds.length;

    // Create match lookup for quick access
    const matchLookup = new Map();
    matches.forEach(match => {
      const key1 = `${match.homeTeam.teamId}-${match.awayTeam.teamId}`;
      const key2 = `${match.awayTeam.teamId}-${match.homeTeam.teamId}`;
      matchLookup.set(key1, match);
      matchLookup.set(key2, match);
    });

    const rounds = {};
    let round = 1;

    // Round-robin scheduling using circle method
    if (n % 2 === 1) {
      // Odd number of teams - one team has bye each round
      for (let roundIdx = 0; roundIdx < n; roundIdx++) {
        rounds[round] = [];

        for (let i = 0; i < Math.floor(n / 2); i++) {
          const team1Idx = (roundIdx + i) % n;
          const team2Idx = (roundIdx + n - 1 - i) % n;

          const team1 = teamIds[team1Idx];
          const team2 = teamIds[team2Idx];

          const key = `${team1}-${team2}`;
          const match = matchLookup.get(key);

          if (match) {
            rounds[round].push(match);
          }
        }

        if (rounds[round].length > 0) {
          round++;
        }
      }
    } else {
      // Even number of teams - perfect pairing
      for (let roundIdx = 0; roundIdx < n - 1; roundIdx++) {
        rounds[round] = [];

        for (let i = 0; i < n / 2; i++) {
          let team1Idx, team2Idx;

          if (i === 0) {
            team1Idx = 0;
            team2Idx = roundIdx + 1;
          } else {
            team1Idx = (roundIdx + i) % (n - 1) + 1;
            team2Idx = (roundIdx + n - 1 - i) % (n - 1) + 1;
          }

          const team1 = teamIds[team1Idx];
          const team2 = teamIds[team2Idx];

          const key = `${team1}-${team2}`;
          const match = matchLookup.get(key);

          if (match) {
            rounds[round].push(match);
          }
        }

        if (rounds[round].length > 0) {
          round++;
        }
      }
    }

    // Handle any remaining matches that weren't scheduled (e.g., return matches in double round-robin)
    const scheduledMatches = new Set();
    Object.values(rounds).forEach(roundMatches => {
      roundMatches.forEach(match => {
        scheduledMatches.add(match.matchId);
      });
    });

    const unscheduledMatches = matches.filter(match => !scheduledMatches.has(match.matchId));

    if (unscheduledMatches.length > 0) {
      // Schedule remaining matches using the same round-robin pattern
      const secondRoundStart = round;

      if (n % 2 === 1) {
        for (let roundIdx = 0; roundIdx < n; roundIdx++) {
          const currentRound = secondRoundStart + roundIdx;
          if (!rounds[currentRound]) rounds[currentRound] = [];

          for (let i = 0; i < Math.floor(n / 2); i++) {
            const team1Idx = (roundIdx + i) % n;
            const team2Idx = (roundIdx + n - 1 - i) % n;

            const team1 = teamIds[team1Idx];
            const team2 = teamIds[team2Idx];

            // Look for return match
            const returnMatch = unscheduledMatches.find(match =>
              (match.homeTeam.teamId === team2 && match.awayTeam.teamId === team1) ||
              (match.homeTeam.teamId === team1 && match.awayTeam.teamId === team2)
            );

            if (returnMatch) {
              rounds[currentRound].push(returnMatch);
              const index = unscheduledMatches.indexOf(returnMatch);
              unscheduledMatches.splice(index, 1);
            }
          }
        }
      } else {
        for (let roundIdx = 0; roundIdx < n - 1; roundIdx++) {
          const currentRound = secondRoundStart + roundIdx;
          if (!rounds[currentRound]) rounds[currentRound] = [];

          for (let i = 0; i < n / 2; i++) {
            let team1Idx, team2Idx;

            if (i === 0) {
              team1Idx = 0;
              team2Idx = roundIdx + 1;
            } else {
              team1Idx = (roundIdx + i) % (n - 1) + 1;
              team2Idx = (roundIdx + n - 1 - i) % (n - 1) + 1;
            }

            const team1 = teamIds[team1Idx];
            const team2 = teamIds[team2Idx];

            // Look for return match
            const returnMatch = unscheduledMatches.find(match =>
              (match.homeTeam.teamId === team2 && match.awayTeam.teamId === team1) ||
              (match.homeTeam.teamId === team1 && match.awayTeam.teamId === team2)
            );

            if (returnMatch) {
              rounds[currentRound].push(returnMatch);
              const index = unscheduledMatches.indexOf(returnMatch);
              unscheduledMatches.splice(index, 1);
            }
          }
        }
      }
    }

    return rounds;
  }

  /**
   * Simulate a match between two teams
   */
  simulateMatch(homeTeam, awayTeam, currentWorld = null) {
    // Get rankings using world rankings if available, otherwise world rankings
    let homeRanking = QualificationTeamService.getTeamRanking(homeTeam, currentWorld);
    let awayRanking = QualificationTeamService.getTeamRanking(awayTeam, currentWorld);

    const homePower = QualificationTeamService.calculateTeamPower(homeRanking);
    const awayPower = QualificationTeamService.calculateTeamPower(awayRanking);

    // Calculate power difference (-19 to +19)
    const powerDiff = homePower - awayPower;

    // Home advantage (+2 power boost)
    const adjustedPowerDiff = powerDiff + 2;

    // Surprise factor for qualifying - MUCH rarer and smaller (0.5% chance instead of 1%)
    let surpriseFactor = 0;
    if (Math.random() < 0.005) {
      // Maximum surprise VERY limited for qualifying
      const maxSurprise = Math.max(1, 4 - Math.abs(powerDiff) / 3);
      surpriseFactor = Math.random() < 0.5 ? -maxSurprise : maxSurprise;
    }
    const finalPowerDiff = adjustedPowerDiff + surpriseFactor;

    // Base outcomes with realistic football scores
    const outcomes = [
      { home: 0, away: 0, weight: 8 },   // Boring draw
      { home: 1, away: 0, weight: 15 },  // Classic 1-0
      { home: 0, away: 1, weight: 15 },  // Away win
      { home: 1, away: 1, weight: 12 },  // Standard draw
      { home: 2, away: 0, weight: 12 },  // Comfortable win
      { home: 0, away: 2, weight: 12 },  // Away dominance
      { home: 2, away: 1, weight: 10 },  // Close win
      { home: 1, away: 2, weight: 10 },  // Away comeback
      { home: 2, away: 2, weight: 5 },   // Entertaining draw
      { home: 3, away: 0, weight: 4 },   // Convincing win
      { home: 0, away: 3, weight: 4 },   // Away statement
      { home: 3, away: 1, weight: 3 },   // Strong performance
      { home: 1, away: 3, weight: 3 },   // Away dominance
      { home: 3, away: 2, weight: 2 },   // Thriller
      { home: 2, away: 3, weight: 2 },   // Away thriller
      { home: 3, away: 3, weight: 0.5 }, // Epic draw
      { home: 4, away: 0, weight: 1 },   // Demolition
      { home: 0, away: 4, weight: 1 },   // Away demolition
      { home: 4, away: 1, weight: 0.8 }, // Big win
      { home: 1, away: 4, weight: 0.8 }, // Big away win
      { home: 4, away: 2, weight: 0.5 }, // High scoring
      { home: 2, away: 4, weight: 0.5 }, // Away high scoring
      { home: 4, away: 3, weight: 0.3 }, // Goal fest
      { home: 3, away: 4, weight: 0.3 }, // Away goal fest
      { home: 5, away: 0, weight: 0.2 }, // Rare rout
      { home: 0, away: 5, weight: 0.2 }, // Rare away rout
      { home: 5, away: 1, weight: 0.1 }, // Big scoreline
      { home: 1, away: 5, weight: 0.1 }, // Big away scoreline
      { home: 5, away: 2, weight: 0.05 }, // Crazy scoreline
      { home: 2, away: 5, weight: 0.05 }, // Crazy away win
      { home: 4, away: 4, weight: 0.05 }, // Insane draw
      { home: 6, away: 1, weight: 0.02 }, // Unbelievable
      { home: 1, away: 6, weight: 0.02 }, // Unbelievable away
      { home: 8, away: 0, weight: 0.01 }, // Once in a lifetime
      { home: 0, away: 8, weight: 0.01 }  // Historic upset
    ];

    // Adjust weights based on power difference
    const adjustedOutcomes = outcomes.map(outcome => {
      let weight = outcome.weight;
      const goalDiff = outcome.home - outcome.away;

      // If home team is stronger, favor home wins - VERY MILD for qualifying
      if (finalPowerDiff > 0) {
        if (goalDiff > 0) {
          weight *= Math.pow(1.08, Math.min(finalPowerDiff, 12)); // Very mild boost for favorites in qualifying
        } else if (goalDiff < 0) {
          weight *= Math.pow(0.92, Math.min(finalPowerDiff, 12)); // Very mild reduction for upsets
        } else {
          // Draws become slightly less likely with bigger power differences
          weight *= Math.pow(0.98, Math.min(finalPowerDiff / 2, 8));
        }
      } else if (finalPowerDiff < 0) {
        // If away team is stronger, favor away wins
        if (goalDiff < 0) {
          weight *= Math.pow(1.08, Math.min(Math.abs(finalPowerDiff), 12)); // Very mild boost for favorites
        } else if (goalDiff > 0) {
          weight *= Math.pow(0.92, Math.min(Math.abs(finalPowerDiff), 12)); // Very mild reduction for upsets
        } else {
          // Draws become slightly less likely with bigger power differences
          weight *= Math.pow(0.98, Math.min(Math.abs(finalPowerDiff) / 2, 8));
        }
      }

      // For medium power differences (>7), start favoring the stronger team in qualifying
      if (Math.abs(finalPowerDiff) > 7 && Math.abs(finalPowerDiff) <= 12) {
        const favoredGoalDiff = finalPowerDiff > 0 ? goalDiff : -goalDiff;
        if (favoredGoalDiff < 0) {
          // Upset result - make it less likely but still quite possible
          weight *= 0.85; // 15% reduction (was 25%)
        } else if (favoredGoalDiff === 0 && Math.abs(goalDiff) === 0) {
          // 0-0 draw with decent power gap
          weight *= 0.9; // 10% reduction (was 15%)
        }
      }

      // For large power differences (>12), favor the stronger team - MILD for qualifying
      if (Math.abs(finalPowerDiff) > 12) {
        const favoredGoalDiff = finalPowerDiff > 0 ? goalDiff : -goalDiff;
        if (favoredGoalDiff < 0) {
          // Upset result - make it less likely but still possible
          weight *= 0.6; // 40% reduction (was 60%)
        } else if (favoredGoalDiff === 0 && Math.abs(goalDiff) === 0) {
          // 0-0 draw with huge power gap - somewhat less likely
          weight *= 0.7; // 30% reduction (was 40%)
        } else if (favoredGoalDiff > 0 && favoredGoalDiff < 2) {
          // Small wins when big difference expected - mild reduction
          weight *= 0.85; // Was 0.8
        }

        // Big power differences should lead to more goals
        const totalGoals = outcome.home + outcome.away;
        if (totalGoals >= 4 && favoredGoalDiff > 2) {
          weight *= 1.3; // Increase high-scoring games when favorite dominates (was 1.5)
        }
      }

      // For extreme power differences (>17), make upsets rare - MODERATE for qualifying
      if (Math.abs(finalPowerDiff) > 17) {
        const favoredGoalDiff = finalPowerDiff > 0 ? goalDiff : -goalDiff;
        if (favoredGoalDiff < 0) {
          weight *= 0.35; // 65% reduction - rare but not impossible (was 80%)
        } else if (favoredGoalDiff === 0) {
          weight *= 0.5; // 50% reduction for any draw (was 60%)
        } else if (favoredGoalDiff < 3) {
          // Expect bigger wins with huge power gaps
          weight *= 0.8; // Was 0.7
        }
      }

      // Big power differences increase chances of big scorelines
      if (Math.abs(finalPowerDiff) > 8) {
        const totalGoals = outcome.home + outcome.away;
        if (totalGoals >= 4) {
          weight *= 1.5; // Increase high-scoring games
        }
      }

      return { ...outcome, weight };
    });

    const totalWeight = adjustedOutcomes.reduce((sum, outcome) => sum + outcome.weight, 0);
    const random = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const outcome of adjustedOutcomes) {
      currentWeight += outcome.weight;
      if (random <= currentWeight) {
        return { homeScore: outcome.home, awayScore: outcome.away };
      }
    }

    return { homeScore: 1, awayScore: 1 };
  }
}

export default new QualificationMatchService();