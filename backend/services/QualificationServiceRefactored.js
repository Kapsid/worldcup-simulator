import Qualification from '../models/Qualification.js'
import Tournament from '../models/Tournament.js'
import TeamGenerationService from './qualification/TeamGenerationService.js'
import GroupGenerationService from './qualification/GroupGenerationService.js'
import MatchSimulationService from './qualification/MatchSimulationService.js'
import MatchSchedulingService from './qualification/MatchSchedulingService.js'

class QualificationService {
  // Start qualification process for a tournament
  async startQualification(tournamentId) {
    try {
      const tournament = await Tournament.findById(tournamentId)
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      // Check if qualification already exists
      let qualification = await Qualification.findOne({ tournamentId })
      
      if (qualification) {
        // Reset existing qualification
        await Qualification.deleteOne({ tournamentId })
      }

      // Generate qualification structure
      const confederations = TeamGenerationService.getAllConfederations()
      const qualificationConfederations = []

      for (const confederation of confederations) {
        const teams = TeamGenerationService.generateConfederationTeams(
          confederation.id, 
          tournament.hostCountryCode
        )
        
        if (teams.length === 0) continue

        const groups = GroupGenerationService.generateConfederationGroups(
          confederation.id, 
          teams
        )

        // Generate matches for each group
        const matches = []
        for (const group of groups) {
          const homeAwayMatches = ['uefa', 'conmebol'].includes(confederation.id)
          const groupMatches = MatchSchedulingService.generateRoundRobinMatches(
            group.teams,
            confederation.id,
            group.groupId,
            homeAwayMatches
          )
          matches.push(...groupMatches)
        }

        qualificationConfederations.push({
          confederationId: confederation.id,
          groups,
          matches,
          qualifiedTeams: [],
          completed: false,
          playoffs: confederation.id === 'ofc' ? [] : undefined
        })
      }

      // Create qualification document
      qualification = new Qualification({
        tournamentId,
        confederations: qualificationConfederations,
        started: true,
        completed: false,
        qualifiedTeams: []
      })

      await qualification.save()
      return qualification
    } catch (error) {
      console.error('Error starting qualification:', error)
      throw error
    }
  }

  // Get qualification data for a tournament
  async getQualificationData(tournamentId) {
    try {
      const qualification = await Qualification.findOne({ tournamentId })
      if (!qualification) {
        return null
      }

      // Add confederation metadata
      const confederations = TeamGenerationService.getAllConfederations()
      qualification.confederations = qualification.confederations.map(conf => {
        const metadata = confederations.find(c => c.id === conf.confederationId)
        return {
          ...conf.toObject(),
          ...metadata
        }
      })

      return qualification
    } catch (error) {
      console.error('Error getting qualification data:', error)
      throw error
    }
  }

  // Simulate next matchday for all confederations
  async simulateNextMatchday(tournamentId) {
    try {
      const qualification = await Qualification.findOne({ tournamentId })
      if (!qualification) {
        throw new Error('Qualification not found')
      }

      let anyMatchSimulated = false

      for (const confederation of qualification.confederations) {
        if (confederation.completed) continue

        const matchesSimulated = await this.simulateNextMatchdayForConfederation(
          tournamentId, 
          confederation.confederationId
        )
        
        if (matchesSimulated) {
          anyMatchSimulated = true
        }
      }

      if (!anyMatchSimulated) {
        throw new Error('No matches available to simulate')
      }

      return await this.getQualificationData(tournamentId)
    } catch (error) {
      console.error('Error simulating next matchday:', error)
      throw error
    }
  }

  // Simulate next matchday for a specific confederation
  async simulateNextMatchdayForConfederation(tournamentId, confederationId) {
    try {
      const qualification = await Qualification.findOne({ tournamentId })
      if (!qualification) {
        throw new Error('Qualification not found')
      }

      const confederation = qualification.confederations.find(
        c => c.confederationId === confederationId
      )
      
      if (!confederation || confederation.completed) {
        throw new Error('Confederation not found or already completed')
      }

      // Find next unplayed matchday
      const completedMatchdays = MatchSchedulingService.getCompletedMatchdays(confederation.matches)
      const availableMatchdays = MatchSchedulingService.getAvailableMatchdays(confederation.matches)
      
      const nextMatchday = availableMatchdays.find(md => !completedMatchdays.includes(md))
      if (!nextMatchday) {
        throw new Error('No matchday available to simulate')
      }

      // Simulate all matches in this matchday
      const matchdayMatches = confederation.matches.filter(
        m => m.matchday === nextMatchday && !m.played
      )

      if (matchdayMatches.length === 0) {
        throw new Error('No matches found for this matchday')
      }

      // Simulate each match
      for (const match of matchdayMatches) {
        MatchSimulationService.simulateMatch(match, true)
        
        // Update team standings
        const homeTeam = confederation.groups
          .flatMap(g => g.teams)
          .find(t => t.teamId === match.homeTeam.teamId)
        const awayTeam = confederation.groups
          .flatMap(g => g.teams)
          .find(t => t.teamId === match.awayTeam.teamId)

        if (homeTeam && awayTeam) {
          MatchSimulationService.updateTeamStandings(
            homeTeam, 
            match.homeScore, 
            match.awayScore, 
            true
          )
          MatchSimulationService.updateTeamStandings(
            awayTeam, 
            match.homeScore, 
            match.awayScore, 
            false
          )
        }
      }

      // Check if confederation is completed
      await this.checkConfederationCompletion(qualification, confederationId)

      await qualification.save()
      return true
    } catch (error) {
      console.error('Error simulating matchday for confederation:', error)
      throw error
    }
  }

  // Simulate individual match
  async simulateIndividualMatch(tournamentId, matchId) {
    try {
      const qualification = await Qualification.findOne({ tournamentId })
      if (!qualification) {
        throw new Error('Qualification not found')
      }

      // Find the match
      let targetMatch = null
      let targetConfederation = null

      for (const confederation of qualification.confederations) {
        const match = confederation.matches.find(m => m.matchId === matchId)
        if (match) {
          targetMatch = match
          targetConfederation = confederation
          break
        }
      }

      if (!targetMatch) {
        throw new Error('Match not found')
      }

      if (targetMatch.played) {
        throw new Error('Match already played')
      }

      // Simulate the match
      MatchSimulationService.simulateMatch(targetMatch, true)

      // Update team standings
      const homeTeam = targetConfederation.groups
        .flatMap(g => g.teams)
        .find(t => t.teamId === targetMatch.homeTeam.teamId)
      const awayTeam = targetConfederation.groups
        .flatMap(g => g.teams)
        .find(t => t.teamId === targetMatch.awayTeam.teamId)

      if (homeTeam && awayTeam) {
        MatchSimulationService.updateTeamStandings(
          homeTeam, 
          targetMatch.homeScore, 
          targetMatch.awayScore, 
          true
        )
        MatchSimulationService.updateTeamStandings(
          awayTeam, 
          targetMatch.homeScore, 
          targetMatch.awayScore, 
          false
        )
      }

      // Check if confederation is completed
      await this.checkConfederationCompletion(qualification, targetConfederation.confederationId)

      await qualification.save()
      return qualification
    } catch (error) {
      console.error('Error simulating individual match:', error)
      throw error
    }
  }

  // Simulate all matches for a confederation
  async simulateAllConfederationMatches(tournamentId, confederationId) {
    try {
      const qualification = await Qualification.findOne({ tournamentId })
      if (!qualification) {
        throw new Error('Qualification not found')
      }

      const confederation = qualification.confederations.find(
        c => c.confederationId === confederationId
      )
      
      if (!confederation) {
        throw new Error('Confederation not found')
      }

      // Simulate all unplayed matches
      const unplayedMatches = confederation.matches.filter(m => !m.played)
      
      for (const match of unplayedMatches) {
        MatchSimulationService.simulateMatch(match, true)
        
        // Update team standings
        const homeTeam = confederation.groups
          .flatMap(g => g.teams)
          .find(t => t.teamId === match.homeTeam.teamId)
        const awayTeam = confederation.groups
          .flatMap(g => g.teams)
          .find(t => t.teamId === match.awayTeam.teamId)

        if (homeTeam && awayTeam) {
          MatchSimulationService.updateTeamStandings(
            homeTeam, 
            match.homeScore, 
            match.awayScore, 
            true
          )
          MatchSimulationService.updateTeamStandings(
            awayTeam, 
            match.homeScore, 
            match.awayScore, 
            false
          )
        }
      }

      // Check if confederation is completed
      await this.checkConfederationCompletion(qualification, confederationId)

      await qualification.save()
      return qualification
    } catch (error) {
      console.error('Error simulating all confederation matches:', error)
      throw error
    }
  }

  // Check if a confederation has completed qualification
  async checkConfederationCompletion(qualification, confederationId) {
    const confederation = qualification.confederations.find(
      c => c.confederationId === confederationId
    )
    
    if (!confederation) return

    // Check if all matches are played
    const allMatchesPlayed = confederation.matches.every(m => m.played)
    
    if (!allMatchesPlayed) return

    // Handle OFC playoff system
    if (confederationId === 'ofc') {
      await this.handleOFCPlayoffs(confederation)
    } else {
      // Determine qualified teams for other confederations
      confederation.qualifiedTeams = this.determineQualifiedTeams(confederation)
      confederation.completed = true
    }

    // Check if all confederations are completed
    const allCompleted = qualification.confederations.every(c => c.completed)
    if (allCompleted) {
      qualification.completed = true
      qualification.qualifiedTeams = qualification.confederations
        .flatMap(c => c.qualifiedTeams || [])
    }
  }

  // Handle OFC playoff system
  async handleOFCPlayoffs(confederation) {
    // Get group winners
    const groupWinners = confederation.groups.map(group => {
      const sortedTeams = [...group.teams].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
        return a.name.localeCompare(b.name)
      })
      return sortedTeams[0]
    })

    // Generate playoff matches if not already generated
    if (!confederation.playoffs || confederation.playoffs.length === 0) {
      confederation.playoffs = MatchSimulationService.generateOFCPlayoffMatches(groupWinners)
    }

    // Check if playoff matches are complete
    const allPlayoffMatchesPlayed = confederation.playoffs.every(m => m.played)
    
    if (allPlayoffMatchesPlayed) {
      const winner = MatchSimulationService.determineOFCPlayoffWinner(confederation.playoffs)
      if (winner) {
        confederation.qualifiedTeams = [winner]
        confederation.completed = true
      }
    }
  }

  // Determine qualified teams for a confederation
  determineQualifiedTeams(confederation) {
    const confederationInfo = TeamGenerationService.getConfederationInfo(confederation.confederationId)
    if (!confederationInfo) return []

    const qualificationSlots = Math.floor(confederationInfo.qualificationSlots)
    const qualifiedTeams = []

    if (confederation.confederationId === 'conmebol') {
      // CONMEBOL: Single league, top teams qualify
      const league = confederation.groups[0]
      if (league) {
        const sortedTeams = [...league.teams].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
          if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
          return a.name.localeCompare(b.name)
        })
        qualifiedTeams.push(...sortedTeams.slice(0, qualificationSlots))
      }
    } else {
      // Other confederations: Group winners and potentially runners-up
      const groupWinners = confederation.groups.map(group => {
        const sortedTeams = [...group.teams].sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
          if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
          return a.name.localeCompare(b.name)
        })
        return sortedTeams[0]
      })

      qualifiedTeams.push(...groupWinners)

      // Add best runners-up if needed
      if (qualifiedTeams.length < qualificationSlots) {
        const runnersUp = confederation.groups.map(group => {
          const sortedTeams = [...group.teams].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points
            if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
            if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
            return a.name.localeCompare(b.name)
          })
          return sortedTeams[1]
        }).filter(team => team)

        // Sort runners-up by performance
        runnersUp.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
          if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
          return a.name.localeCompare(b.name)
        })

        const remainingSlots = qualificationSlots - qualifiedTeams.length
        qualifiedTeams.push(...runnersUp.slice(0, remainingSlots))
      }
    }

    return qualifiedTeams.slice(0, qualificationSlots)
  }

  // Simulate OFC playoff match
  async simulateOFCPlayoffMatch(tournamentId, matchId) {
    try {
      const qualification = await Qualification.findOne({ tournamentId })
      if (!qualification) {
        throw new Error('Qualification not found')
      }

      const ofcConfederation = qualification.confederations.find(
        c => c.confederationId === 'ofc'
      )
      
      if (!ofcConfederation) {
        throw new Error('OFC confederation not found')
      }

      const match = ofcConfederation.playoffs.find(m => m.matchId === matchId)
      if (!match) {
        throw new Error('Playoff match not found')
      }

      if (match.played) {
        throw new Error('Match already played')
      }

      // Simulate the match
      MatchSimulationService.simulateMatch(match, true)

      // Check if both playoff matches are complete
      const allPlayoffMatchesPlayed = ofcConfederation.playoffs.every(m => m.played)
      
      if (allPlayoffMatchesPlayed) {
        const winner = MatchSimulationService.determineOFCPlayoffWinner(ofcConfederation.playoffs)
        if (winner) {
          ofcConfederation.qualifiedTeams = [winner]
          ofcConfederation.completed = true
          
          // Check if all confederations are completed
          const allCompleted = qualification.confederations.every(c => c.completed)
          if (allCompleted) {
            qualification.completed = true
            qualification.qualifiedTeams = qualification.confederations
              .flatMap(c => c.qualifiedTeams || [])
          }
        }
      }

      await qualification.save()
      return qualification
    } catch (error) {
      console.error('Error simulating OFC playoff match:', error)
      throw error
    }
  }

  // Regenerate qualification (reset and start fresh)
  async regenerateQualification(tournamentId) {
    try {
      await Qualification.deleteOne({ tournamentId })
      return await this.startQualification(tournamentId)
    } catch (error) {
      console.error('Error regenerating qualification:', error)
      throw error
    }
  }

  // Finalize qualification (lock it and move to tournament)
  async finalizeQualification(tournamentId) {
    try {
      const qualification = await Qualification.findOne({ tournamentId })
      if (!qualification) {
        throw new Error('Qualification not found')
      }

      if (!qualification.completed) {
        throw new Error('Qualification not completed yet')
      }

      // Update tournament with qualified teams
      const tournament = await Tournament.findById(tournamentId)
      if (!tournament) {
        throw new Error('Tournament not found')
      }

      // Add host country to qualified teams
      const hostCountry = TeamGenerationService.getCountryByCode(tournament.hostCountryCode)
      const qualifiedTeams = [...qualification.qualifiedTeams]
      
      if (hostCountry) {
        qualifiedTeams.unshift({
          teamId: `host_${hostCountry.code}`,
          name: hostCountry.name,
          country: hostCountry.name,
          flag: hostCountry.flag,
          ranking: hostCountry.fifaRanking || 999,
          isHost: true
        })
      }

      tournament.teams = qualifiedTeams
      tournament.teamCount = qualifiedTeams.length
      tournament.canActivate = qualifiedTeams.length === 32

      await tournament.save()

      // Mark qualification as finalized
      qualification.finalized = true
      await qualification.save()

      return { tournament, qualification }
    } catch (error) {
      console.error('Error finalizing qualification:', error)
      throw error
    }
  }
}

export default new QualificationService()