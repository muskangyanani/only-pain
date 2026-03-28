# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OnlyPain is a mental health focused anonymous-friendly social media app. Monorepo with npm workspaces: `frontend` (Next.js 14) and `backend` (Hono.js + MongoDB).

## Commands

```bash
# Development (from root)
npm run dev              # Start both backend and frontend concurrently
npm run dev:backend      # Backend only (tsx watch, port 3001)
npm run dev:frontend     # Frontend only (Next.js dev, port 3002)

# Database (from backend/)
npm run db:push          # Sync Prisma schema to MongoDB
npm run db:generate      # Regenerate Prisma client
npm run db:studio        # Open Prisma Studio

# Frontend (from frontend/)
npm run build            # Next.js production build
npm run lint             # ESLint

# Backend uses --env-file=.env flag with tsx (not dotenv)
```

## Architecture

### Backend (`backend/src/`)

Hono.js on Node HTTP server. Layered architecture: **routes → controllers → services → Prisma**.

- `app.ts` — Hono instance, middleware wiring (logger, CORS, error handler), all route mounting via `app.route("/api/prefix", routes)`
- `lib/env.ts` — Zod-validated env vars, crashes on startup if missing
- `lib/anonymize.ts` — **Core safety invariant**: `stripAnonymous()` replaces author with `{id: null, username: "Anonymous", avatarUrl: null}` when `isAnonymous` is true. Called in every service that returns posts/comments.
- `lib/crisis-keywords.ts` — Keyword scanner that silently flags posts to `FlaggedPost` table. Never blocks posting, never notifies user.
- `middleware/auth.ts` — Reads `access_token` httpOnly cookie, verifies JWT, sets `c.set("userId", ...)`. Returns 401 if invalid.
- `middleware/optionalAuth.ts` — Same but sets userId to null instead of 401-ing. Used for public feeds.
- `middleware/rateLimiter.ts` — In-memory, login endpoint only: 5 attempts/15min per IP.

### Frontend (`frontend/src/`)

Next.js 14 App Router with route groups:
- `(auth)` — login, signup (public, centered layout)
- `(main)` — feed, profile, explore, notifications, settings (3-column Twitter-style layout)

Key files:
- `context/auth-context.tsx` — AuthProvider wrapping entire app. Provides `user`, `login`, `signup`, `logout`, `isAuthenticated`. Calls `/api/auth/me` on mount.
- `lib/api-client.ts` — Fetch wrapper with `credentials: "include"`. Auto-retries on 401 by calling `/api/auth/refresh` first.
- `hooks/use-infinite-scroll.ts` — IntersectionObserver-based infinite scroll with ref-based loading guard (not state) to prevent race conditions.
- `components/layout/left-sidebar.tsx` — Main navigation, collapses to icons on smaller screens.

### Database

MongoDB via Prisma. Models: User (with Role enum: USER/MOD/ADMIN), Post, Comment, Reaction, Follow, Notification, FlaggedPost.

## Key Patterns

**API response format** — Every endpoint returns `{ success: true, data: T }` or `{ success: false, error: "message" }`. Paginated responses add `nextCursor` and `hasMore`.

**Cursor-based pagination** — Fetch `limit + 1`, pop extra to determine `hasMore`. Used everywhere (feed, comments, notifications, profile posts).

**Validation** — Zod schemas in `validators/` directory, applied via `@hono/zod-validator` middleware on routes. Post content max 500 chars, comments max 300 chars. Tags are optional, from a predefined enum list.

**Auth tokens** — Access token (15min) + refresh token (7 days), both as httpOnly cookies. Backend stores refresh token in User model for single-session enforcement.

**Anonymous posts** — `isAnonymous` boolean on Post and Comment. Anonymization happens at the service layer via `stripAnonymous()`, never at the route layer. The real authorId is stored in DB but stripped before API response.

**2-level comment nesting** — If a parent comment already has a parentCommentId, new replies flatten to the parent's parent (prevents deep threading).

**Theme** — `next-themes` with class-based dark/light mode. CSS variables in `globals.css`. Primary color: `#41b0f0`. Default: dark.

**Fonts** — Inter (body) + Dancing Script (logo cursive "Pain" text). Both loaded via `next/font/google` with CSS variables.

## Environment

Backend requires: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`. See `backend/.env.example`. Frontend: `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.

CORS is configured to only allow `CLIENT_URL` origin. Frontend must run on the port matching `CLIENT_URL` (currently `http://localhost:3002`).
