import TournamentService from './services/TournamentService.js';
import connectDB from './config/database.js';

const testTournamentPhase = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Test the tournament phase detection
    const tournamentId = '687a0eef16c2eca78d43496d';
    const phase = await TournamentService.getCurrentTournamentPhase(tournamentId);
    
    console.log('Tournament ID:', tournamentId);
    console.log('Current Phase:', phase);
    console.log('Timestamp:', new Date().toISOString());
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing tournament phase:', error);
    process.exit(1);
  }
};

testTournamentPhase();