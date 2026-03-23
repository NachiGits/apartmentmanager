# Migration Guide: V1 (Angular/Node) to V2 (React/Supabase)

This document outlines the transition from the legacy Angular + Express + SQL Server stack to the new modern React + Supabase architecture.

## 🔄 Architecture Comparison

| Feature | V1 (Legacy) | V2 (Modern) |
|---------|-------------|-------------|
| **Frontend** | Angular 17 | React 18 (Vite) |
| **Backend** | Node.js / Express | Supabase Edge / Client |
| **Database** | MS SQL Server | PostgreSQL (Supabase) |
| **Auth** | JWT + OTP (Manual) | Supabase Auth (Built-in) |
| **UI** | Angular Material | Custom Glassmorphism |

## 🛠 Data Migration

The schema in `SCHEMA.sql` mirrors the logic of the original database but optimizes it for Postgres:

1. **Profiles**: Instead of a separate `Users` table, we use the `auth.users` combined with a `profiles` table linked via Triggers.
2. **Multi-tenancy**: All tables include `apartment_id` to support multiple communities in one instance.
3. **Billing**: The logic from `server/index.js` (Generate Charges) can now be implemented as a Postgres Function (RPC) or handled in the client with easier Supabase syntax.

## ⚡ Key Improvements

- **No Server Maintenance**: By using Supabase, you no longer need to host or maintain a Node.js server.
- **Real-time**: Supabase supports real-time subscriptions (e.g., immediate notification of new announcements).
- **Security**: Row Level Security (RLS) is implemented at the database level, ensuring residents can NEVER see or modify other residents' data.
- **Performance**: Vite provides a significantly faster development experience and smaller production bundles than the legacy setup.

## 📋 TODO for User
1. **Initialize Supabase**: Follow the README to setup your project.
2. **Assign Admin**: After registering as an admin, manually update the `profiles` table to link yourself to an `apartment`.
3. **Add Resident Units**: Use the Residents tab to define the unit sizes (SQFT) for your apartment to enable fair billing.
