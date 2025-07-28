# Railway Deployment Guide for World Cup Simulator

## Prerequisites
- Railway account (sign up at railway.app)
- GitHub repository with your code
- Railway CLI (optional): `npm install -g @railway/cli`

## Step 1: Prepare Your Code

All necessary configuration files have been created:
- `.env.example` - Environment variables template
- `railway.json` - Railway deployment configuration
- `railway.toml` - Service configuration
- `nixpacks.toml` - Build configuration

## Step 2: Push to GitHub

```bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

## Step 3: Deploy on Railway

### Option A: Using Railway Dashboard (Recommended)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect the configuration

### Option B: Using Railway CLI

```bash
# Login to Railway
railway login

# Create new project
railway init

# Link to your GitHub repo
railway link

# Deploy
railway up
```

## Step 4: Set Up MongoDB

### IMPORTANT: Railway MongoDB Setup

1. **Add MongoDB to your project:**
   - In Railway dashboard, click "New" → "Database" → "MongoDB"
   - Railway will create a MongoDB instance
   - The connection string is provided as `MONGODB_URL` (not `MONGODB_URI`)

2. **Link MongoDB to your service:**
   - Click on your backend service
   - Go to "Variables" tab
   - You should see `MONGODB_URL` already there (injected by Railway)
   - If not, click "Add Variable Reference" and select MongoDB → MONGODB_URL

3. **Add required environment variables:**
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-this
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-url.up.railway.app
   ```

4. **Common Issues:**
   - If you see "connect ECONNREFUSED 127.0.0.1:27017", MongoDB URL is not set
   - Railway uses `MONGODB_URL`, not `MONGODB_URI`
   - Make sure MongoDB service is deployed and running

## Step 5: Configure Services

Railway will create two services based on `railway.toml`:

### Backend Service
- Automatically uses `MONGODB_URL` from Railway MongoDB
- Runs on the assigned Railway port
- Health check at `/health`

### Frontend Service  
- Builds the Vue.js app
- Serves static files
- Update `frontend/.env.production` with your backend URL:
  ```
  VITE_API_URL=https://your-backend-service.up.railway.app
  ```

## Step 6: Update Frontend API Calls

Currently, your frontend uses hardcoded `localhost:3001`. You'll need to update these to use environment variables:

1. Create a config file `frontend/src/config.js`:
```javascript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
```

2. Update all API calls to use this config:
```javascript
// Instead of: 'http://localhost:3001/api/login'
// Use: `${API_URL}/api/login`
```

## Step 7: Deploy Updates

After making changes:

```bash
git add .
git commit -m "Update API URLs for production"
git push origin main
```

Railway will automatically redeploy.

## Environment Variables Summary

### Backend Service
- `PORT` - Automatically set by Railway
- `MONGODB_URI` - Automatically set when you add MongoDB
- `JWT_SECRET` - Set this manually (required)
- `NODE_ENV` - Set to "production"
- `FRONTEND_URL` - Your frontend Railway URL

### Frontend Service
- `PORT` - Automatically set by Railway
- `VITE_API_URL` - Your backend Railway URL

## Troubleshooting

### MongoDB Connection Issues
If you see errors like:
- "connect ECONNREFUSED 127.0.0.1:27017"
- "Operation buffering timed out after 10000ms"

**Solution:**
1. Ensure MongoDB service is added to your Railway project
2. Check Variables tab - `MONGODB_URL` should be present
3. Redeploy your service after adding MongoDB

### Common Fixes
1. **CORS Issues**: Set `FRONTEND_URL` to your Railway frontend URL
2. **Database**: Railway uses `MONGODB_URL` (we handle both in code)
3. **Port**: Railway sets PORT automatically (usually 8080)
4. **Build fails**: Check if all dependencies are in package.json

### Deployment Checklist
- [ ] MongoDB service added and running
- [ ] `MONGODB_URL` visible in Variables
- [ ] `JWT_SECRET` set to secure value
- [ ] `NODE_ENV` set to "production"
- [ ] `FRONTEND_URL` points to your frontend Railway URL
- [ ] Frontend `.env.production` updated with backend URL

## Monitoring

- View logs: Railway Dashboard → Service → Logs
- Check metrics: Railway Dashboard → Service → Metrics
- Health endpoint: `https://your-backend.up.railway.app/health`

## Cost Estimation

- Starter plan: $5/month (includes $5 of usage)
- MongoDB: ~$5-10/month depending on usage
- Frontend hosting: Minimal cost (static files)
- Total: ~$10-15/month for small-medium usage