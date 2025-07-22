import { expect } from 'chai'
import sinon from 'sinon'
import QualificationService from '../../../services/QualificationService.js'

describe('QualificationService Unit Tests', () => {
  describe('distributeTeamsIntoGroups', () => {
    it('should create correct number of groups for UEFA', () => {
      const teams = Array(54).fill(null).map((_, i) => ({
        name: `Team ${i}`,
        ranking: i + 1
      }))
      
      const groups = QualificationService.distributeTeamsIntoGroups(teams, 'UEFA')
      
      // With 54 teams and preferring 5-6 teams per group
      expect(groups.length).to.be.at.least(9)
      expect(groups.length).to.be.at.most(11)
      
      // Check all teams are distributed
      const totalTeams = groups.reduce((sum, group) => sum + group.teams.length, 0)
      expect(totalTeams).to.equal(54)
    })

    it('should distribute teams evenly for CONMEBOL', () => {
      const teams = Array(10).fill(null).map((_, i) => ({
        name: `Team ${i}`,
        ranking: i + 1
      }))
      
      const groups = QualificationService.distributeTeamsIntoGroups(teams, 'CONMEBOL')
      
      // CONMEBOL should have 1 group with all teams
      expect(groups).to.have.lengthOf(1)
      expect(groups[0].teams).to.have.lengthOf(10)
    })

    it('should create 2 groups for OFC', () => {
      const teams = Array(8).fill(null).map((_, i) => ({
        name: `Team ${i}`,
        ranking: i + 1
      }))
      
      const groups = QualificationService.distributeTeamsIntoGroups(teams, 'OFC')
      
      expect(groups).to.have.lengthOf(2)
      expect(groups[0].teams).to.have.lengthOf(4)
      expect(groups[1].teams).to.have.lengthOf(4)
    })

    it('should shuffle teams within ranking tiers', () => {
      const teams = Array(20).fill(null).map((_, i) => ({
        name: `Team ${i}`,
        ranking: i + 1
      }))
      
      // Run multiple times to check shuffling
      const results = []
      for (let i = 0; i < 5; i++) {
        const groups = QualificationService.distributeTeamsIntoGroups(teams, 'CAF')
        results.push(groups[0].teams[0].name)
      }
      
      // Should not always have the same team in first position
      const uniqueFirstTeams = new Set(results)
      expect(uniqueFirstTeams.size).to.be.above(1)
    })
  })

  describe('calculateMatchOutcome', () => {
    it('should favor teams with better rankings', () => {
      const results = { home: 0, draw: 0, away: 0 }
      
      // Simulate 100 matches between rank 10 vs rank 50
      for (let i = 0; i < 100; i++) {
        const outcome = QualificationService.calculateMatchOutcome(10, 50)
        if (outcome.homeScore > outcome.awayScore) results.home++
        else if (outcome.homeScore < outcome.awayScore) results.away++
        else results.draw++
      }
      
      // Team with rank 10 should win more often
      expect(results.home).to.be.above(results.away)
      expect(results.home).to.be.above(40) // Should win at least 40% of matches
    })

    it('should produce realistic score ranges', () => {
      const scores = []
      
      for (let i = 0; i < 100; i++) {
        const outcome = QualificationService.calculateMatchOutcome(20, 30)
        scores.push(outcome.homeScore, outcome.awayScore)
      }
      
      // Check all scores are reasonable
      expect(Math.max(...scores)).to.be.at.most(8)
      expect(Math.min(...scores)).to.be.at.least(0)
      
      // Most scores should be low
      const lowScores = scores.filter(s => s <= 3).length
      expect(lowScores / scores.length).to.be.above(0.8)
    })

    it('should allow upsets with extreme ranking differences', () => {
      let upsetOccurred = false
      
      // Try many times to see if upset can occur
      for (let i = 0; i < 200; i++) {
        const outcome = QualificationService.calculateMatchOutcome(1, 100)
        if (outcome.awayScore > outcome.homeScore) {
          upsetOccurred = true
          break
        }
      }
      
      // Upsets should be possible, even if rare
      expect(upsetOccurred).to.be.true
    })
  })

  describe('generateRoundRobinMatches', () => {
    it('should generate correct number of matches for single round-robin', () => {
      const teams = Array(6).fill(null).map((_, i) => ({
        teamId: `team${i}`,
        name: `Team ${i}`
      }))
      
      const matches = QualificationService.generateRoundRobinMatches(
        teams, 
        'confId', 
        'A', 
        false, // single round-robin
        1
      )
      
      // For 6 teams: 6 * 5 / 2 = 15 matches
      expect(matches).to.have.lengthOf(15)
    })

    it('should generate correct number of matches for double round-robin', () => {
      const teams = Array(4).fill(null).map((_, i) => ({
        teamId: `team${i}`,
        name: `Team ${i}`
      }))
      
      const matches = QualificationService.generateRoundRobinMatches(
        teams, 
        'confId', 
        'A', 
        true, // double round-robin
        1
      )
      
      // For 4 teams double round-robin: 4 * 3 = 12 matches
      expect(matches).to.have.lengthOf(12)
    })

    it('should ensure each team plays equal number of matches', () => {
      const teams = Array(5).fill(null).map((_, i) => ({
        teamId: `team${i}`,
        name: `Team ${i}`
      }))
      
      const matches = QualificationService.generateRoundRobinMatches(
        teams, 
        'confId', 
        'A', 
        false,
        1
      )
      
      // Count matches per team
      const matchCounts = {}
      teams.forEach(t => matchCounts[t.teamId] = 0)
      
      matches.forEach(match => {
        matchCounts[match.homeTeam.teamId]++
        matchCounts[match.awayTeam.teamId]++
      })
      
      // Each team should play 4 matches (against 4 other teams)
      Object.values(matchCounts).forEach(count => {
        expect(count).to.equal(4)
      })
    })

    it('should handle odd number of teams correctly', () => {
      const teams = Array(7).fill(null).map((_, i) => ({
        teamId: `team${i}`,
        name: `Team ${i}`
      }))
      
      const matches = QualificationService.generateRoundRobinMatches(
        teams, 
        'confId', 
        'A', 
        false,
        1
      )
      
      // For 7 teams: 7 * 6 / 2 = 21 matches
      expect(matches).to.have.lengthOf(21)
      
      // Check matchday distribution
      const matchdayGroups = {}
      matches.forEach(m => {
        if (!matchdayGroups[m.matchday]) matchdayGroups[m.matchday] = []
        matchdayGroups[m.matchday].push(m)
      })
      
      // Should have 7 matchdays (odd number of teams)
      expect(Object.keys(matchdayGroups)).to.have.lengthOf(7)
    })
  })

  describe('updateGroupStandings', () => {
    it('should update standings correctly for a home win', () => {
      const group = {
        teams: [
          { teamId: 'team1', played: 0, won: 0, drawn: 0, lost: 0, 
            goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
          { teamId: 'team2', played: 0, won: 0, drawn: 0, lost: 0,
            goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 }
        ]
      }
      
      const match = {
        homeTeam: { teamId: 'team1' },
        awayTeam: { teamId: 'team2' },
        homeScore: 2,
        awayScore: 1
      }
      
      QualificationService.updateGroupStandings(group, match)
      
      const team1 = group.teams.find(t => t.teamId === 'team1')
      const team2 = group.teams.find(t => t.teamId === 'team2')
      
      // Team 1 (winner)
      expect(team1.played).to.equal(1)
      expect(team1.won).to.equal(1)
      expect(team1.points).to.equal(3)
      expect(team1.goalsFor).to.equal(2)
      expect(team1.goalsAgainst).to.equal(1)
      expect(team1.goalDifference).to.equal(1)
      
      // Team 2 (loser)
      expect(team2.played).to.equal(1)
      expect(team2.lost).to.equal(1)
      expect(team2.points).to.equal(0)
      expect(team2.goalsFor).to.equal(1)
      expect(team2.goalsAgainst).to.equal(2)
      expect(team2.goalDifference).to.equal(-1)
    })

    it('should update standings correctly for a draw', () => {
      const group = {
        teams: [
          { teamId: 'team1', played: 0, won: 0, drawn: 0, lost: 0, 
            goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
          { teamId: 'team2', played: 0, won: 0, drawn: 0, lost: 0,
            goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 }
        ]
      }
      
      const match = {
        homeTeam: { teamId: 'team1' },
        awayTeam: { teamId: 'team2' },
        homeScore: 2,
        awayScore: 2
      }
      
      QualificationService.updateGroupStandings(group, match)
      
      const team1 = group.teams.find(t => t.teamId === 'team1')
      const team2 = group.teams.find(t => t.teamId === 'team2')
      
      // Both teams
      expect(team1.played).to.equal(1)
      expect(team1.drawn).to.equal(1)
      expect(team1.points).to.equal(1)
      expect(team1.goalDifference).to.equal(0)
      
      expect(team2.played).to.equal(1)
      expect(team2.drawn).to.equal(1)
      expect(team2.points).to.equal(1)
      expect(team2.goalDifference).to.equal(0)
    })
  })
})