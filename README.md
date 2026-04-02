# Aptech Solutions — Project & Task Management System

A robust, full-stack Project & Task Management application featuring real-time task tracking, Kanban boards, collaborative project management, and automated background data exports.

## 🚀 Quick Start (Dockerized)

If you have Docker and Docker Compose installed:

```bash
# 1. Spin up the entire stack (PostgreSQL, Redis, Backend, Frontend)
docker-compose up --build
```

Access the application at `http://localhost:3000`.

---

## 🛠 Manual Setup Flow

To run the application locally without Docker, follow these steps:

### 1. Prerequisites
- **Node.js**: v18 or later
- **PostgreSQL**: Running instance
- **Redis**: Running instance (required for Caching and Export Queue)

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create/Configure .env file
# Copy the values from the provided configuration or use defaults:
# PORT=4000
# DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
# REDIS_URL=redis://localhost:6379
# JWT_SECRET=your_secret
# JWT_REFRESH_SECRET=your_refresh_secret

# Run Database Migrations (Prisma)
npx prisma migrate dev

# Start Development Server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure .env file
# VITE_API_URL=http://localhost:4000/api

# Start Development Server
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 📑 Features & Functionality

### 🔐 Authentication
- **Secure Workflow**: JWT-based authentication with Access and Refresh token rotation.
- **Persistence**: User session maintained across page reloads via local storage.
- **Validation**: Full form validation using Formik and Yup.

### 📊 Project Management
- **Collaboration**: Create projects and invite team members using their email address.
- **Role-Based Access**: Only project owners can manage members or delete tasks.
- **Caching**: Project lists and details are cached in Redis for high-performance retrieval.

### 📋 Task Kanban Board
- **Drag & Drop**: Seamlessly move tasks between "To Do", "In Progress", and "Done" columns using `@dnd-kit`.
- **DND Robustness**: Implemented custom CORS "Header Hardening" and fallback to `PUT` method to ensure drag-and-drop works across all network environments.
- **Task Lifecycle**: Create, Edit (Title, Description, Priority, Due Date), and Delete tasks with real-time UI updates.

### 📤 Data Export
- **Background Jobs**: Leveraging BullMQ and Redis to handle project-to-CSV exports without blocking the main thread.
- **Status Tracking**: Poll for export completion status and download generated files directly from the dashboard.

---

## 🔧 Core Commands

| Component | Command | Description |
| :--- | :--- | :--- |
| **Backend** | `npm run dev` | Starts server with hot-reload (Nodemon) |
| **Backend** | `npm test` | Runs Jest unit and integration tests |
| **Backend** | `npx prisma studio` | Visual GUI for database management |
| **Frontend** | `npm run dev` | Starts Vite development server |
| **Frontend** | `npm run build` | Builds production bundle |

---

## 🏗 System Architecture

- **Primary Stack**: Node.js (Express), TypeScript, Prisma (PostgreSQL), Redis.
- **Frontend**: React (Vite), Tailwind CSS, TanStack Query (React-Query).
- **Security**: Helmet, Rate Limiting, and specialized CORS pre-flight handlers.
- **Queueing**: BullMQ for processing CSV exports in the background.
