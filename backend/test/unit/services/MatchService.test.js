import { expect } from 'chai'
import sinon from 'sinon'
import MatchService from '../../../services/MatchService.js'

describe('MatchService Unit Tests', () => {
  describe('calculateTeamPower', () => {
    it('should return 20 for top 5 teams', () => {
      expect(MatchService.calculateTeamPower(1)).to.equal(20)
      expect(MatchService.calculateTeamPower(5)).to.equal(20)
    })

    it('should return 19 for teams ranked 6-10', () => {
      expect(MatchService.calculateTeamPower(6)).to.equal(19)
      expect(MatchService.calculateTeamPower(10)).to.equal(19)
    })

    it('should return appropriate power for mid-ranked teams', () => {
      expect(MatchService.calculateTeamPower(50)).to.equal(14)
      expect(MatchService.calculateTeamPower(100)).to.equal(9)
    })

    it('should return 1 for teams ranked 191 or worse', () => {
      expect(MatchService.calculateTeamPower(191)).to.equal(1)
      expect(MatchService.calculateTeamPower(211)).to.equal(1)
    })
  })

  describe('simulateRealisticScore', () => {
    let homeTeam, awayTeam

    beforeEach(() => {
      homeTeam = { fifaRanking: 10 }
      awayTeam = { fifaRanking: 50 }
    })

    it('should return a valid score object', () => {
      const result = MatchService.simulateRealisticScore(homeTeam, awayTeam)
      expect(result).to.have.property('homeScore').that.is.a('number')
      expect(result).to.have.property('awayScore').that.is.a('number')
      expect(result.homeScore).to.be.at.least(0)
      expect(result.awayScore).to.be.at.least(0)
    })

    it('should tend to favor stronger teams', () => {
      const results = []
      for (let i = 0; i < 100; i++) {
        const result = MatchService.simulateRealisticScore(homeTeam, awayTeam)
        results.push(result.homeScore > result.awayScore)
      }
      const homeWinPercentage = results.filter(r => r).length / results.length
      expect(homeWinPercentage).to.be.above(0.5) // Home team should win more than 50%
    })

    it('should produce reasonable score ranges', () => {
      const results = []
      for (let i = 0; i < 100; i++) {
        const result = MatchService.simulateRealisticScore(homeTeam, awayTeam)
        results.push(result)
      }
      
      const allScoresReasonable = results.every(r => 
        r.homeScore <= 8 && r.awayScore <= 8
      )
      expect(allScoresReasonable).to.be.true
    })

    it('should handle equal teams appropriately', () => {
      const equalTeam1 = { fifaRanking: 20 }
      const equalTeam2 = { fifaRanking: 20 }
      
      const results = []
      for (let i = 0; i < 100; i++) {
        const result = MatchService.simulateRealisticScore(equalTeam1, equalTeam2)
        results.push(result)
      }
      
      const homeWins = results.filter(r => r.homeScore > r.awayScore).length
      const awayWins = results.filter(r => r.homeScore < r.awayScore).length
      const draws = results.filter(r => r.homeScore === r.awayScore).length
      
      // With equal teams and home advantage, home should win slightly more
      expect(homeWins).to.be.above(awayWins * 0.8)
      expect(draws).to.be.above(10) // Should have some draws
    })
  })

  describe('generateMatchesForGroup', () => {
    it('should generate 6 matches for a group of 4 teams', () => {
      const group = {
        _id: 'group1',
        tournament: 'tournament1',
        groupLetter: 'A'
      }
      
      const teams = [
        { _id: 'team1' },
        { _id: 'team2' },
        { _id: 'team3' },
        { _id: 'team4' }
      ]
      
      const matches = MatchService.generateMatchesForGroup(group, teams)
      
      expect(matches).to.have.lengthOf(6)
      expect(matches.every(m => m.tournament === 'tournament1')).to.be.true
      expect(matches.every(m => m.group === 'group1')).to.be.true
      expect(matches.every(m => m.status === 'scheduled')).to.be.true
    })

    it('should distribute matches across 3 matchdays', () => {
      const group = {
        _id: 'group1',
        tournament: 'tournament1',
        groupLetter: 'A'
      }
      
      const teams = [
        { _id: 'team1' },
        { _id: 'team2' },
        { _id: 'team3' },
        { _id: 'team4' }
      ]
      
      const matches = MatchService.generateMatchesForGroup(group, teams)
      
      const matchday1 = matches.filter(m => m.matchday === 1)
      const matchday2 = matches.filter(m => m.matchday === 2)
      const matchday3 = matches.filter(m => m.matchday === 3)
      
      expect(matchday1).to.have.lengthOf(2)
      expect(matchday2).to.have.lengthOf(2)
      expect(matchday3).to.have.lengthOf(2)
    })

    it('should ensure each team plays every other team once', () => {
      const group = {
        _id: 'group1',
        tournament: 'tournament1',
        groupLetter: 'A'
      }
      
      const teams = [
        { _id: 'team1' },
        { _id: 'team2' },
        { _id: 'team3' },
        { _id: 'team4' }
      ]
      
      const matches = MatchService.generateMatchesForGroup(group, teams)
      
      // Check all unique pairings exist
      const expectedPairings = [
        ['team1', 'team2'],
        ['team1', 'team3'],
        ['team1', 'team4'],
        ['team2', 'team3'],
        ['team2', 'team4'],
        ['team3', 'team4']
      ]
      
      for (const [team1, team2] of expectedPairings) {
        const matchExists = matches.some(m => 
          (m.homeTeam === team1 && m.awayTeam === team2) ||
          (m.homeTeam === team2 && m.awayTeam === team1)
        )
        expect(matchExists).to.be.true
      }
    })
  })
})