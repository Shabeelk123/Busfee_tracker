# BusFee Tracker 🚌

A production-ready school bus fee management system.

## Stack
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + JWT

## Project Structure
```
BusfeeTracker/
├── frontend/    # React app (port 5173)
└── backend/     # Express API (port 5000)
```

---

## 🚀 Setup Guide

### 1. Supabase Setup
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste contents of `backend/supabase/schema.sql` → Run
3. Go to **Authentication → Users** → Add a user:
   - Email: `admin@school.com`, Password: `Admin@1234`
4. Copy the user's UUID from the users list
5. In **SQL Editor**, run:
   ```sql
   INSERT INTO profiles (id, name, email, role)
   VALUES ('PASTE_UUID_HERE', 'Super Admin', 'admin@school.com', 'ADMIN');
   ```

### 2. Backend Setup
```powershell
cd backend

# Copy env file and fill in your Supabase credentials
copy .env.example .env
# Edit .env with your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

# Start development server
npm run dev
```

Find your Supabase credentials at:
- **Project URL**: Settings → API → Project URL
- **Service Role Key**: Settings → API → `service_role` (secret key)

### 3. Frontend Setup
```powershell
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

---

## 👤 User Roles

| Role | Access |
|------|--------|
| **Super Admin** | Manage classes, teachers, buses, view all data & reports |
| **Class Teacher** | View own class, register students, mark fees paid/unpaid |
| **Student** | View own profile, bus assignment, and fee status |

## How It Works
1. **Admin** creates classes and buses, then creates teacher accounts
2. **Teacher** logs in → registers students (creates their login too) → assigns bus
3. **Student** logs in → sees their bus, monthly fee, and 12-month payment history
4. **Teacher** marks monthly fees as paid when students pay
