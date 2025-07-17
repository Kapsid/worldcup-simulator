import express from 'express'
import KnockoutService from '../services/KnockoutService.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/:tournamentId/generate', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const bracket = await KnockoutService.generateKnockoutBracket(tournamentId)
    res.json({ bracket })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/:tournamentId/bracket', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const bracket = await KnockoutService.getKnockoutBracket(tournamentId)
    res.json(bracket)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/:tournamentId/simulate/match/:matchId', authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params
    const match = await KnockoutService.simulateKnockoutMatch(matchId)
    res.json({ match })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/:tournamentId/simulate/round/:round', authenticateToken, async (req, res) => {
  try {
    const { tournamentId, round } = req.params
    const matches = await KnockoutService.simulateRound(tournamentId, round)
    res.json({ matches })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/:tournamentId/results', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    const results = await KnockoutService.getFinalResults(tournamentId)
    res.json(results)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/:tournamentId/fix', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params
    await KnockoutService.fixExistingBracket(tournamentId)
    const bracket = await KnockoutService.getKnockoutBracket(tournamentId)
    res.json({ message: 'Bracket fixed successfully', bracket })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router