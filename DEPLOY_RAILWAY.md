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

1. In your Railway project dashboard:
   - Click "New" → "Database" → "Add MongoDB"
   - Railway will provision a MongoDB instance
   - Connection string will be automatically available as `MONGODB_URL`

2. Update environment variables:
   - Go to your service settings
   - Click on "Variables"
   - Railway automatically injects database URL
   - Add these additional variables:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.up.railway.app
```

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

1. **CORS Issues**: Make sure `FRONTEND_URL` is set correctly in backend env vars
2. **Database Connection**: Railway MongoDB URL is injected as `MONGODB_URL` (not `MONGODB_URI`)
3. **Build Failures**: Check logs in Railway dashboard
4. **Port Issues**: Railway assigns ports automatically, use `process.env.PORT`

## Monitoring

- View logs: Railway Dashboard → Service → Logs
- Check metrics: Railway Dashboard → Service → Metrics
- Health endpoint: `https://your-backend.up.railway.app/health`

## Cost Estimation

- Starter plan: $5/month (includes $5 of usage)
- MongoDB: ~$5-10/month depending on usage
- Frontend hosting: Minimal cost (static files)
- Total: ~$10-15/month for small-medium usage