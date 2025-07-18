import jwt from 'jsonwebtoken'
import User from '../../models/User.js'
import Tournament from '../../models/Tournament.js'
import TournamentTeam from '../../models/TournamentTeam.js'

export const generateTestToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' })
}

export const createTestUser = async (userData = {}) => {
  const defaultData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  }
  
  const user = new User({ ...defaultData, ...userData })
  await user.save()
  return user
}

export const createTestTournament = async (userId, tournamentData = {}) => {
  const defaultData = {
    name: 'Test Tournament',
    year: 2024,
    hostCountry: 'Test Country',
    teamCount: 32,
    status: 'active',
    createdBy: userId
  }
  
  const tournament = new Tournament({ ...defaultData, ...tournamentData })
  await tournament.save()
  return tournament
}

export const createTestTeams = async (tournamentId, teams) => {
  const createdTeams = []
  for (const team of teams) {
    const tournamentTeam = new TournamentTeam({
      tournament: tournamentId,
      name: team.name,
      countryCode: team.name.substring(0, 3).toUpperCase(),
      countryName: team.name,
      countryFlag: '🏳️',
      fifaRanking: team.fifaRanking,
      confederation: team.confederation,
      isHost: team.name === 'USA'
    })
    await tournamentTeam.save()
    createdTeams.push(tournamentTeam)
  }
  return createdTeams
}

export const expectApiError = (res, statusCode, errorMessage) => {
  expect(res.status).to.equal(statusCode)
  expect(res.body).to.have.property('error')
  if (errorMessage) {
    expect(res.body.error).to.include(errorMessage)
  }
}