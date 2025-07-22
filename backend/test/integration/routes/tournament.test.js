import { expect } from 'chai'
import request from 'supertest'
import app from '../../../server.js'
import { setupTestDB, teardownTestDB, clearTestDB } from '../../setup.js'
import { createTestUser, generateTestToken } from '../../utils/testHelpers.js'
import Tournament from '../../../models/Tournament.js'

describe('Tournament Routes Integration Tests', () => {
  let authToken
  let userId

  before(async function() {
    this.timeout(30000)
    await setupTestDB()
  })

  beforeEach(async () => {
    const user = await createTestUser()
    userId = user._id.toString()
    authToken = generateTestToken(userId)
  })

  afterEach(async () => {
    await clearTestDB()
  })

  after(async () => {
    await teardownTestDB()
  })

  describe('POST /api/tournaments', () => {
    it('should create a new tournament with valid data', async () => {
      const tournamentData = {
        name: 'World Cup 2024',
        year: 2024,
        hostCountry: 'USA',
        teamCount: 32
      }

      const res = await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tournamentData)
        .expect(201)

      expect(res.body).to.have.property('_id')
      expect(res.body).to.have.property('name', 'World Cup 2024')
      expect(res.body).to.have.property('status', 'setup')
      expect(res.body.createdBy).to.equal(userId)

      // Verify in database
      const tournament = await Tournament.findById(res.body._id)
      expect(tournament).to.exist
      expect(tournament.teamCount).to.equal(32)
    })

    it('should not create tournament without authentication', async () => {
      const tournamentData = {
        name: 'World Cup 2024',
        year: 2024,
        hostCountry: 'USA',
        teamCount: 32
      }

      const res = await request(app)
        .post('/api/tournaments')
        .send(tournamentData)
        .expect(401)

      expect(res.body).to.have.property('error')
    })

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'World Cup 2024'
          // missing other required fields
        })
        .expect(400)

      expect(res.body).to.have.property('error')
    })

    it('should validate team count', async () => {
      const tournamentData = {
        name: 'World Cup 2024',
        year: 2024,
        hostCountry: 'USA',
        teamCount: 31 // invalid - must be 32
      }

      const res = await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tournamentData)
        .expect(400)

      expect(res.body.error).to.include('32')
    })
  })

  describe('GET /api/tournaments', () => {
    beforeEach(async () => {
      // Create some tournaments
      await Tournament.create([
        {
          name: 'World Cup 2022',
          year: 2022,
          hostCountry: 'Qatar',
          teamCount: 32,
          status: 'completed',
          createdBy: userId
        },
        {
          name: 'World Cup 2024',
          year: 2024,
          hostCountry: 'USA',
          teamCount: 32,
          status: 'active',
          createdBy: userId
        }
      ])
    })

    it('should list user tournaments', async () => {
      const res = await request(app)
        .get('/api/tournaments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.body).to.be.an('array')
      expect(res.body).to.have.lengthOf(2)
      expect(res.body[0]).to.have.property('name')
      expect(res.body[0]).to.have.property('status')
    })

    it('should not show other users tournaments', async () => {
      // Create another user's tournament
      const otherUser = await createTestUser({ username: 'otheruser' })
      await Tournament.create({
        name: 'Other Tournament',
        year: 2024,
        hostCountry: 'Brazil',
        teamCount: 32,
        createdBy: otherUser._id
      })

      const res = await request(app)
        .get('/api/tournaments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.body).to.have.lengthOf(2) // Only user's own tournaments
      expect(res.body.every(t => t.createdBy === userId)).to.be.true
    })

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/tournaments')
        .expect(401)

      expect(res.body).to.have.property('error')
    })
  })

  describe('GET /api/tournaments/:id', () => {
    let tournament

    beforeEach(async () => {
      tournament = await Tournament.create({
        name: 'Test Tournament',
        year: 2024,
        hostCountry: 'USA',
        teamCount: 32,
        status: 'active',
        createdBy: userId
      })
    })

    it('should get tournament details', async () => {
      const res = await request(app)
        .get(`/api/tournaments/${tournament._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.body).to.have.property('_id', tournament._id.toString())
      expect(res.body).to.have.property('name', 'Test Tournament')
      expect(res.body).to.have.property('hostCountry', 'USA')
    })

    it('should not access other users tournament', async () => {
      const otherUser = await createTestUser({ username: 'otheruser' })
      const otherTournament = await Tournament.create({
        name: 'Other Tournament',
        year: 2024,
        hostCountry: 'Brazil',
        teamCount: 32,
        createdBy: otherUser._id
      })

      const res = await request(app)
        .get(`/api/tournaments/${otherTournament._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(res.body).to.have.property('error')
    })

    it('should handle invalid tournament ID', async () => {
      const res = await request(app)
        .get('/api/tournaments/invalidid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(res.body).to.have.property('error')
    })
  })

  describe('PUT /api/tournaments/:id/status', () => {
    let tournament

    beforeEach(async () => {
      tournament = await Tournament.create({
        name: 'Test Tournament',
        year: 2024,
        hostCountry: 'USA',
        teamCount: 32,
        status: 'setup',
        createdBy: userId
      })
    })

    it('should update tournament status', async () => {
      const res = await request(app)
        .put(`/api/tournaments/${tournament._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'active' })
        .expect(200)

      expect(res.body).to.have.property('status', 'active')

      // Verify in database
      const updated = await Tournament.findById(tournament._id)
      expect(updated.status).to.equal('active')
    })

    it('should validate status values', async () => {
      const res = await request(app)
        .put(`/api/tournaments/${tournament._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid' })
        .expect(400)

      expect(res.body).to.have.property('error')
    })

    it('should not update completed tournament', async () => {
      // Set tournament as completed
      tournament.status = 'completed'
      await tournament.save()

      const res = await request(app)
        .put(`/api/tournaments/${tournament._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'active' })
        .expect(400)

      expect(res.body.error).to.include('completed')
    })
  })

  describe('DELETE /api/tournaments/:id', () => {
    let tournament

    beforeEach(async () => {
      tournament = await Tournament.create({
        name: 'Test Tournament',
        year: 2024,
        hostCountry: 'USA',
        teamCount: 32,
        status: 'setup',
        createdBy: userId
      })
    })

    it('should delete tournament in setup status', async () => {
      const res = await request(app)
        .delete(`/api/tournaments/${tournament._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(res.body).to.have.property('message')

      // Verify deletion
      const deleted = await Tournament.findById(tournament._id)
      expect(deleted).to.be.null
    })

    it('should not delete active tournament', async () => {
      tournament.status = 'active'
      await tournament.save()

      const res = await request(app)
        .delete(`/api/tournaments/${tournament._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(res.body.error).to.include('active')
    })

    it('should not delete other users tournament', async () => {
      const otherUser = await createTestUser({ username: 'otheruser' })
      const otherTournament = await Tournament.create({
        name: 'Other Tournament',
        year: 2024,
        hostCountry: 'Brazil',
        teamCount: 32,
        status: 'setup',
        createdBy: otherUser._id
      })

      const res = await request(app)
        .delete(`/api/tournaments/${otherTournament._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      // Verify not deleted
      const exists = await Tournament.findById(otherTournament._id)
      expect(exists).to.exist
    })
  })
})