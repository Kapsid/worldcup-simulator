@echo off
echo 🏆 Starting World Cup Simulator...
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing root dependencies...
    npm install
)

if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    npm install
    cd ..
)

echo.
echo 🚀 Starting both frontend and backend...
echo 📍 Frontend will be available at: http://localhost:3000
echo 📍 Backend API will be available at: http://localhost:3001
echo.
echo Demo credentials: username: admin, password: admin
echo.
echo Press Ctrl+C to stop both servers
echo.

npm run dev