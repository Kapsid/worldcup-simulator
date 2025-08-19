import { confederations } from '../../data/confederations.js';
import QualificationTeamService from './QualificationTeamService.js';

class QualificationGroupService {
  /**
   * Generate groups for a confederation with equal team distribution
   */
  generateConfederationGroups(confederationId, teams) {
    const confederation = confederations.find(c => c.id === confederationId);
    if (!confederation) return [];

    const groups = [];
    const totalTeams = teams.length;

    if (confederation.format === 'single_league') {
      // CONMEBOL: Single league with all teams
      groups.push({
        groupId: `${confederationId}_league`,
        name: 'League',
        teams: teams.map(team => ({
          ...team,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        }))
      });
    } else {
      // All other confederations: Group stage with EQUAL team distribution
      const qualificationSlots = confederation.qualificationSlots;
      const minTeamsPerGroup = 4;

      // Calculate number of groups to ensure all groups have the same number of teams
      let numGroups, teamsPerGroup;

      if (confederationId === 'uefa') {
        // UEFA: Prefer groups of 5-6 teams (more realistic)
        const preferredTeamsPerGroup = [5, 6]; // Prefer 5 or 6 teams per group
        const maxTeamsPerGroup = 7;

        // First try to find perfect division with preferred sizes
        for (const preferred of preferredTeamsPerGroup) {
          if (totalTeams % preferred === 0) {
            teamsPerGroup = preferred;
            numGroups = totalTeams / preferred;
            break;
          }
        }

        // If no perfect division with preferred sizes, try all sizes from 5-7
        if (!numGroups) {
          for (let candidateTeamsPerGroup = 5; candidateTeamsPerGroup <= maxTeamsPerGroup; candidateTeamsPerGroup++) {
            if (totalTeams % candidateTeamsPerGroup === 0) {
              teamsPerGroup = candidateTeamsPerGroup;
              numGroups = totalTeams / candidateTeamsPerGroup;
              break;
            }
          }
        }

        // If still no perfect division, use 5 or 6 teams per group (whichever gives closer to equal distribution)
        if (!numGroups) {
          const groups5 = Math.ceil(totalTeams / 5);
          const groups6 = Math.ceil(totalTeams / 6);

          // Choose the option that minimizes variance in group sizes
          const remainder5 = totalTeams % 5;
          const remainder6 = totalTeams % 6;

          if (remainder6 === 0 || (remainder6 > remainder5 && remainder5 !== 0)) {
            teamsPerGroup = 6;
            numGroups = groups6;
          } else {
            teamsPerGroup = 5;
            numGroups = groups5;
          }
        }
      } else if (confederationId === 'caf' || confederationId === 'afc') {
        // CAF and AFC: Fixed 8 groups (for playoff system)
        numGroups = 8;
        teamsPerGroup = Math.ceil(totalTeams / 8);
      } else {
        // Other confederations: Find optimal equal distribution
        // Try different team per group sizes to find one that divides evenly
        for (let candidateTeamsPerGroup = minTeamsPerGroup; candidateTeamsPerGroup <= totalTeams; candidateTeamsPerGroup++) {
          if (totalTeams % candidateTeamsPerGroup === 0) {
            const candidateNumGroups = totalTeams / candidateTeamsPerGroup;

            // Check if this creates reasonable group size
            if (candidateNumGroups >= qualificationSlots) {
              teamsPerGroup = candidateTeamsPerGroup;
              numGroups = candidateNumGroups;
              break;
            }
          }
        }

        // If no perfect division found, use the closest to minimum groups
        if (!numGroups) {
          numGroups = Math.min(qualificationSlots, Math.ceil(totalTeams / minTeamsPerGroup));
          teamsPerGroup = Math.ceil(totalTeams / numGroups);
        }
      }

      // Create empty groups
      for (let i = 0; i < numGroups; i++) {
        groups.push({
          groupId: `${confederationId}_group_${String.fromCharCode(65 + i)}`,
          name: `Group ${String.fromCharCode(65 + i)}`,
          teams: []
        });
      }

      // Sort teams by ranking (world rankings if available, otherwise world ranking)
      const sortedTeams = [...teams].sort((a, b) => QualificationTeamService.getTeamRanking(a) - QualificationTeamService.getTeamRanking(b));

      // Create pots based on ranking tiers (one pot per "tier" within groups)
      const numPots = teamsPerGroup;
      const teamsPerPot = Math.ceil(totalTeams / numPots);
      const pots = [];

      for (let potIndex = 0; potIndex < numPots; potIndex++) {
        const potStart = potIndex * teamsPerPot;
        const potEnd = Math.min(potStart + teamsPerPot, totalTeams);
        const potTeams = sortedTeams.slice(potStart, potEnd);

        // Shuffle teams within this pot to randomize group assignments
        const shuffledPot = QualificationTeamService.shuffleArray(potTeams);
        pots.push(shuffledPot);
      }

      // Distribute teams from shuffled pots using round-robin
      const distributedTeams = Array(numGroups).fill(null).map(() => []);

      // For each pot, distribute teams to groups in round-robin fashion
      for (let potIndex = 0; potIndex < pots.length; potIndex++) {
        const pot = pots[potIndex];

        for (let teamIndex = 0; teamIndex < pot.length; teamIndex++) {
          const groupIndex = teamIndex % numGroups;
          distributedTeams[groupIndex].push(pot[teamIndex]);
        }
      }

      // Add distributed teams to groups
      for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
        if (distributedTeams[groupIndex]) {
          for (const team of distributedTeams[groupIndex]) {
            const groupTeam = {
              ...team,
              played: 0,
              won: 0,
              drawn: 0,
              lost: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0
            };

            groups[groupIndex].teams.push(groupTeam);
          }
        }
      }

      // Filter out any empty groups (for UEFA, accept groups with 5+ teams)
      const minRequired = confederationId === 'uefa' ? 5 : minTeamsPerGroup;
      return groups.filter(group => group.teams.length >= minRequired);
    }

    return groups;
  }

  /**
   * Update group standings after a match
   */
  updateGroupStandings(group, match) {
    const homeTeam = group.teams.find(t => t.teamId === match.homeTeam.teamId);
    const awayTeam = group.teams.find(t => t.teamId === match.awayTeam.teamId);

    if (!homeTeam || !awayTeam) return;

    homeTeam.played += 1;
    awayTeam.played += 1;

    homeTeam.goalsFor += match.homeScore;
    homeTeam.goalsAgainst += match.awayScore;
    awayTeam.goalsFor += match.awayScore;
    awayTeam.goalsAgainst += match.homeScore;

    homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
    awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;

    if (match.homeScore > match.awayScore) {
      homeTeam.won += 1;
      homeTeam.points += 3;
      awayTeam.lost += 1;
    } else if (match.homeScore < match.awayScore) {
      awayTeam.won += 1;
      awayTeam.points += 3;
      homeTeam.lost += 1;
    } else {
      homeTeam.drawn += 1;
      awayTeam.drawn += 1;
      homeTeam.points += 1;
      awayTeam.points += 1;
    }

    group.teams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
  }

  /**
   * Determine qualified teams based on group standings
   */
  determineQualifiedTeams(confederationId, groups, hostCountryCode) {
    const confederation = confederations.find(c => c.id === confederationId);
    if (!confederation) return [];

    // OFC, CAF, and AFC use playoff system - check if playoff is complete
    if (['ofc', 'caf', 'afc'].includes(confederationId)) {
      // Don't determine qualified teams here - they are set directly in playoff simulation
      // Return empty array to avoid overriding playoff winners
      return [];
    }

    const qualifiedTeams = [];
    // Use the confederation's qualification slots (already adjusted for host if needed)
    const totalSlots = confederation.qualificationSlots;

    // Collect all group winners and runners-up
    const groupResults = [];

    for (const group of groups) {
      // Check if this confederation plays home and away matches
      const isDoubleRoundRobin = confederationId === 'uefa' || confederationId === 'conmebol' || confederationId === 'caf' || confederationId === 'ofc' || confederationId === 'afc';

      // Calculate total matches based on format
      const n = group.teams.length;
      const totalMatches = isDoubleRoundRobin
        ? n * (n - 1)  // Each team plays every other team twice
        : (n * (n - 1)) / 2;  // Each team plays every other team once

      const playedMatches = group.teams.reduce((sum, team) => sum + team.played, 0) / 2;

      if (playedMatches === totalMatches) {
        // Group is complete
        groupResults.push({
          groupId: group.groupId,
          winner: group.teams[0],
          runnerUp: group.teams[1] || null,
          allTeams: group.teams
        });
      }
    }

    // Only proceed if all groups are complete
    if (groupResults.length !== groups.length) {
      return [];
    }

    if (confederation.format === 'single_league') {
      // CONMEBOL: Top teams qualify directly
      const leagueTable = groupResults[0].allTeams;
      for (let i = 0; i < Math.min(totalSlots, leagueTable.length); i++) {
        qualifiedTeams.push({
          ...leagueTable[i],
          qualificationMethod: 'direct'
        });
      }
    } else {
      // Group stage: Ensure fair qualification distribution
      const winners = groupResults.map(gr => gr.winner).filter(Boolean);
      const runnersUp = groupResults.map(gr => gr.runnerUp).filter(Boolean);
      const numGroups = groupResults.length;

      if (numGroups >= totalSlots) {
        // If we have enough groups to fill all slots with group winners
        winners.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          return b.goalsFor - a.goalsFor;
        });
        for (let i = 0; i < Math.min(totalSlots, winners.length); i++) {
          qualifiedTeams.push({
            ...winners[i],
            qualificationMethod: 'group_winner'
          });
        }
      } else {
        // If we have fewer groups than slots, all group winners qualify plus best runners-up
        for (const winner of winners) {
          qualifiedTeams.push({
            ...winner,
            qualificationMethod: 'group_winner'
          });
        }

        // Fill remaining slots with best runners-up
        const remainingSlots = totalSlots - winners.length;
        if (remainingSlots > 0) {
          // For UEFA, use average points per match to make it fair for groups of different sizes
          if (confederationId === 'uefa') {
            runnersUp.sort((a, b) => {
              const avgA = a.played > 0 ? a.points / a.played : 0;
              const avgB = b.played > 0 ? b.points / b.played : 0;

              if (avgB !== avgA) return avgB - avgA;  // Higher average points first
              if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
              return b.goalsFor - a.goalsFor;
            });
          } else {
            // For other confederations, use total points
            runnersUp.sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points;
              if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
              return b.goalsFor - a.goalsFor;
            });
          }

          for (let i = 0; i < Math.min(remainingSlots, runnersUp.length); i++) {
            qualifiedTeams.push({
              ...runnersUp[i],
              qualificationMethod: 'best_runner_up'
            });
          }
        }
      }
    }

    return qualifiedTeams;
  }
}

export default new QualificationGroupService();