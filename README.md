# ⚡ TaskFlow — Team Task Manager

A full-stack team task management app with role-based access control, kanban board, and real-time dashboards.

## Stack

- **Backend:** Node.js · Express · better-sqlite3 · JWT · bcryptjs
- **Frontend:** React 18 · React Router v6 · Vite · Lucide Icons · date-fns
- **Database:** SQLite (via better-sqlite3 — zero setup, file-based)
- **Deploy:** Railway

---

## Features

- **Authentication** — JWT-based signup/login with password hashing
- **Role-Based Access** — Admin and Member roles at both app and project level
- **Projects** — Create, archive, color-coded projects with member management
- **Kanban Board** — Visual task board with 4 columns (Todo / In Progress / Review / Done)
- **Task Management** — Full CRUD with status, priority, assignee, and due dates
- **Dashboard** — Stats overview (total, in-progress, done, overdue) + upcoming tasks
- **Team Page** — Admin-only view to manage org-wide user roles
- **Overdue Detection** — Visual indicators for late tasks

---

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd taskflow

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit .env — change JWT_SECRET to a long random string
```

### 3. Run in development

Open two terminals:

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Railway

### One-click deploy

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo
4. Add environment variables in Railway dashboard:
   - `JWT_SECRET` = your long random secret
   - `NODE_ENV` = `production`
   - `PORT` = `5000` (Railway auto-sets this)

Railway auto-detects `railway.toml` and runs:
- Build: installs deps + builds React frontend
- Start: `node server.js` (serves frontend as static files)

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Projects
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/projects | Get user's projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project + members |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| POST | /api/projects/:id/members | Add member by email |
| DELETE | /api/projects/:id/members/:uid | Remove member |

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tasks | Get all tasks (filters: status, priority, assignee) |
| GET | /api/tasks/project/:id | Tasks for a project |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |
| GET | /api/tasks/stats/dashboard | Dashboard stats |

### Users (Admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/users | List all users |
| PUT | /api/users/:id/role | Change user role |

---

## Data Model

```
users (id, name, email, password, role, avatar_color)
  └── project_members (project_id, user_id, role)
        └── projects (id, name, description, owner_id, status, color)
              └── tasks (id, title, description, project_id, assignee_id, status, priority, due_date)
```

---

## Screenshots

- **Auth Page** — Clean sign in / sign up with role selection
- **Dashboard** — Stats grid + upcoming tasks with overdue detection  
- **Projects** — Card grid with progress bars and member counts
- **Kanban Board** — 4-column board per project with drag-to-add
- **My Tasks** — Filterable list view with inline status updates
- **Team** — Admin panel for managing org-wide roles
