import { expect } from 'chai'
import request from 'supertest'
import app from '../../../server.js'
import { setupTestDB, teardownTestDB, clearTestDB } from '../../setup.js'
import User from '../../../models/User.js'

describe('Auth Routes Integration Tests', () => {
  before(async function() {
    this.timeout(30000)
    await setupTestDB()
  })

  afterEach(async () => {
    await clearTestDB()
  })

  after(async () => {
    await teardownTestDB()
  })

  describe('POST /api/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }

      const res = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201)

      expect(res.body).to.have.property('token')
      expect(res.body).to.have.property('username', 'testuser')
      expect(res.body).to.not.have.property('password')

      // Verify user was created in database
      const user = await User.findOne({ username: 'testuser' })
      expect(user).to.exist
      expect(user.email).to.equal('test@example.com')
    })

    it('should not register user with existing username', async () => {
      // Create existing user
      await User.create({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      })

      const userData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password456'
      }

      const res = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(400)

      expect(res.body).to.have.property('error')
      expect(res.body.error).to.include('already')
    })

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser'
          // missing email and password
        })
        .expect(400)

      expect(res.body).to.have.property('error')
    })

    it('should validate email format', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalidemail',
        password: 'password123'
      }

      const res = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(400)

      expect(res.body).to.have.property('error')
      expect(res.body.error).to.include('email')
    })

    it('should enforce minimum password length', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123' // too short
      }

      const res = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(400)

      expect(res.body).to.have.property('error')
      expect(res.body.error).to.include('password')
    })
  })

  describe('POST /api/login', () => {
    beforeEach(async () => {
      // Create test user
      await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        })
    })

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: 'testuser',
          password: 'password123'
        })
        .expect(200)

      expect(res.body).to.have.property('token')
      expect(res.body).to.have.property('username', 'testuser')
    })

    it('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        })
        .expect(401)

      expect(res.body).to.have.property('error', 'Invalid credentials')
      expect(res.body).to.not.have.property('token')
    })

    it('should not login with non-existent username', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        })
        .expect(401)

      expect(res.body).to.have.property('error', 'Invalid credentials')
    })

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: 'testuser'
          // missing password
        })
        .expect(400)

      expect(res.body).to.have.property('error')
    })
  })

  describe('Authentication Flow', () => {
    it('should register and then login successfully', async () => {
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'newpassword123'
      }

      // Register
      const registerRes = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201)

      expect(registerRes.body).to.have.property('token')

      // Login
      const loginRes = await request(app)
        .post('/api/login')
        .send({
          username: userData.username,
          password: userData.password
        })
        .expect(200)

      expect(loginRes.body).to.have.property('token')
      expect(loginRes.body.username).to.equal(userData.username)
    })

    it('should handle concurrent registrations', async () => {
      const promises = []
      
      // Try to register same username concurrently
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/register')
            .send({
              username: 'sameuser',
              email: `user${i}@example.com`,
              password: 'password123'
            })
        )
      }

      const results = await Promise.allSettled(promises)
      
      // Only one should succeed
      const successes = results.filter(r => r.status === 'fulfilled' && r.value.status === 201)
      const failures = results.filter(r => r.status === 'fulfilled' && r.value.status === 400)
      
      expect(successes).to.have.lengthOf(1)
      expect(failures.length).to.be.at.least(3)
    })
  })
})