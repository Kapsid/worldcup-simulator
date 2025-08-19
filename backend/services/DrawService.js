import TournamentPot from '../models/TournamentPot.js'
import TournamentGroup from '../models/TournamentGroup.js'
import TournamentTeam from '../models/TournamentTeam.js'
import Tournament from '../models/Tournament.js'
import World from '../models/World.js'

class DrawService {
  /**
   * Get the ranking for a team based on world-specific rankings or world rankings as fallback
   */
  async getTeamRanking(team, world) {
    if (!world || !world.countryRankings) {
      // Fallback to world ranking if no world or no rankings
      return team.worldRanking || 999
    }
    
    // Find team in world rankings
    const worldRanking = world.countryRankings.find(
      ranking => ranking.code === team.countryCode
    )
    
    if (worldRanking) {
      return worldRanking.rank || 999
    }
    
    // Fallback to world ranking if team not found in world rankings
    return team.worldRanking || 999
  }

  async generatePots(tournamentId, userId) {
    try {
      const tournament = await Tournament.findOne({ _id: tournamentId, createdBy: userId })
      if (!tournament) throw new Error('Tournament not found')

      // Allow pots generation regardless of team count or status
      // if (tournament.teamCount !== 32) {
      //   throw new Error('Tournament must have exactly 32 teams to generate pots')
      // }

      // if (tournament.status !== 'active') {
      //   throw new Error('Tournament must be active to generate pots')
      // }

      await TournamentPot.deleteMany({ tournament: tournamentId })

      // Load world data if tournament belongs to a world (needed for auto-add logic)
      let world = null
      if (tournament.worldId) {
        world = await World.findById(tournament.worldId)
      }

      const teams = await TournamentTeam.find({ tournament: tournamentId })
      console.log(`Found ${teams.length} teams in tournament ${tournamentId}`)
      console.log('Tournament type:', tournament.type)
      console.log('Tournament status:', tournament.status)
      console.log('Tournament team count:', tournament.teamCount)

      if (teams.length === 0) {
        console.log('No teams found in TournamentTeam collection')
        
        // If this is a qualification tournament, try to automatically add qualified teams
        if (tournament.type === 'qualification') {
          console.log('Attempting to auto-add qualified teams...')
          try {
            const TeamManagementService = await import('./TeamManagementService.js')
            const addedTeams = await TeamManagementService.default.addQualifiedTeamsToTournament(tournamentId, userId)
            console.log(`Auto-added ${addedTeams.length} qualified teams`)
            
            // Re-fetch teams after adding them
            const updatedTeams = await TournamentTeam.find({ tournament: tournamentId })
            if (updatedTeams.length > 0) {
              // Continue with pot generation using the newly added teams
              return this.generatePotsWithTeams(tournamentId, updatedTeams, world)
            }
          } catch (error) {
            console.error('Failed to auto-add qualified teams:', error.message)
          }
        }
        
        console.log('Creating empty pots for demonstration')
        // Create empty pots if no teams exist
        const emptyPots = []
        for (let i = 1; i <= 4; i++) {
          const pot = new TournamentPot({
            tournament: tournamentId,
            potNumber: i,
            teams: []
          })
          await pot.save()
          emptyPots.push(pot)
        }
        return emptyPots
      }

      const hostTeam = teams.find(team => team.isHost)
      const nonHostTeams = teams.filter(team => !team.isHost)
      
      // Sort teams using world rankings if available, otherwise world rankings
      const teamsWithRanking = await Promise.all(
        nonHostTeams.map(async (team) => {
          const teamObj = team.toObject()
          return {
            ...teamObj,
            _id: team._id, // Ensure _id is preserved
            _worldRanking: await this.getTeamRanking(team, world)
          }
        })
      )
      teamsWithRanking.sort((a, b) => a._worldRanking - b._worldRanking)

      console.log('Host team:', hostTeam ? hostTeam._id : 'UNDEFINED')
      console.log('Teams with ranking count:', teamsWithRanking.length)
      console.log('First few teams:', teamsWithRanking.slice(0, 3).map(t => t ? t._id : 'UNDEFINED'))

      const pots = []

      const pot1Teams = [hostTeam, ...teamsWithRanking.slice(0, 7)]
      pots.push({ potNumber: 1, teams: pot1Teams })

      const pot2Teams = teamsWithRanking.slice(7, 15)
      pots.push({ potNumber: 2, teams: pot2Teams })

      const pot3Teams = teamsWithRanking.slice(15, 23)
      pots.push({ potNumber: 3, teams: pot3Teams })

      const pot4Teams = teamsWithRanking.slice(23, 31)
      pots.push({ potNumber: 4, teams: pot4Teams })

      const savedPots = []
      for (const pot of pots) {
        console.log(`Creating pot ${pot.potNumber} with ${pot.teams.length} teams`)
        console.log('Teams in pot:', pot.teams.map(team => team ? team._id : 'UNDEFINED'))
        
        const tournamentPot = new TournamentPot({
          tournament: tournamentId,
          potNumber: pot.potNumber,
          teams: pot.teams.filter(team => team && team._id).map(team => team._id)
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

  async generatePotsWithTeams(tournamentId, teams, world) {
    const hostTeam = teams.find(team => team.isHost)
    const nonHostTeams = teams.filter(team => !team.isHost)
    
    // Sort teams using world rankings if available, otherwise world rankings
    const teamsWithRanking = await Promise.all(
      nonHostTeams.map(async (team) => {
        const teamObj = team.toObject()
        return {
          ...teamObj,
          _id: team._id, // Ensure _id is preserved
          _worldRanking: await this.getTeamRanking(team, world)
        }
      })
    )
    teamsWithRanking.sort((a, b) => a._worldRanking - b._worldRanking)

    const pots = []

    const pot1Teams = [hostTeam, ...teamsWithRanking.slice(0, 7)].filter(Boolean)
    pots.push({ potNumber: 1, teams: pot1Teams })

    const pot2Teams = teamsWithRanking.slice(7, 15)
    pots.push({ potNumber: 2, teams: pot2Teams })

    const pot3Teams = teamsWithRanking.slice(15, 23)
    pots.push({ potNumber: 3, teams: pot3Teams })

    const pot4Teams = teamsWithRanking.slice(23, 31)
    pots.push({ potNumber: 4, teams: pot4Teams })

    const savedPots = []
    for (const pot of pots) {
      const tournamentPot = new TournamentPot({
        tournament: tournamentId,
        potNumber: pot.potNumber,
        teams: pot.teams.filter(team => team && team._id).map(team => team._id)
      })
      await tournamentPot.save()
      savedPots.push(tournamentPot)
    }

    return savedPots
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

        // Special handling for Pot 1 to ensure host goes to Group A
        if (pot.potNumber === 1) {
          const hostTeam = shuffledTeams.find(team => team.isHost)
          const nonHostTeams = shuffledTeams.filter(team => !team.isHost)
          
          if (hostTeam) {
            // Always place host team in Group A at random position
            await this.insertTeamAtRandomPosition(tournamentId, 'A', hostTeam._id)
            
            // Place remaining teams from Pot 1 in groups B-H at random positions
            for (let i = 0; i < nonHostTeams.length; i++) {
              const team = nonHostTeams[i]
              const groupIndex = (i + 1) % 8 // Start from group B (index 1)
              const groupLetter = String.fromCharCode(65 + groupIndex)

              await this.insertTeamAtRandomPosition(tournamentId, groupLetter, team._id)
            }
          } else {
            // Fallback: if no host team found, use normal distribution with random positions
            for (let i = 0; i < shuffledTeams.length; i++) {
              const team = shuffledTeams[i]
              const groupIndex = i % 8
              const groupLetter = String.fromCharCode(65 + groupIndex)

              await this.insertTeamAtRandomPosition(tournamentId, groupLetter, team._id)
            }
          }
        } else {
          // For other pots, use normal distribution with random positions
          for (let i = 0; i < shuffledTeams.length; i++) {
            const team = shuffledTeams[i]
            const groupIndex = i % 8
            const groupLetter = String.fromCharCode(65 + groupIndex)

            await this.insertTeamAtRandomPosition(tournamentId, groupLetter, team._id)
          }
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

      // Special handling for Pot 1 to ensure host goes to Group A
      if (potNumber === 1) {
        const hostTeam = shuffledTeams.find(team => team.isHost)
        const nonHostTeams = shuffledTeams.filter(team => !team.isHost)
        
        if (hostTeam) {
          // Always place host team in Group A at random position
          await this.insertTeamAtRandomPosition(tournamentId, 'A', hostTeam._id)
          
          // Place remaining teams from Pot 1 in groups B-H at random positions
          for (let i = 0; i < nonHostTeams.length; i++) {
            const team = nonHostTeams[i]
            const groupIndex = (i + 1) % 8 // Start from group B (index 1)
            const groupLetter = String.fromCharCode(65 + groupIndex)

            await this.insertTeamAtRandomPosition(tournamentId, groupLetter, team._id)
          }
        } else {
          // Fallback: if no host team found, use normal distribution with random positions
          for (let i = 0; i < shuffledTeams.length; i++) {
            const team = shuffledTeams[i]
            const groupIndex = i % 8
            const groupLetter = String.fromCharCode(65 + groupIndex)

            await this.insertTeamAtRandomPosition(tournamentId, groupLetter, team._id)
          }
        }
      } else {
        // For other pots, use normal distribution with random positions
        for (let i = 0; i < shuffledTeams.length; i++) {
          const team = shuffledTeams[i]
          const groupIndex = i % 8
          const groupLetter = String.fromCharCode(65 + groupIndex)

          await this.insertTeamAtRandomPosition(tournamentId, groupLetter, team._id)
        }
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

  async insertTeamAtRandomPosition(tournamentId, groupLetter, teamId) {
    // Get the current group
    const group = await TournamentGroup.findOne({ 
      tournament: tournamentId, 
      groupLetter: groupLetter 
    })
    
    if (!group) {
      throw new Error(`Group ${groupLetter} not found`)
    }
    
    // Get current teams array
    const currentTeams = group.teams || []
    
    // If group is empty, just add the team
    if (currentTeams.length === 0) {
      await TournamentGroup.findOneAndUpdate(
        { tournament: tournamentId, groupLetter: groupLetter },
        { $push: { teams: teamId } }
      )
      return
    }
    
    // Generate random position (0 to current length, inclusive)
    const randomPosition = Math.floor(Math.random() * (currentTeams.length + 1))
    
    // Insert team at random position
    currentTeams.splice(randomPosition, 0, teamId)
    
    // Update the group with the new teams array
    await TournamentGroup.findOneAndUpdate(
      { tournament: tournamentId, groupLetter: groupLetter },
      { $set: { teams: currentTeams } }
    )
  }
}

export default new DrawService()
