# Stellar Wave Hub - Local Development Setup

## ✅ Current Status
- ✅ Dependencies installed
- ✅ Environment file created (`.env.local`)
- ✅ Development server configured (without HTTPS)
- ✅ Server running on `http://localhost:3000`

## 🔧 Next Steps Required

### 1. Database Setup (Choose One Option)

#### Option A: Use Supabase (Current Configuration)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Get your project URL and service role key
4. Update `.env.local` with your credentials:
   ```env
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
5. Run the schema from `web/data/supabase/schema.sql` in your Supabase SQL Editor

#### Option B: Use Local SQLite (Requires Code Changes)
The project currently uses Supabase, but you can switch to SQLite by:
1. Modifying `web/src/lib/firebase.ts` to use SQLite instead
2. Creating the SQLite database file
3. Running the schema setup

### 2. Initialize Database Schema
If using Supabase, run this SQL in your Supabase SQL Editor:

```sql
-- Copy the contents from web/data/supabase/schema.sql
-- This will create all necessary tables and initial data
```

### 3. Create Admin Account
1. Register normally through the web interface
2. Update your role in the database:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```

## 🚀 Current Server Status

The development server is running at:
- **URL:** http://localhost:3000
- **Status:** ✅ Running (Terminal ID: 3)
- **Issue:** Needs Supabase credentials to function properly

## 📁 Project Structure

```
web/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # Backend API routes
│   │   ├── (pages)/      # Frontend pages
│   │   └── layout.tsx    # Root layout
│   ├── components/       # Reusable UI components
│   ├── context/          # React context (auth, etc.)
│   └── lib/              # Utilities (db, auth, stellar)
├── data/                 # Database files
├── .env.local           # Environment variables
└── package.json         # Dependencies and scripts
```

## 🔍 What's Already Working

1. **Project Submission:** Stellar Quest Learn has been successfully submitted (ID: 1)
2. **User Account:** Created user account (stellar_researcher, ID: 2)
3. **Database Schema:** SQLite database exists with proper schema
4. **Next.js App:** Configured and ready to run

## 🛠️ Available Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 🐛 Current Error

The server is running but shows this error:
```
Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.
```

**Solution:** Set up Supabase credentials in `.env.local` as described above.

## 📝 Notes

- The README mentions SQLite, but the actual code uses Supabase
- HTTPS is disabled for easier local development
- The submitted Stellar Quest Learn project is ready for admin approval
- All API endpoints are available at `http://localhost:3000/api/*`