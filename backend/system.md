# World Cup Simulator - Ranking System Documentation

## Overview

The World Cup Simulator features a comprehensive ranking system that tracks country performance across multiple tournaments within each world. Rankings are updated after each tournament completion and take into account both qualification performance and main tournament results.

## Ranking Components

### 1. Base Rankings
- Countries start with rankings based on FIFA rankings
- Initial points calculated as: `Math.max(800, 2200 - (fifaRanking * 8))`
- This gives teams like Argentina (FIFA Rank 1) around 2192 points
- Teams ranked 50th get around 1800 points
- Teams ranked 100th get around 1400 points
- Minimum points: 800 (for very low-ranked teams)

### 2. Tournament Performance Points
Countries earn points based on how far they progress in the main tournament:

| Performance | Base Points |
|-------------|-------------|
| Group Stage | 50 |
| Round of 16 | 120 |
| Quarter-final | 200 |
| Semi-final | 350 |
| Final (Runner-up) | 500 |
| Winner | 750 |

#### Recency Multiplier
Tournament points are adjusted for recency to give more weight to recent tournaments:
- `recencyMultiplier = Math.max(0.8, 1.0 - (yearsSinceWorldStart * 0.02))`
- More recent tournaments have higher impact on rankings
- Older tournaments gradually lose influence

### 3. Qualification Performance Points

Qualification performance is also factored into rankings with a **0.5 weight** to make it less impactful than tournament performance:

#### Match Results
- **Win**: +8 points
- **Draw**: +4 points
- **Loss**: -2 points

#### Goal Difference Bonus/Penalty
- **Goal Difference**: ±2 points per goal (capped at ±50 points)
- Rewards attacking play and good defensive records
- Prevents extreme swings from very high-scoring games

#### Qualification Status
- **Qualified for Tournament**: +40 points
- **Failed to Qualify**: -20 points

#### Final Calculation
```javascript
qualificationPoints = (
  (wins * 8) + 
  (draws * 4) + 
  (losses * -2) + 
  goalDifferenceBonus + 
  qualificationBonus
) * 0.5
```

## Ranking Update Process

Rankings are updated automatically when a tournament is completed:

1. **Store Previous Values**: Previous points and ranks are preserved for comparison
2. **Apply Qualification Points**: If the tournament had qualification, extract and apply qualification performance
3. **Apply Tournament Points**: Add points based on tournament performance
4. **Recalculate Rankings**: Sort all countries by total points and assign new ranks
5. **Calculate Changes**: Determine rank changes from previous tournament

## Host Country Special Rules

### Qualification Slots Adjustment
When a country hosts a tournament:
- Host country gets automatic qualification (doesn't participate in qualification)
- Host's confederation gets one fewer qualification slot
- Example: If Morocco (CAF) hosts, CAF qualification offers 3 slots instead of 4
- Total tournament participants remain at 32

### Ranking Impact
- Host countries still earn tournament performance points
- Host countries don't participate in qualification, so no qualification points
- Host advantage may be reflected in tournament performance

## Tournament History Tracking

Each country maintains a tournament history:
- Last 10 tournaments are stored
- Each entry includes: year, performance, points earned
- Used for detailed analysis and ranking transparency

## Ranking Display Features

### Current Rankings
- Countries sorted by total points
- Shows current rank, previous rank, and rank change
- Displays confederation and current points
- Color-coded rank changes (green = improved, red = declined)

### Rank Change Indicators
- `rankChange = previousRank - currentRank`
- Positive values indicate improvement (moved up)
- Negative values indicate decline (moved down)
- Zero indicates no change

## Implementation Details

### Key Files
- `WorldRankingService.js`: Core ranking calculation logic
- `World.js` model: Stores country rankings and history
- `TournamentService.js`: Triggers ranking updates on completion
- `KnockoutService.js`: Triggers ranking updates on tournament completion

### Database Structure
Each world stores country rankings as:
```javascript
countryRankings: [{
  code: String,           // Country code (e.g., "ARG")
  name: String,           // Country name (e.g., "Argentina")
  flag: String,           // Country flag emoji
  points: Number,         // Current total points
  previousPoints: Number, // Points before last update
  rank: Number,           // Current rank
  previousRank: Number,   // Rank before last update
  rankChange: Number,     // Change in rank (previousRank - rank)
  confederation: String,  // Confederation (e.g., "conmebol")
  tournamentHistory: [{
    year: Number,
    performance: String,
    pointsEarned: Number
  }]
}]
```

## Future Enhancements

Potential improvements to the ranking system:
1. **Strength of Opposition**: Weight points based on opponent rankings
2. **Home/Away Performance**: Different weights for home vs away qualification matches
3. **Regional Bonuses**: Extra points for cross-confederation success
4. **Decline Over Time**: Gradual point decay for inactive periods
5. **Playoff Performance**: Special consideration for playoff/intercontinental matches

## Examples

### Example 1: Brazil wins World Cup
- Tournament Performance: +750 points (winner)
- Qualification Performance: 8 wins, 2 draws, 0 losses, +12 goal difference
  - Match points: (8×8) + (2×4) + (0×-2) = 72
  - Goal difference: +24 points
  - Qualification bonus: +40 points
  - Total qualification: (72 + 24 + 40) × 0.5 = 68 points
- **Total earned**: 750 + 68 = 818 points

### Example 2: Morocco qualifies but loses in group stage
- Tournament Performance: +50 points (group stage)
- Qualification Performance: 5 wins, 3 draws, 2 losses, +3 goal difference
  - Match points: (5×8) + (3×4) + (2×-2) = 48
  - Goal difference: +6 points
  - Qualification bonus: +40 points
  - Total qualification: (48 + 6 + 40) × 0.5 = 47 points
- **Total earned**: 50 + 47 = 97 points

This documentation ensures transparency and understanding of how country rankings evolve throughout multiple World Cup cycles within each world.