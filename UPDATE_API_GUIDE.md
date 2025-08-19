# API Migration Guide

## Overview
Your frontend is now configured to use environment variables for API URLs. The main components have been updated, but you'll need to update the remaining files.

## What's Been Done

### 1. Created Configuration Files
- `/frontend/src/config/api.js` - API URL configuration
- `/frontend/src/utils/apiClient.js` - HTTP client wrapper
- `/frontend/src/services/api.js` - All API endpoints organized by feature

### 2. Environment Files
- `/frontend/.env` - Development environment (uses localhost:3001)
- `/frontend/.env.production` - Production environment (update with your Railway URL)

### 3. Updated Components
- `LoginForm.vue` - Uses new API service
- `RegisterForm.vue` - Uses new API service  
- `Worlds.vue` - Uses new API service

## How to Update Remaining Components

### Step 1: Import the API service
Add this import at the top of your script section:
```javascript
import api from '../services/api.js'
```

### Step 2: Replace fetch calls
Instead of:
```javascript
const response = await fetch('http://localhost:3001/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
})
const result = await response.json()
```

Use:
```javascript
const { data: result } = await api.category.method(params)
```

### Common Replacements

#### Authentication
```javascript
// Old
fetch('http://localhost:3001/api/login', {...})
// New
api.auth.login(credentials)

// Old
fetch('http://localhost:3001/api/profile', {...})
// New
api.profile.get()
```

#### Tournaments
```javascript
// Old
fetch(`http://localhost:3001/api/tournaments/${id}`, {...})
// New
api.tournaments.getById(id)

// Old
fetch('http://localhost:3001/api/tournament/countries', {...})
// New
api.tournaments.getCountries()
```

#### Teams
```javascript
// Old
fetch(`http://localhost:3001/api/teams/tournament/${tournamentId}`, {...})
// New
api.teams.getByTournament(tournamentId)
```

#### Matches
```javascript
// Old
fetch(`http://localhost:3001/api/matches/${id}/simulate`, {method: 'POST', ...})
// New
api.matches.simulate(id)
```

### Error Handling
The new API client throws errors in a consistent format:
```javascript
try {
  const { data } = await api.tournaments.create(formData)
  // Success handling
} catch (error) {
  // error.data contains the response data
  // error.response contains the response object (if available)
  this.errorMessage = error.data?.message || 'An error occurred'
}
```

## Files That Need Updating

Based on the grep results, these files still contain hardcoded localhost URLs:

### High Priority (Core Features)
1. `/frontend/src/views/Dashboard.vue`
2. `/frontend/src/views/Tournament.vue`
3. `/frontend/src/views/TournamentDetail.vue`
4. `/frontend/src/views/WorldDetail.vue`
5. `/frontend/src/views/Profile.vue`

### Medium Priority (Game Features)
6. `/frontend/src/components/WorldCupDraw.vue`
7. `/frontend/src/components/GroupMatches.vue`
8. `/frontend/src/components/GroupStandings.vue`
9. `/frontend/src/components/KnockoutBracket.vue`
10. `/frontend/src/components/QualificationManager.vue`

### Lower Priority (Additional Features)
11. `/frontend/src/views/TeamDetail.vue`
12. `/frontend/src/views/PlayerDetail.vue`
13. `/frontend/src/views/MatchDetail.vue`
14. `/frontend/src/components/TournamentStats.vue`
15. `/frontend/src/components/TeamManagement.vue`

### Admin Panel (if needed)
16. All files in `/frontend/src/components/admin/`

## Production Deployment

1. Update `/frontend/.env.production` with your Railway backend URL:
   ```
   VITE_API_URL=https://your-backend-service.up.railway.app
   ```

2. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Update API to use environment variables"
   git push
   ```

3. Railway will automatically rebuild and deploy with the new configuration.

## Testing

1. Local development: Should work as before with `npm run dev`
2. Production build test: 
   ```bash
   cd frontend
   npm run build
   npm run preview
   ```

## Need Help?

If you encounter any issues:
1. Check the browser console for error messages
2. Verify the API URL in Network tab matches your environment
3. Ensure all fetch calls are properly replaced with API service calls