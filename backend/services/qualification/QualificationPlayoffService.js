import QualificationTeamService from './QualificationTeamService.js';

class QualificationPlayoffService {
  /**
   * Check and populate playoff matches when groups are complete
   */
  checkAndPopulatePlayoffs(confederation) {
    if (!['ofc', 'caf', 'afc'].includes(confederation.confederationId) || !confederation.playoffs) {
      return;
    }

    // Check if all groups are complete
    const groupWinners = [];
    for (const group of confederation.groups) {
      const n = group.teams.length;
      // Check if this confederation plays home and away matches
      const isDoubleRoundRobin = ['uefa', 'conmebol', 'caf', 'ofc', 'afc'].includes(confederation.confederationId);
      // Each team plays against every other team (once or twice)
      const matchesPerTeam = isDoubleRoundRobin ? 2 * (n - 1) : (n - 1);

      // Check if all teams have played all their matches
      const allTeamsComplete = group.teams.every(team => team.played === matchesPerTeam);

      if (allTeamsComplete) {
        // Group is complete, get winner
        const winner = group.teams[0].toObject ? group.teams[0].toObject() : group.teams[0]; // Handle both Mongoose and plain objects
        groupWinners.push({
          ...winner,
          groupName: group.name
        });
      }
    }

    let requiredGroupWinners;
    if (confederation.confederationId === 'ofc') {
      requiredGroupWinners = 2;
    } else if (confederation.confederationId === 'caf') {
      requiredGroupWinners = 8;  // CAF has 8 groups
    } else {
      requiredGroupWinners = 8;  // AFC has 8 groups
    }

    if (groupWinners.length === requiredGroupWinners) {
      // All groups complete, create playoff matches
      confederation.playoffs.matches = [];

      if (confederation.confederationId === 'ofc') {
        // OFC: 2 group winners, home-and-away playoff for 1 qualifier
        const [team1, team2] = groupWinners;
        confederation.playoffs.matches = [
          {
            matchId: `ofc_playoff_${team1.teamId}_vs_${team2.teamId}_leg1`,
            homeTeam: {
              teamId: team1.teamId,
              name: team1.name,
              country: team1.country,
              flag: team1.flag,
              ranking: team1.ranking
            },
            awayTeam: {
              teamId: team2.teamId,
              name: team2.name,
              country: team2.country,
              flag: team2.flag,
              ranking: team2.ranking
            },
            homeScore: null,
            awayScore: null,
            played: false,
            leg: 1,
            description: 'First Leg'
          },
          {
            matchId: `ofc_playoff_${team2.teamId}_vs_${team1.teamId}_leg2`,
            homeTeam: {
              teamId: team2.teamId,
              name: team2.name,
              country: team2.country,
              flag: team2.flag,
              ranking: team2.ranking
            },
            awayTeam: {
              teamId: team1.teamId,
              name: team1.name,
              country: team1.country,
              flag: team1.flag,
              ranking: team1.ranking
            },
            homeScore: null,
            awayScore: null,
            played: false,
            leg: 2,
            description: 'Second Leg'
          }
        ];
      } else if (confederation.confederationId === 'caf') {
        // CAF: 8 group winners, home-and-away playoff matches for 4 qualifiers
        // Randomly shuffle group winners and pair them up for 4 matches
        const shuffledWinners = [...groupWinners].sort(() => Math.random() - 0.5);

        for (let i = 0; i < 4; i++) {
          const team1 = shuffledWinners[i * 2];
          const team2 = shuffledWinners[i * 2 + 1];

          // First leg
          confederation.playoffs.matches.push({
            matchId: `caf_playoff_${team1.teamId}_vs_${team2.teamId}_leg1`,
            homeTeam: {
              teamId: team1.teamId,
              name: team1.name,
              country: team1.country,
              flag: team1.flag,
              ranking: team1.ranking
            },
            awayTeam: {
              teamId: team2.teamId,
              name: team2.name,
              country: team2.country,
              flag: team2.flag,
              ranking: team2.ranking
            },
            homeScore: null,
            awayScore: null,
            played: false,
            leg: 1,
            description: `CAF Playoff ${i + 1} - First Leg`
          });

          // Second leg
          confederation.playoffs.matches.push({
            matchId: `caf_playoff_${team2.teamId}_vs_${team1.teamId}_leg2`,
            homeTeam: {
              teamId: team2.teamId,
              name: team2.name,
              country: team2.country,
              flag: team2.flag,
              ranking: team2.ranking
            },
            awayTeam: {
              teamId: team1.teamId,
              name: team1.name,
              country: team1.country,
              flag: team1.flag,
              ranking: team1.ranking
            },
            homeScore: null,
            awayScore: null,
            played: false,
            leg: 2,
            description: `CAF Playoff ${i + 1} - Second Leg`
          });
        }
      } else {
        // AFC: 8 group winners, home-and-away playoff matches for 4 qualifiers
        // Randomly shuffle group winners and pair them up for 4 matches
        const shuffledWinners = [...groupWinners].sort(() => Math.random() - 0.5);

        for (let i = 0; i < 4; i++) {
          const team1 = shuffledWinners[i * 2];
          const team2 = shuffledWinners[i * 2 + 1];

          // First leg
          confederation.playoffs.matches.push({
            matchId: `${confederation.confederationId}_playoff_${team1.teamId}_vs_${team2.teamId}_leg1`,
            homeTeam: {
              teamId: team1.teamId,
              name: team1.name,
              country: team1.country,
              flag: team1.flag,
              ranking: team1.ranking
            },
            awayTeam: {
              teamId: team2.teamId,
              name: team2.name,
              country: team2.country,
              flag: team2.flag,
              ranking: team2.ranking
            },
            homeScore: null,
            awayScore: null,
            played: false,
            leg: 1,
            description: `Playoff ${i + 1} - First Leg`
          });

          // Second leg
          confederation.playoffs.matches.push({
            matchId: `${confederation.confederationId}_playoff_${team2.teamId}_vs_${team1.teamId}_leg2`,
            homeTeam: {
              teamId: team2.teamId,
              name: team2.name,
              country: team2.country,
              flag: team2.flag,
              ranking: team2.ranking
            },
            awayTeam: {
              teamId: team1.teamId,
              name: team1.name,
              country: team1.country,
              flag: team1.flag,
              ranking: team1.ranking
            },
            homeScore: null,
            awayScore: null,
            played: false,
            leg: 2,
            description: `Playoff ${i + 1} - Second Leg`
          });
        }
      }

      confederation.playoffs.available = true;
    }
  }

  /**
   * Simulate extra time and penalty shootout for tied playoff matches
   */
  simulateExtraTimeAndPenalties(team1, team2) {
    // First, simulate extra time (30 minutes)
    // Extra time goals are typically rare, using lower scoring probability
    const extraTimeGoalsTeam1 = Math.random() < 0.15 ? 1 : (Math.random() < 0.05 ? 2 : 0);
    const extraTimeGoalsTeam2 = Math.random() < 0.15 ? 1 : (Math.random() < 0.05 ? 2 : 0);

    if (extraTimeGoalsTeam1 > extraTimeGoalsTeam2) {
      return team1;
    } else if (extraTimeGoalsTeam2 > extraTimeGoalsTeam1) {
      return team2;
    }

    // Still tied after extra time - go to penalties
    // Simulate penalty shootout
    // Each team has 5 penalty attempts initially
    let team1Penalties = 0;
    let team2Penalties = 0;

    // Regular 5 penalties each
    for (let i = 0; i < 5; i++) {
      // Team 1 penalty (80% success rate)
      if (Math.random() < 0.8) team1Penalties++;

      // Team 2 penalty (80% success rate)
      if (Math.random() < 0.8) team2Penalties++;
    }

    // If still tied after 5 penalties each, continue sudden death
    while (team1Penalties === team2Penalties) {
      const team1Scores = Math.random() < 0.8;
      const team2Scores = Math.random() < 0.8;

      if (team1Scores && !team2Scores) {
        team1Penalties++;
        break;
      } else if (team2Scores && !team1Scores) {
        team2Penalties++;
        break;
      } else if (team1Scores && team2Scores) {
        team1Penalties++;
        team2Penalties++;
        // Continue to next round
      }
      // If both miss, continue to next round
    }

    const winner = team1Penalties > team2Penalties ? team1 : team2;
    return winner;
  }

  /**
   * Process playoff match results and determine winners
   */
  processPlayoffResults(confederation, confederationId) {
    // For CAF/AFC, update winners after each pair completion
    if (['caf', 'afc'].includes(confederationId)) {
      // CAF/AFC: Calculate winners for any completed pairs
      const winners = [];

      // Group matches by playoff pair (every 2 matches is one two-leg tie)
      for (let i = 0; i < confederation.playoffs.matches.length; i += 2) {
        const match1 = confederation.playoffs.matches[i];     // First leg
        const match2 = confederation.playoffs.matches[i + 1]; // Second leg

        if (match1.played && match2.played) {
          const team1Goals = match1.homeScore + match2.awayScore;
          const team2Goals = match1.awayScore + match2.homeScore;

          let winner;
          if (team1Goals > team2Goals) {
            winner = match1.homeTeam;
          } else if (team2Goals > team1Goals) {
            winner = match1.awayTeam;
          } else {
            // If tied on aggregate, check away goals rule
            const team1AwayGoals = match2.awayScore; // Team 1's away goals in second leg
            const team2AwayGoals = match1.awayScore; // Team 2's away goals in first leg

            if (team1AwayGoals > team2AwayGoals) {
              winner = match1.homeTeam;
            } else if (team2AwayGoals > team1AwayGoals) {
              winner = match1.awayTeam;
            } else {
              // Still tied after away goals - simulate extra time and penalties
              winner = this.simulateExtraTimeAndPenalties(match1.homeTeam, match1.awayTeam);
            }
          }

          winners.push({
            teamId: winner.teamId,
            name: winner.name,
            country: winner.country,
            flag: winner.flag,
            qualificationMethod: 'PLAYOFF WINNER'
          });
        }
      }

      // Update winners and qualified teams
      confederation.playoffs.winners = winners;
      confederation.qualifiedTeams = winners;

      // Check if all matches are complete
      const allMatchesPlayed = confederation.playoffs.matches.every(m => m.played);
      if (allMatchesPlayed) {
        confederation.playoffs.completed = true;
      }

      return winners;
    } else if (confederationId === 'ofc') {
      // Check if all playoff matches are complete
      const allMatchesPlayed = confederation.playoffs.matches.every(m => m.played);
      if (allMatchesPlayed) {
        // OFC: Calculate aggregate winner from 2 matches
        const match1 = confederation.playoffs.matches[0];
        const match2 = confederation.playoffs.matches[1];

        const team1Goals = match1.homeScore + match2.awayScore;
        const team2Goals = match1.awayScore + match2.homeScore;

        let winner;
        if (team1Goals > team2Goals) {
          winner = match1.homeTeam;
        } else if (team2Goals > team1Goals) {
          winner = match1.awayTeam;
        } else {
          // If tied on aggregate, check away goals rule
          const team1AwayGoals = match2.awayScore; // Team 1's away goals in second leg
          const team2AwayGoals = match1.awayScore; // Team 2's away goals in first leg

          if (team1AwayGoals > team2AwayGoals) {
            winner = match1.homeTeam;
          } else if (team2AwayGoals > team1AwayGoals) {
            winner = match1.awayTeam;
          } else {
            // Still tied after away goals - simulate extra time and penalties
            winner = this.simulateExtraTimeAndPenalties(match1.homeTeam, match1.awayTeam);
          }
        }

        confederation.playoffs.winner = winner;
        confederation.playoffs.completed = true;

        // Add qualified team
        const qualifiedTeam = {
          teamId: winner.teamId,
          name: winner.name,
          country: winner.country,
          flag: winner.flag,
          qualificationMethod: 'PLAYOFF WINNER'
        };

        confederation.qualifiedTeams = [qualifiedTeam];
        return [winner];
      }
    }

    return [];
  }
}

export default new QualificationPlayoffService();