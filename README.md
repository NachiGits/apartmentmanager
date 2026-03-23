# HomeConnect - Apartment Management System (V2)

A modern, single-page application for managing apartment communities, built with React, TypeScript, and Supabase.

## 🚀 Features

- **Unique UI**: Glassmorphism design with Framer Motion animations.
- **Role-Based Access**: Specialized dashboards for Admins and Residents.
- **Financial Management**: Track community expenses and generate monthly dues.
- **Maintenance Helpdesk**: Residents can report issues and track resolution.
- **Community Noticeboard**: Broadcast important announcements to all members.
- **Resident Directory**: Manage unit assignments and contact information.

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TypeScript.
- **Styling**: Vanilla CSS with a custom Glassmorphism system.
- **Database & Auth**: Supabase (PostgreSQL).
- **Icons**: Lucide React.
- **Animations**: Framer Motion.

## 📦 Setup Instructions

### 1. Supabase Project Setup
1. Create a new project at [Supabase](https://supabase.com/).
2. Go to the **SQL Editor** and run the contents of `SCHEMA.sql`.
3. Go to **Project Settings > API** and find your `URL` and `anon public` key.

### 2. Local Environment
1. Copy `.env.example` to `.env`.
2. Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### 3. Installation & Run
```bash
cd apartment-manager
npm install
npm run dev
```

## 📄 Key Files
- `SCHEMA.sql`: Database schema and RLS policies.
- `src/lib/supabase.ts`: Supabase client configuration.
- `src/index.css`: Core design system.
- `src/pages/`: Main application screens.
