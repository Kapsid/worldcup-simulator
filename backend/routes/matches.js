import express from 'express'
import MatchService from '../services/MatchService.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/:tournamentId/generate', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const matches = await MatchService.generateGroupMatches(tournamentId)
    res.json({ matches })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/:tournamentId/matches', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const matches = await MatchService.getMatches(tournamentId)
    res.json(matches)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/:tournamentId/standings', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const standings = await MatchService.getStandings(tournamentId)
    res.json(standings)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/:tournamentId/simulate/match/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params
    const match = await MatchService.simulateMatch(matchId)
    res.json({ match })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/:tournamentId/simulate/matchday/:matchday', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, matchday } = req.params
    const matches = await MatchService.simulateMatchday(tournamentId, parseInt(matchday))
    res.json({ matches })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Get matches for a specific team
router.get('/:tournamentId/team/:teamId', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, teamId } = req.params
    const matches = await MatchService.getTeamMatches(tournamentId, teamId)
    res.json(matches)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router