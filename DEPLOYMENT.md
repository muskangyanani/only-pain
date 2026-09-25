# Deploying only pain

Two services, one database. Total cost at launch: **₹0–₹500/month** depending on traffic (Atlas M0, Vercel Hobby, Railway/Render starter, Upstash free, Resend free, pay-as-you-go Anthropic).

```
onlypain.app  →  Vercel (Next.js)  ──/api/* rewrite──▶  api.onlypain.app  →  Railway or Render (Hono + Socket.io)
                                                              │
                                        MongoDB Atlas · Upstash Redis · Anthropic · Stripe · Resend
```

The API must be a **long-running Node process** (websockets + SSE), which is why it doesn't run on Vercel functions.

## 0. Accounts you need

- GitHub (this repo) · Vercel · Railway **or** Render · MongoDB Atlas · Anthropic Console
- Optional but recommended: Upstash (Redis), Resend (email), Stripe (Plus)

## 1. MongoDB Atlas

1. Create a free **M0** cluster (region close to your API region). Atlas clusters are replica sets — exactly what Prisma needs.
2. Database Access → add a user. Network Access → allow `0.0.0.0/0` (Railway/Render egress IPs rotate) or the provider's static IP feature.
3. Copy the connection string: `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/onlypain?retryWrites=true&w=majority`
4. Push the schema and indexes once from your machine:
   ```bash
   DATABASE_URL="mongodb+srv://…/onlypain" npm run db:push
   ```
   (Or let the API do it: the Docker `command` in compose runs `prisma db push`; on Railway add a pre-deploy command `npx prisma db push --skip-generate` in `backend/`.)

## 2. API on Railway (recommended) — or Render

**Railway**
1. New Project → Deploy from GitHub → pick this repo.
2. Settings → **Root Directory**: leave at repo root; **Dockerfile path**: `backend/Dockerfile` (Railway auto-detects it if you set "Builder: Dockerfile").
3. Variables (Settings → Variables):
   ```
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=mongodb+srv://…/onlypain
   CLIENT_URL=https://onlypain.app            # your Vercel domain, exact origin, no trailing slash
   JWT_SECRET=<openssl rand -hex 32>
   JWT_REFRESH_SECRET=<openssl rand -hex 32>
   ANTHROPIC_API_KEY=sk-ant-…
   AI_MODEL_COMPANION=claude-opus-5
   AI_MODEL_CLASSIFIER=claude-haiku-4-5
   AI_SAFETY_MODE=full
   REDIS_URL=rediss://default:…@…upstash.io:6379   # optional
   RESEND_API_KEY=re_…                              # optional
   EMAIL_FROM=only pain <hello@yourdomain.com>      # must be a verified Resend domain
   ADMIN_EMAILS=you@yourdomain.com
   STRIPE_SECRET_KEY=sk_live_…                      # optional, see §5
   STRIPE_WEBHOOK_SECRET=whsec_…
   STRIPE_PRICE_PLUS_MONTHLY=price_…
   ```
4. Networking → Generate domain (e.g. `onlypain-api.up.railway.app`) or attach `api.onlypain.app`.
5. Health check path: `/api/health`.

**Render**: Blueprints → New from `render.yaml`. It creates both services; fill the `sync: false` secrets in the dashboard. (Render's free tier sleeps — use Starter for the API so sockets stay up.)

## 3. Web on Vercel

1. Import the repo → **Root Directory: `frontend`** → Framework: Next.js.
2. Environment variables:
   ```
   BACKEND_URL=https://onlypain-api.up.railway.app     # the API origin (server-side only)
   NEXT_PUBLIC_SOCKET_URL=https://onlypain-api.up.railway.app
   NEXT_PUBLIC_APP_URL=https://onlypain.app
   ```
3. Deploy. `/api/*` is rewritten server-side to the API (see `frontend/next.config.ts`), so cookies are first-party and no CORS config is needed for HTTP. Socket.io connects to `NEXT_PUBLIC_SOCKET_URL` directly (the API's `CLIENT_URL` must match your Vercel origin for the socket CORS handshake).
4. Add your domain; set `CLIENT_URL` on the API to the final origin and redeploy the API.

> Alternative: run the web app in Docker anywhere (`frontend/Dockerfile`, standalone output).

## 4. Anthropic

Create an API key at console.anthropic.com. Set `ANTHROPIC_API_KEY`. Costs at launch scale: the classifier (Haiku 4.5) is ~$0.0005 per post; Ember (Opus 5) is roughly $0.03–0.08 per exchange with prompt caching on the system prompt. Quotas per plan live in `backend/src/ai/quota.ts`.

Without a key the API boots in **mock mode**: Ember answers with templated supportive replies and safety falls back to keyword screening — fine for demos, not for production.

## 5. Stripe (Plus)

1. Products → create "only pain Plus", recurring monthly (₹199 or your price). Copy the **price id** → `STRIPE_PRICE_PLUS_MONTHLY`.
2. Developers → Webhooks → add endpoint `https://<api>/api/billing/webhook` with events:
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy the signing secret → `STRIPE_WEBHOOK_SECRET`.
3. Enable the **Customer Portal** (Settings → Billing → Customer portal) so "Manage subscription" works.
4. Test with `stripe listen --forward-to localhost:4000/api/billing/webhook` locally.

## 6. Resend (email)

Verify your domain, create an API key, set `RESEND_API_KEY` and `EMAIL_FROM`. Emails sent: verification, password reset. Without it, links are logged to the API console.

## 7. Upstash Redis (optional, recommended for >1 instance)

Create a database, copy the `rediss://` URL into `REDIS_URL`. Enables shared rate limits and the Socket.io Redis adapter so multiple API instances broadcast correctly.

## 8. Post-deploy checklist

- [ ] `GET https://<api>/api/health` → `{"status":"ok","db":"ok","ai":"live"}`
- [ ] Sign up with an `ADMIN_EMAILS` address → `/mod` is available
- [ ] Post with crisis wording from a test account → author gets the resources dialog + a SUPPORT notification within ~5s, report appears in `/mod`
- [ ] Anonymous post → open it logged out → author is "anonymous" (`authorId: null`)
- [ ] Ember streams (watch the network tab for `text/event-stream`)
- [ ] Two browsers: DM request → accept → messages arrive live
- [ ] Stripe test checkout → user flips to Plus → portal works
- [ ] Set up uptime monitoring on `/api/health`; set Atlas alerts

## Operations notes

- **Backups**: Atlas M0 has no continuous backup — schedule `mongodump` (GitHub Action cron works) or upgrade to M10.
- **Logs**: pino JSON in production; pipe Railway/Render logs to your log drain of choice.
- **Scaling**: the API is stateless apart from sockets; add `REDIS_URL` and scale replicas. MongoDB indexes are declared in `schema.prisma` and applied with `db push`.
- **Secrets rotation**: rotating `JWT_REFRESH_SECRET` logs everyone out (by design).
