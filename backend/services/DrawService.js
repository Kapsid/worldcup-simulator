import TournamentPot from '../models/TournamentPot.js'
import TournamentGroup from '../models/TournamentGroup.js'
import TournamentTeam from '../models/TournamentTeam.js'
import Tournament from '../models/Tournament.js'

class DrawService {
  async generatePots(tournamentId, userId) {
    try {
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) throw new Error('Tournament not found')

      if (tournament.teamCount !== 32) {
        throw new Error('Tournament must have exactly 32 teams to generate pots')
      }

      if (tournament.status !== 'active') {
        throw new Error('Tournament must be active to generate pots')
      }

      await TournamentPot.deleteMany({ tournament: tournamentId })

      const teams = await TournamentTeam.find({ tournament: tournamentId })

      const hostTeam = teams.find(team => team.isHost)
      const nonHostTeams = teams.filter(team => !team.isHost)
      nonHostTeams.sort((a, b) => a.fifaRanking - b.fifaRanking)

      const pots = []

      const pot1Teams = [hostTeam, ...nonHostTeams.slice(0, 7)]
      pots.push({ potNumber: 1, teams: pot1Teams })

      const pot2Teams = nonHostTeams.slice(7, 15)
      pots.push({ potNumber: 2, teams: pot2Teams })

      const pot3Teams = nonHostTeams.slice(15, 23)
      pots.push({ potNumber: 3, teams: pot3Teams })

      const pot4Teams = nonHostTeams.slice(23, 31)
      pots.push({ potNumber: 4, teams: pot4Teams })

      const savedPots = []
      for (const pot of pots) {
        const tournamentPot = new TournamentPot({
          tournament: tournamentId,
          potNumber: pot.potNumber,
          teams: pot.teams.map(team => team._id)
        })
        await tournamentPot.save()
        savedPots.push(tournamentPot)
      }

      return savedPots
    } catch (error) {
      console.error('Error generating pots:', error)
      throw error
    }
  }

  async getPots(tournamentId, userId) {
    try {
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) throw new Error('Tournament not found')

      return await TournamentPot
          .find({ tournament: tournamentId })
          .populate({ path: 'teams', model: 'TournamentTeam' })
          .sort({ potNumber: 1 })
    } catch (error) {
      console.error('Error getting pots:', error)
      throw error
    }
  }

  async initializeGroups(tournamentId, userId) {
    try {
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) throw new Error('Tournament not found')

      await TournamentGroup.deleteMany({ tournament: tournamentId })

      const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
      const groups = []

      for (const letter of groupLetters) {
        const group = new TournamentGroup({
          tournament: tournamentId,
          groupLetter: letter,
          teams: []
        })
        await group.save()
        groups.push(group)
      }

      return groups
    } catch (error) {
      console.error('Error initializing groups:', error)
      throw error
    }
  }

  async getGroups(tournamentId, userId) {
    try {
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) throw new Error('Tournament not found')

      return await TournamentGroup
          .find({ tournament: tournamentId })
          .populate({ path: 'teams', model: 'TournamentTeam' })
          .sort({ groupLetter: 1 })
    } catch (error) {
      console.error('Error getting groups:', error)
      throw error
    }
  }

  async drawAllTeams(tournamentId, userId) {
    try {
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) throw new Error('Tournament not found')

      const pots = await this.getPots(tournamentId, userId)
      let groups = await this.getGroups(tournamentId, userId)

      if (pots.length === 0) {
        throw new Error('No pots found. Generate pots first.')
      }

      if (groups.length === 0) {
        groups = await this.initializeGroups(tournamentId, userId)
      }

      await TournamentGroup.updateMany(
          { tournament: tournamentId },
          { $set: { teams: [], isComplete: false } }
      )

      for (const pot of pots) {
        const shuffledTeams = this.shuffleArray([...pot.teams])

        for (let i = 0; i < shuffledTeams.length; i++) {
          const team = shuffledTeams[i]
          const groupIndex = i % 8
          const groupLetter = String.fromCharCode(65 + groupIndex)

          await TournamentGroup.findOneAndUpdate(
              { tournament: tournamentId, groupLetter },
              { $push: { teams: team._id } }
          )
        }
      }

      await TournamentGroup.updateMany(
          { tournament: tournamentId },
          { $set: { isComplete: true } }
      )

      return await this.getGroups(tournamentId, userId)
    } catch (error) {
      console.error('Error drawing all teams:', error)
      throw error
    }
  }

  async drawPot(tournamentId, userId, potNumber) {
    try {
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) throw new Error('Tournament not found')

      const pot = await TournamentPot
          .findOne({ tournament: tournamentId, potNumber })
          .populate('teams')

      if (!pot) throw new Error('Pot not found')

      let groups = await TournamentGroup
          .find({ tournament: tournamentId })
          .populate('teams')
          .sort({ groupLetter: 1 })

      if (groups.length === 0) {
        groups = await this.initializeGroups(tournamentId, userId)
      }

      const assignedTeamIds = new Set()
      groups.forEach(group => {
        group.teams.forEach(team => {
          if (pot.teams.some(potTeam => potTeam._id.toString() === team._id.toString())) {
            assignedTeamIds.add(team._id.toString())
          }
        })
      })

      const unassignedTeams = pot.teams.filter(team =>
          !assignedTeamIds.has(team._id.toString())
      )

      if (unassignedTeams.length === 0) {
        throw new Error('All teams from this pot have already been drawn')
      }

      const shuffledTeams = this.shuffleArray([...unassignedTeams])

      for (let i = 0; i < shuffledTeams.length; i++) {
        const team = shuffledTeams[i]
        const groupIndex = i % 8
        const groupLetter = String.fromCharCode(65 + groupIndex)

        await TournamentGroup.findOneAndUpdate(
            { tournament: tournamentId, groupLetter },
            { $push: { teams: team._id } }
        )
      }

      return await this.getGroups(tournamentId, userId)
    } catch (error) {
      console.error('Error drawing pot:', error)
      throw error
    }
  }

  async drawSingleTeam(tournamentId, userId, teamId, groupLetter) {
    try {
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) throw new Error('Tournament not found')

      const team = await TournamentTeam.findOne({ _id: teamId, tournament: tournamentId })
      if (!team) throw new Error('Team not found in tournament')

      const group = await TournamentGroup.findOne({
        tournament: tournamentId,
        groupLetter: groupLetter.toUpperCase()
      })
      if (!group) throw new Error('Group not found')

      const existingAssignment = await TournamentGroup.findOne({
        tournament: tournamentId,
        teams: teamId
      })
      if (existingAssignment) throw new Error('Team is already assigned to a group')

      if (group.teams.length >= 4) {
        throw new Error('Group is already full')
      }

      await TournamentGroup.findOneAndUpdate(
          { tournament: tournamentId, groupLetter: groupLetter.toUpperCase() },
          { $push: { teams: teamId } }
      )

      return await this.getGroups(tournamentId, userId)
    } catch (error) {
      console.error('Error drawing single team:', error)
      throw error
    }
  }

  async clearDraw(tournamentId, userId) {
    try {
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) throw new Error('Tournament not found')

      await TournamentGroup.updateMany(
          { tournament: tournamentId },
          { $set: { teams: [], isComplete: false } }
      )

      return await this.getGroups(tournamentId, userId)
    } catch (error) {
      console.error('Error clearing draw:', error)
      throw error
    }
  }

  shuffleArray(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}

export default new DrawService()
