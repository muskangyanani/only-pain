# CLAUDE.md

Guidance for AI coding assistants working in this repository.

## What this is

**only pain** — a mental-health peer-support social network with an AI companion ("Ember"). Monorepo (npm workspaces): `frontend` (Next.js 16, React 19, Tailwind 4) and `backend` (Hono + Prisma/MongoDB + Socket.io + Anthropic SDK).

## Commands

```bash
npm run dev:db          # single-node Mongo replica set on :27018 (required by Prisma)
npm run dev             # api :4000 + web :3000
npm run db:push | db:seed | db:generate
npm test                # backend vitest (pushes schema to onlypain_test first)
npm run typecheck · npm run lint · npm run build
```

Backend runs with Node's native `--env-file=.env` (no dotenv). Frontend reads `frontend/.env.local`.

## Architecture (backend/src)

`app.ts` wires middleware + routes → `routes/*.routes.ts` (Zod validation via `zValidator(..., validationHook)`) → `services/*.service.ts` → Prisma. Errors are thrown as `AppError` (`lib/errors.ts`) and rendered by `middleware/error-handler.ts` into `{ success:false, error, code }`.

Non-negotiables:
- **Anonymity invariant**: every post/comment leaving a service passes through `lib/anonymize.ts` (`stripAnonymous`). Never expose `authorId` for `isAnonymous` content; "following" feeds filter `isAnonymous:false`.
- **Never block posting on safety.** `services/moderation.service.ts` runs after creation (`void moderatePost(...)`); the request returns immediately with `safety.showResources` from the keyword pre-screen (`lib/crisis.ts`).
- **Shared selects live in `lib/selects.ts`** (leaf module) — importing them from services creates ESM cycles that crash at boot even when tests pass.
- Pagination: `cursorArgs` + `paginate` in `lib/pagination.ts`; responses `{ success, data, nextCursor, hasMore }`.
- Socket emits go through `socket/emitter.ts` (`emitToUser`) to avoid import cycles.

AI (`backend/src/ai`): `client.ts` (null client → mock mode), `prompts.ts` (stable system prompts, cached), `companion.ts` (beta messages stream w/ `fallbacks:"default"`), `safety.ts` (`messages.parse` + Zod structured output on Haiku), `tools.ts` (reframe/replies/reflection), `quota.ts` (per-plan daily limits, 402 `QUOTA_EXCEEDED`).

## Architecture (frontend/src)

App Router with route groups: `(marketing)` public pages, `(auth)`, `(flow)/onboarding`, `(app)` (shell with side nav / right rail / mobile nav). `proxy.ts` does cookie-presence redirects only.

- Data: TanStack Query; keys in `lib/query-keys.ts`; `lib/api.ts` is a same-origin client (`/api/*` rewritten in `next.config.ts`) with 401→refresh retry and an SSE helper. Post mutations patch every cached list via `lib/cache.ts`.
- Realtime: `hooks/use-socket.ts` (`SocketBridge` mounted in `Providers`), `useSocketEvent` for component subscriptions.
- Design tokens are CSS variables in `app/globals.css` mapped through Tailwind 4 `@theme inline` (`bg-bg`, `text-fg-muted`, `bg-ember`, `text-violet`, …). Fonts: Fraunces (display) + DM Sans.
- Lint runs the React Compiler rules: no `ref.current` writes during render (use `useLatest`), no `Date.now()`/`Math.random()` in render (use `useNow`), no `setState` in effects (key-remount or adjust-during-render).
- UI primitives in `components/ui` are hand-rolled on the unified `radix-ui` package.

## Conventions

- Copy is lowercase-brand ("only pain"), warm, honest, never toxic-positive. Helplines: India first (14416).
- **No platform emoji anywhere in the UI.** Reactions, circle glyphs and the mood scale are hand-drawn SVG "ink" icons in `frontend/src/components/icons/` (`ReactionIcon`, `CircleIcon`/`CircleBadge`, `MoodIcon`). Circles store an icon *key* (`CIRCLE_ICONS`, mirrored in both constants files), never an emoji.
- Constants (tags, reactions, feelings, limits) are mirrored in `backend/src/lib/constants.ts` and `frontend/src/lib/constants.ts` — change both.
- Prisma + MongoDB: no `@unique` on optional fields (null collides); `db push` only, no migrations.
