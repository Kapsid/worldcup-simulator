import { expect } from 'chai'
import sinon from 'sinon'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import UserService from '../../../services/UserService.js'
import User from '../../../models/User.js'

describe('UserService Unit Tests', () => {
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('register', () => {
    it('should hash the password before saving', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }

      const hashStub = sandbox.stub(bcrypt, 'hash').resolves('hashedPassword')
      const saveStub = sandbox.stub(User.prototype, 'save').resolves({
        _id: '123',
        username: userData.username,
        email: userData.email
      })

      const result = await UserService.register(userData)

      expect(hashStub.calledOnce).to.be.true
      expect(hashStub.calledWith('password123', 10)).to.be.true
      expect(saveStub.calledOnce).to.be.true
      expect(result).to.have.property('token')
      expect(result).to.have.property('username', 'testuser')
    })

    it('should throw error if username already exists', async () => {
      const userData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password123'
      }

      sandbox.stub(bcrypt, 'hash').resolves('hashedPassword')
      const saveStub = sandbox.stub(User.prototype, 'save')
      saveStub.rejects(new Error('E11000 duplicate key error'))

      try {
        await UserService.register(userData)
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error.message).to.include('duplicate')
      }
    })

    it('should generate a valid JWT token', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }

      sandbox.stub(bcrypt, 'hash').resolves('hashedPassword')
      sandbox.stub(User.prototype, 'save').resolves({
        _id: '123',
        username: userData.username,
        email: userData.email
      })

      const result = await UserService.register(userData)
      
      // Verify token is valid
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET || 'your-secret-key')
      expect(decoded).to.have.property('id', '123')
    })
  })

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      const credentials = {
        username: 'testuser',
        password: 'password123'
      }

      const mockUser = {
        _id: '123',
        username: 'testuser',
        password: 'hashedPassword'
      }

      const findOneStub = sandbox.stub(User, 'findOne').resolves(mockUser)
      const compareStub = sandbox.stub(bcrypt, 'compare').resolves(true)

      const result = await UserService.login(credentials)

      expect(findOneStub.calledWith({ username: 'testuser' })).to.be.true
      expect(compareStub.calledWith('password123', 'hashedPassword')).to.be.true
      expect(result).to.have.property('token')
      expect(result).to.have.property('username', 'testuser')
    })

    it('should throw error for non-existent user', async () => {
      const credentials = {
        username: 'nonexistent',
        password: 'password123'
      }

      sandbox.stub(User, 'findOne').resolves(null)

      try {
        await UserService.login(credentials)
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error.message).to.equal('Invalid credentials')
      }
    })

    it('should throw error for invalid password', async () => {
      const credentials = {
        username: 'testuser',
        password: 'wrongpassword'
      }

      const mockUser = {
        _id: '123',
        username: 'testuser',
        password: 'hashedPassword'
      }

      sandbox.stub(User, 'findOne').resolves(mockUser)
      sandbox.stub(bcrypt, 'compare').resolves(false)

      try {
        await UserService.login(credentials)
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error.message).to.equal('Invalid credentials')
      }
    })
  })

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword',
        createdAt: new Date()
      }

      const findByIdStub = sandbox.stub(User, 'findById').resolves(mockUser)

      const result = await UserService.getProfile('123')

      expect(findByIdStub.calledWith('123')).to.be.true
      expect(result).to.have.property('username', 'testuser')
      expect(result).to.have.property('email', 'test@example.com')
      expect(result).to.not.have.property('password')
    })

    it('should throw error for non-existent user', async () => {
      sandbox.stub(User, 'findById').resolves(null)

      try {
        await UserService.getProfile('nonexistent')
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error.message).to.equal('User not found')
      }
    })
  })

  describe('changePassword', () => {
    it('should update password when current password is correct', async () => {
      const mockUser = {
        _id: '123',
        password: 'oldHashedPassword',
        save: sinon.stub().resolves()
      }

      sandbox.stub(User, 'findById').resolves(mockUser)
      sandbox.stub(bcrypt, 'compare').resolves(true)
      sandbox.stub(bcrypt, 'hash').resolves('newHashedPassword')

      await UserService.changePassword('123', 'oldPassword', 'newPassword')

      expect(mockUser.password).to.equal('newHashedPassword')
      expect(mockUser.save.calledOnce).to.be.true
    })

    it('should throw error when current password is incorrect', async () => {
      const mockUser = {
        _id: '123',
        password: 'oldHashedPassword'
      }

      sandbox.stub(User, 'findById').resolves(mockUser)
      sandbox.stub(bcrypt, 'compare').resolves(false)

      try {
        await UserService.changePassword('123', 'wrongPassword', 'newPassword')
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error.message).to.equal('Current password is incorrect')
      }
    })
  })

  describe('updateProfile', () => {
    it('should update allowed fields only', async () => {
      const mockUser = {
        _id: '123',
        username: 'oldusername',
        email: 'old@example.com',
        favoriteTeam: null,
        save: sinon.stub().resolves()
      }

      sandbox.stub(User, 'findById').resolves(mockUser)

      const updates = {
        username: 'newusername',
        email: 'new@example.com',
        favoriteTeam: 'Brazil',
        password: 'shouldnotupdate' // This should be ignored
      }

      const result = await UserService.updateProfile('123', updates)

      expect(mockUser.username).to.equal('newusername')
      expect(mockUser.email).to.equal('new@example.com')
      expect(mockUser.favoriteTeam).to.equal('Brazil')
      expect(mockUser.password).to.not.equal('shouldnotupdate')
      expect(mockUser.save.calledOnce).to.be.true
    })

    it('should handle duplicate username error', async () => {
      const mockUser = {
        _id: '123',
        username: 'testuser',
        save: sinon.stub().rejects(new Error('E11000 duplicate key error'))
      }

      sandbox.stub(User, 'findById').resolves(mockUser)

      try {
        await UserService.updateProfile('123', { username: 'existinguser' })
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error.message).to.include('duplicate')
      }
    })
  })
})