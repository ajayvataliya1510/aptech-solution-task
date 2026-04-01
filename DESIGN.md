# Aptech Solution Task - Design Decisions

This document details the critical architectural choices, caching strategies, and data mechanisms implemented within the scope of this full-stack challenge.

## 1. System Architecture
### Backend Framework: Express.js & TypeScript
Express was selected for its robust ecosystem and lightweight footprint, mapped precisely matching Next.js. TypeScript enforces strict data models ensuring APIs cannot emit unstructured schemas safely, dramatically decreasing runtime errors.
- **Why Prisma?** Prisma translates raw tables explicitly into typed components without massive abstracted entity wrappers preventing `N+1` failures implicitly. 

### Frontend Framework: Next.js (App Router) & React Query
- Next.js acts cleanly as a routing proxy capable of optimizing nested layouts. 
- **TanStack React Query** processes fetching data gracefully, specifically implementing immediate synchronous invalidations across the component tree to avoid jittery loads.

## 2. Authentication Flow (JWT & Redis)
- **Token Dual Strategy**: Implemented Short-lived Access Tokens (15 min) paired tightly against Long-lived Refresh Tokens (7 Days). 
- **Security Check**: The Refresh tokens are tracked tightly via Redis `sets`. If a user logs out cleanly or issues arise, the exact `refreshToken` is detached via Redis immediately rendering subsequent Axios calls 401s flawlessly. This is significantly more efficient than checking Postgres rows per hit on `verify()`.

## 3. Caching Strategy
I strictly adhered to an event-based invalidation system heavily leveraging native Redis pipelines.
1. **Projects/Tasks (Cache-Aside Strategy)** 
   - Hitting `/api/projects` inserts data automatically mapped `projects:user:{userId}` -> JSON responses expiring within 5 minutes safely. 
2. **Invalidation Overwrites**
   - Hitting `POST /tasks` or adding project models actively executes `redis.del()` queries purging parents linked to the specific users involved inside the transaction ensuring that Data stays "Real time".

## 4. Background Processing (BullMQ)
- Instead of keeping HTTP sockets hanging, triggered `/api/projects/:id/export` routes securely append JSON blobs natively mapped into the `BullMQ` engine `ExportQueue`. 
- An independent `exportWorker.ts` runs aside pulling from the task array efficiently preventing arbitrary CPU halts inside the event loop.
- **Polling Setup:** The Next.js frontend naturally utilizes React Query's `refetchInterval` function, cleanly pulsing `/api/exports/:id` returning early to download the cached CSV link without locking memory contexts asynchronously.

## 5. Kanban Optimistic Updates
To solve interface lag, the `onDragEnd` dnd-kit context inside Next.js modifies the nested array of tasks via React state strictly and intercepts `queryClient.setQueryData()` caching internally instantly. 
- The `PATCH /api/tasks/:id` triggers separately under the hood. If the backend denies the shift (Server timeout/auth), it explicitly "rolls back" visually without prompting awkward page refreshes.

## Summary
The combination of strictly validated backend gates, rapid-access Redis lookups, native Bull Queue separation, and client-side Optimistic rendering architectures perfectly mirrors standard modern "Trello/Jira" product standards.
