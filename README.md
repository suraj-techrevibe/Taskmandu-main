# Taskmandu

Enterprise workforce management platform built with Node.js, Express, MongoDB, React, and TypeScript.

## Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), TypeScript, JWT auth, WebSocket (realtime chat)  
**Frontend:** React 19, TypeScript, Tailwind CSS 4, Vite, Lucide Icons  
**Deploy:** PM2 (process manager), Nginx (reverse proxy)

## Features

- **Dashboard** — attendance overview, recruitment pipeline, top performers, quick check-in/out
- **Employee Roster** — shift scheduling, department-based assignments
- **Attendance** — multi-session check-in/out per day, elapsed time tracking, location (Onsite/WFH)
- **Leave Management** — request/approve/reject leaves, manager views
- **Projects & Tasks** — project CRUD, task assignment, status tracking
- **Recruitment** — job applications, candidate pipeline stages, interview scheduling
- **Employee Onboarding / Offboarding** — lifecycle management
- **Departments** — department CRUD
- **User Management** — invite users, role assignment
- **Roles & Permissions** — granular permission-based access control (RBAC)
- **Group Chat** — realtime WebSocket-based messaging
- **Notes** — personal/shared notes
- **Reports** — attendance and workforce reports
- **Profile** — user profile with avatar upload

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB running locally or a connection URI
- pnpm or npm

### 1. Clone & Install

```bash
git clone <repo-url> && cd Taskmandu

# Backend
cd backend && cp .env.example .env   # edit secrets
npm install

# Frontend
cd ../frontend && cp .env.example .env
npm install
```

### 2. Seed Database

```bash
cd backend
npm run seed
```

This creates demo users, roles, permissions, and sample data.

### 3. Run Development

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:3000

### Default Login

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@taskmandu.com | Admin@123 |
| HR | hr@taskmandu.com | Hr@123 |

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `5001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/taskmandu` |
| `JWT_ACCESS_SECRET` | Access token secret (32+ chars) | — |
| `JWT_REFRESH_SECRET` | Refresh token secret (32+ chars) | — |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |
| `SMTP_*` | Optional email config for invitations | — |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5001/api/v1` |
| `VITE_WS_URL` | WebSocket URL (optional) | derived from API URL |

## Scripts

| Command | Location | Description |
|---------|----------|-------------|
| `npm run dev` | backend | Start API with hot-reload |
| `npm run build` | backend | Compile TypeScript |
| `npm run seed` | backend | Seed demo data |
| `npm run typecheck` | backend | Type-check without emit |
| `npm run dev` | frontend | Start Vite dev server |
| `npm run build` | frontend | Production build |
| `npm run lint` | frontend | Type-check (`tsc --noEmit`) |

## Production (PM2)

```bash
cd backend && npm run build
cd frontend && npm run build
pm2 start ecosystem.config.cjs
```

## License

Proprietary. All rights reserved. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited without prior written permission from the author.
