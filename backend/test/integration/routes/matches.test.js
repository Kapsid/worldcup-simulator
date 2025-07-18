import { expect } from 'chai'
import request from 'supertest'
import app from '../../../server.js'
import { setupTestDB, teardownTestDB, clearTestDB } from '../../setup.js'
import { createTestUser, createTestTournament, createTestTeams, generateTestToken } from '../../utils/testHelpers.js'
import { testCountries } from '../../fixtures/testData.js'
import TournamentGroup from '../../../models/TournamentGroup.js'
import Match from '../../../models/Match.js'

describe('Match Routes Integration Tests', () => {
  let authToken
  let userId
  let tournament
  let teams

  before(async function() {
    this.timeout(30000)
    await setupTestDB()
  })

  beforeEach(async () => {
    const user = await createTestUser()
    userId = user._id.toString()
    authToken = generateTestToken(userId)
    
    tournament = await createTestTournament(userId, {
      name: 'Test World Cup',
      status: 'active'
    })
    
    // Create teams (need 32 for a tournament)
    const allTeams = []
    for (let i = 0; i < 32; i++) {
      const countryData = testCountries[i % testCountries.length]
      allTeams.push({
        ...countryData,
        name: `${countryData.name} ${Math.floor(i / testCountries.length) || ''}`
      })
    }
    teams = await createTestTeams(tournament._id, allTeams)
    
    // Create groups and assign teams
    const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    for (let i = 0; i < 8; i++) {
      const group = new TournamentGroup({
        tournament: tournament._id,
        groupLetter: groupLetters[i],
        teams: teams.slice(i * 4, (i + 1) * 4).map(t => t._id)
      })
      await group.save()
    }
  })

  afterEach(async () => {
    await clearTestDB()
  })

  after(async () => {
    await teardownTestDB()
  })

  describe('POST /api/matches/:tournamentId/generate', () => {
    it('should generate group stage matches', async () => {
      const res = await request(app)
        .post(`/api/matches/${tournament._id}/generate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)

      expect(res.body).to.have.property('message')
      expect(res.body.message).to.include('48') // 8 groups × 6 matches

      // Verify matches were created
      const matches = await Match.find({ tournament: tournament._id })
      expect(matches).to.have.lengthOf(48)
      
      // Verify each group has 6 matches
      const groups = await TournamentGroup.find({ tournament: tournament._id })
      for (const group of groups) {
        const groupMatches = matches.filter(m => m.group.toString() === group._id.toString())
        expect(groupMatches).to.have.lengthOf(6)
      }
    })

    it('should not generate matches twice', async () => {
      // Generate first time
      await request(app)
        .post(`/api/matches/${tournament._id}/generate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)

      // Try to generate again
      const res = await request(app)
        .post(`/api/matches/${tournament._id}/generate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(res.body.error).to.include('already')
    })

    it('should require authentication', async () => {
      const res = await request(app)
        .post(`/api/matches/${tournament._id}/generate`)
        .expect(401)

      expect(res.body).to.have.property('error')
    })
  })

  describe('GET /api/matches/:tournamentId/matches', () => {
    beforeEach(async () => {
      // Generate matches
      await request(app)
        .post(`/api/matches/${tournament._id}/generate`)
        .set('Authorization', `Bearer ${authToken}`)
    })

    it('should list all tournament matches', async () => {
      const res = await request(app)
        .get(`/api/matches/${tournament._id}/matches`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.body).to.be.an('array')
      expect(res.body).to.have.lengthOf(48)
      
      // Check match structure
      const match = res.body[0]
      expect(match).to.have.property('homeTeam')
      expect(match).to.have.property('awayTeam')
      expect(match).to.have.property('matchday')
      expect(match).to.have.property('status')
      expect(match).to.have.property('group')
    })

    it('should sort matches by matchday', async () => {
      const res = await request(app)
        .get(`/api/matches/${tournament._id}/matches`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      let previousMatchday = 0
      for (const match of res.body) {
        expect(match.matchday).to.be.at.least(previousMatchday)
        previousMatchday = match.matchday
      }
    })
  })

  describe('POST /api/matches/:tournamentId/simulate/match/:matchId', () => {
    let match

    beforeEach(async () => {
      // Generate matches
      await request(app)
        .post(`/api/matches/${tournament._id}/generate`)
        .set('Authorization', `Bearer ${authToken}`)
      
      // Get first match
      const matches = await Match.find({ tournament: tournament._id })
      match = matches[0]
    })

    it('should simulate a single match', async () => {
      const res = await request(app)
        .post(`/api/matches/${tournament._id}/simulate/match/${match._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.body).to.have.property('homeScore').that.is.a('number')
      expect(res.body).to.have.property('awayScore').that.is.a('number')
      expect(res.body).to.have.property('status', 'completed')

      // Verify in database
      const updated = await Match.findById(match._id)
      expect(updated.status).to.equal('completed')
      expect(updated.homeScore).to.equal(res.body.homeScore)
      expect(updated.awayScore).to.equal(res.body.awayScore)
    })

    it('should not simulate already completed match', async () => {
      // Simulate once
      await request(app)
        .post(`/api/matches/${tournament._id}/simulate/match/${match._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Try to simulate again
      const res = await request(app)
        .post(`/api/matches/${tournament._id}/simulate/match/${match._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(res.body.error).to.include('completed')
    })

    it('should update standings after match', async () => {
      const res = await request(app)
        .post(`/api/matches/${tournament._id}/simulate/match/${match._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Check standings were updated
      const standingsRes = await request(app)
        .get(`/api/matches/${tournament._id}/standings`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const standings = standingsRes.body
      
      // Find teams that played
      const matchData = await Match.findById(match._id).populate('homeTeam awayTeam')
      const homeStanding = standings.find(s => s.team._id === matchData.homeTeam._id.toString())
      const awayStanding = standings.find(s => s.team._id === matchData.awayTeam._id.toString())

      expect(homeStanding.played).to.equal(1)
      expect(awayStanding.played).to.equal(1)
      
      // Check points based on result
      if (res.body.homeScore > res.body.awayScore) {
        expect(homeStanding.points).to.equal(3)
        expect(awayStanding.points).to.equal(0)
      } else if (res.body.homeScore < res.body.awayScore) {
        expect(homeStanding.points).to.equal(0)
        expect(awayStanding.points).to.equal(3)
      } else {
        expect(homeStanding.points).to.equal(1)
        expect(awayStanding.points).to.equal(1)
      }
    })
  })

  describe('POST /api/matches/:tournamentId/simulate/matchday/:matchday', () => {
    beforeEach(async () => {
      // Generate matches
      await request(app)
        .post(`/api/matches/${tournament._id}/generate`)
        .set('Authorization', `Bearer ${authToken}`)
    })

    it('should simulate all matches in a matchday', async () => {
      const res = await request(app)
        .post(`/api/matches/${tournament._id}/simulate/matchday/1`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.body).to.have.property('message')
      expect(res.body.message).to.include('16') // 8 groups × 2 matches per matchday

      // Verify all matchday 1 matches are completed
      const matches = await Match.find({ 
        tournament: tournament._id,
        matchday: 1
      })
      
      expect(matches).to.have.lengthOf(16)
      expect(matches.every(m => m.status === 'completed')).to.be.true
      expect(matches.every(m => m.homeScore !== null)).to.be.true
      expect(matches.every(m => m.awayScore !== null)).to.be.true
    })

    it('should not simulate already completed matchday', async () => {
      // Simulate matchday 1
      await request(app)
        .post(`/api/matches/${tournament._id}/simulate/matchday/1`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Try to simulate again
      const res = await request(app)
        .post(`/api/matches/${tournament._id}/simulate/matchday/1`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.body.message).to.include('0 matches') // No matches to simulate
    })
  })

  describe('GET /api/matches/:tournamentId/standings', () => {
    beforeEach(async () => {
      // Generate matches
      await request(app)
        .post(`/api/matches/${tournament._id}/generate`)
        .set('Authorization', `Bearer ${authToken}`)
    })

    it('should get initial standings', async () => {
      const res = await request(app)
        .get(`/api/matches/${tournament._id}/standings`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.body).to.be.an('array')
      expect(res.body).to.have.lengthOf(32) // 32 teams

      // Check standing structure
      const standing = res.body[0]
      expect(standing).to.have.property('team')
      expect(standing).to.have.property('group')
      expect(standing).to.have.property('position')
      expect(standing).to.have.property('played', 0)
      expect(standing).to.have.property('won', 0)
      expect(standing).to.have.property('drawn', 0)
      expect(standing).to.have.property('lost', 0)
      expect(standing).to.have.property('points', 0)
    })

    it('should update standings after matches', async () => {
      // Simulate first matchday
      await request(app)
        .post(`/api/matches/${tournament._id}/simulate/matchday/1`)
        .set('Authorization', `Bearer ${authToken}`)

      const res = await request(app)
        .get(`/api/matches/${tournament._id}/standings`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // All teams should have played 1 match
      expect(res.body.every(s => s.played === 1)).to.be.true
      
      // Check positions are updated (1-4 per group)
      const groupA = res.body.filter(s => s.group.groupLetter === 'A')
      expect(groupA).to.have.lengthOf(4)
      expect(groupA.map(s => s.position).sort()).to.deep.equal([1, 2, 3, 4])
    })

    it('should sort by group and position', async () => {
      const res = await request(app)
        .get(`/api/matches/${tournament._id}/standings`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Check sorting
      let previousGroup = ''
      let previousPosition = 0
      
      for (const standing of res.body) {
        if (standing.group.groupLetter !== previousGroup) {
          previousGroup = standing.group.groupLetter
          previousPosition = 0
        }
        expect(standing.position).to.be.above(previousPosition)
        previousPosition = standing.position
      }
    })
  })
})