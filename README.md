# Aptech Solutions — Project & Task Management System

This is a Full-Stack Project & Task Management application built to tracking and assigning tasks across user projects with Role-Based Access controls, Drag-and-drop Kanban interfaces and robust job-queue driven data exports.

## Key Decisions

Please refer to the `DESIGN.md` for extended documentation outlining the system architecture, access models, caching, and resiliency mechanisms.

- Backend: Node.js, Express, TypeScript, Prisma (PostgreSQL), Redis, BullMQ.
- Frontend: Next.js, React, TypeScript, TailwindCSS, TanStack Query.
- Containers: `docker-compose.yml` configures PostgreSQL, Redis, and hot-reloadable backend APIs.
