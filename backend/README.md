# Social Runner Backend - Setup Guide

## ✅ Implementation Complete

All backend and frontend code has been successfully implemented! Here's what was created:

### Backend (Node.js + Express)
- ✅ Authentication service with JWT tokens
- ✅ API key encryption service (AES-256-GCM)
- ✅ User management with bcrypt password hashing
- ✅ Prisma ORM with PostgreSQL
- ✅ Rate limiting and security middleware
- ✅ RESTful API endpoints for auth and API keys

### Frontend (React)
- ✅ Login & Signup pages
- ✅ Protected routes
- ✅ Automatic token refresh
- ✅ User profile in Settings
- ✅ API key status display

---

## 🚀 Next Steps: Database Setup & Testing

### Option 1: Local PostgreSQL (Recommended for Development)

**Install PostgreSQL:**

Mac (using Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Create Database:**
```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE socialrunner;

# Create user (optional)
CREATE USER socialrunner_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE socialrunner TO socialrunner_user;

# Exit
\q
```

**Update .env file:**
```bash
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/socialrunner
```

### Option 2: Supabase (Recommended for Quick Start)

1. Go to https://supabase.com and create free account
2. Create a new project
3. Go to Project Settings → Database
4. Copy the "Connection string" (URI mode)
5. Update .env file with the connection string:
   ```bash
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
   ```

---

## 📝 Setup Instructions

### Step 1: Run Prisma Migrations

```bash
cd /Users/rahul/Socialgirl/backend
npx prisma generate
npx prisma migrate dev --name init
```

This will:
- Generate Prisma Client
- Create database tables (User, RefreshToken, ApiKey)

### Step 2: Update Environment Variables

Edit `/Users/rahul/Socialgirl/backend/.env`:

```bash
# REQUIRED: Add your API keys here
YOUTUBE_API_KEY=your-actual-youtube-api-key
RAPIDAPI_KEY=your-actual-rapidapi-key

# OPTIONAL: Change admin credentials (default: admin@socialrunner.com / changeme123)
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password
```

### Step 3: Run Setup Script

```bash
cd /Users/rahul/Socialgirl/backend
node scripts/setupAdmin.js
```

This will:
- Create admin user account
- Encrypt and store API keys in database
- Output: "✓ Setup completed successfully!"

### Step 4: Start Backend Server

```bash
npm run dev
```

You should see:
```
[Server] Running on port 5000
[Server] Environment: development
[Server] Frontend URL: http://localhost:5173
```

---

## 🎨 Frontend Setup

### Step 1: Install Dependencies (if not already done)

```bash
cd /Users/rahul/Socialgirl/socialgirl-app
npm install
```

### Step 2: Start Frontend Dev Server

```bash
npm run dev
```

You should see:
```
VITE v6.3.5  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 🧪 Testing the Authentication Flow

### Test 1: Sign Up

1. Open http://localhost:5173
2. You should be redirected to `/login`
3. Click "Sign up"
4. Enter email and password (min 8 characters)
5. Click "Sign Up"
6. ✅ Should redirect to `/youtube` page
7. ✅ Header should show your email

### Test 2: API Keys

1. Go to Settings page (click Settings in navigation)
2. You should see:
   - Your email in "User Profile" section
   - API Keys Status showing if keys are configured
3. Try clicking "Refresh Keys" button
4. ✅ Should show "API keys refreshed successfully"

### Test 3: Logout & Login

1. In Settings, click "Logout"
2. ✅ Should redirect to `/login`
3. Enter your email and password
4. Click "Sign In"
5. ✅ Should redirect to `/youtube`

### Test 4: Token Refresh

1. Wait 15 minutes (access token expires)
2. Try navigating to different pages
3. ✅ Token should auto-refresh without logout

---

## 📡 API Endpoints

**Base URL:** http://localhost:5000

### Authentication

- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### API Keys (requires authentication)

- `GET /api/keys` - Get decrypted API keys
- `GET /api/keys/status` - Get API keys status (boolean)

### Health Check

- `GET /health` - Check if server is running

---

## 🔍 Troubleshooting

### Database Connection Issues

**Error: "Connection refused"**
```bash
# Check if PostgreSQL is running
brew services list

# Start PostgreSQL
brew services start postgresql@15
```

**Error: "Database does not exist"**
```bash
# Create the database
psql postgres
CREATE DATABASE socialrunner;
\q
```

### Prisma Migrations

**Error: "Migration failed"**
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Run migrations again
npx prisma migrate dev --name init
```

### Port Already in Use

**Error: "Port 5000 already in use"**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

### Frontend Can't Connect to Backend

**Error: "Network Error"**

1. Check backend is running: http://localhost:5000/health
2. Check `.env.local` has correct API URL:
   ```bash
   VITE_API_URL=http://localhost:5000
   ```
3. Restart frontend dev server

---

## 📦 Deployment (Production)

### Backend: Deploy to Render.com

1. Push code to GitHub
2. Go to https://render.com
3. Create PostgreSQL database (free tier)
4. Create Web Service:
   - Connect GitHub repo
   - Build: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start: `npm start`
5. Add environment variables from `.env`
6. Deploy
7. Run setup script via Render shell:
   ```bash
   node scripts/setupAdmin.js
   ```

### Frontend: Update Vercel

1. Go to Vercel project settings
2. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
3. Redeploy

---

## 🎉 Success Checklist

- [ ] PostgreSQL database created
- [ ] Prisma migrations completed
- [ ] Setup script created admin user
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] Can sign up new user
- [ ] Can login and see protected pages
- [ ] API keys displayed in Settings
- [ ] Can logout successfully
- [ ] Header shows user email

---

## 📞 Need Help?

If you encounter issues:

1. Check backend logs for errors
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Ensure PostgreSQL is running
5. Try clearing browser localStorage and sessionStorage

All code is implemented and ready to test! 🚀
