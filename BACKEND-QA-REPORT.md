# Style Hub Backend — QA Report

Phase 12 deliverable. **PASS appears only where a command was actually executed and its
output observed.** Everything else is marked NOT_TESTED or EXTERNAL_SERVICE_REQUIRED.

Generated: 2026-09-04 · Node v22.22.2 · npm 10.9.7 · 1 CPU / 4 GB

---

## 0. Environment caveat — read this first

The sandbox this backend was written in has **no PostgreSQL, no Redis and no Docker**. That is
a different environment from the one `BACKEND-AUDIT.md` was produced in. Consequences:

- No migration has been applied. No seed has been run. No query has ever hit a database.
- No HTTP request has been served. No webhook has been verified.
- Concurrency behaviour (row locks, reservation races, double-spend on payouts) is **designed
  for but unproven**.

Treat this backend as **compiles, wires up, and is internally consistent** — not as *working*.
The first thing to do on a machine with Postgres and Redis is section 6 below.

---

## 1. Static verification — PASS

| Check | Command | Result |
| --- | --- | --- |
| Type check | `npx tsc --noEmit` | **PASS** — 0 errors |
| Build | `npm run build` | **PASS** — nest build clean |
| Lint | `npm run lint` (`--max-warnings=0`) | **PASS** — 0 errors, 0 warnings |
| Prisma client generation | `npx prisma generate` | **PASS** (offline engine flags) |
| Prisma schema validity | `npm run db:validate` | NOT_TESTED — needs engine binary |

Source: 142 TypeScript files, ~13273 lines (excluding `src/generated`).

---

## 2. Dependency-injection graph — PASS

```
$ node di-check.cjs
DI_OK: module graph resolved, all providers constructed
```

The full `AppModule` was instantiated via `NestFactory.create`. This is the check that
catches missing providers, unexported services and circular module imports. All 30 feature
modules constructed. (Postgres/Redis were absent; the container builds before any connection
is attempted, so this proves wiring only, not connectivity.)

---

## 3. Route table — PASS

```
$ node route-dump.cjs
138 routes registered under /api/v1
```

Storefront compatibility aliases confirmed present in the live router:

| Route | Purpose |
| --- | --- |
| `GET  /api/v1/auth/me` | 200 + `{user:null}` when anonymous |
| `POST /api/v1/auth/signup` | alias for `/auth/register`; strips `role` |
| `POST /api/v1/auth/forgot` | alias for `/auth/forgot-password` |
| `GET  /api/v1/items/api` | alias onto products/search |
| `POST /api/v1/orders/track` | guest tracking, email verified server-side |
| `POST /api/v1/payments/webhooks/stripe` | raw-body route |

Full list: `docs/routes.txt`.

---

## 4. Unit tests — PASS

```
$ npm test
Test Suites: 2 passed, 2 total
Tests:       18 passed, 18 total
```

Covered: cent/major conversion round-trips, basis-point rounding, largest-remainder
`allocate()` (sum invariant across equal, unequal, negative and 97-line cases), price-bucket
parsing for all five accepted spellings, bucket tiling and half-open range semantics.

**Coverage is narrow and honest**: these are the pure functions. Service-level logic
(pricing order of operations, commission reversal, reservation lifecycle) has **no test**.

---

## 5. Not tested

| Area | Status | Blocker |
| --- | --- | --- |
| Migrations (`db:migrate`) incl. the new sequence migration | NOT_TESTED | No Postgres |
| Seed (`db:seed`) and seeded-account login | NOT_TESTED | No Postgres |
| Any query, any endpoint, end to end | NOT_TESTED | No Postgres/Redis |
| Inventory row locking under concurrency | NOT_TESTED | No Postgres |
| Coupon / gift-card / payout double-spend races | NOT_TESTED | No Postgres |
| Stripe webhook signature verification | EXTERNAL_SERVICE_REQUIRED | No Stripe keys |
| Order creation from a paid intent | EXTERNAL_SERVICE_REQUIRED | Needs webhook delivery |
| Refund + commission reversal against a real payment | EXTERNAL_SERVICE_REQUIRED | Stripe |
| Email delivery (non-`log` providers) | EXTERNAL_SERVICE_REQUIRED | No API key |
| Redis throttler storage, cache invalidation | NOT_TESTED | No Redis |
| BullMQ workers, scheduled reservation expiry | NOT_TESTED | No Redis |
| Docker image build, docker-compose stack | NOT_TESTED | No Docker |
| GitHub Actions workflow | NOT_TESTED | Not executed |
| Storefront integration against a running API | NOT_TESTED | Phase 11 not started |

`test/integration/` and `test/e2e/` contain configs and a setup file that **skips** rather
than fails when `DATABASE_URL_TEST` is unset. **No integration or e2e specs have been
written** — the harness exists, the tests do not.

---

## 6. What to run first on a real machine

```bash
cd backend
cp .env.example .env                 # fill DATABASE_URL, REDIS_URL, JWT secrets
docker compose up -d postgres redis  # or point at your own
npm ci && npx prisma generate
npm run db:migrate                   # includes 20260904090000_order_number_sequences
npm run db:seed
npm run start:dev
```

Then, in rough order of what is most likely to be wrong:

1. `GET /api/v1/health/ready` — proves both connections.
2. Log in as `emma@example.dev` / `Password123!` — proves the argon2id parameters match
   `seed.ts`. If this fails, the hash config diverged.
3. `GET /api/v1/products?page=1` — proves the 40-key DTO and the facet queries. **Compare the
   response against the storefront's expected shape**; the mapper was written from the audit,
   not from a live payload.
4. `GET /api/v1/storefront/config` — check the shape against `src/data/catalog.js`.
5. Full guest checkout with `PAYMENT_PROVIDER=test` — proves pricing, reservation, session
   idempotency. Use `stripe listen --forward-to localhost:4000/api/v1/payments/webhooks/stripe`
   for the real provider.
6. Price-bucket ids: confirm the storefront's actual vocabulary matches `parsePriceBucket`.
   This was guessed and is the most likely silent mismatch.

---

## 7. Known deviations from REMAINING-WORK.md

1. **§2.5 — PaymentIntent placement.** Created *after* the reservation transaction commits
   rather than inside it, with reservation rollback on provider failure. Rationale: holding
   row locks across a network call serialises checkout. Revert if the spec is binding.
2. **Media uploads.** "Register an existing URL" rather than signed direct-to-S3, because
   there is no object storage in this deployment.
3. **New migration added.** `20260904090000_order_number_sequences` creates three Postgres
   sequences (order / return / ticket numbers). Sequences avoid a read-modify-write race on
   human-facing reference numbers. This is the only change to the frozen Phase 3 package.
4. **Review "helpful" votes** are deduped in Redis (30 days, per user or hashed IP) because the
   schema has no vote table and a bare counter would be trivially inflatable.

---

## 8. Phases not delivered

| Phase | Status |
| --- | --- |
| 2 Architecture doc | DONE (`BACKEND-ARCHITECTURE.md`) |
| 4 Core API | Code complete, untested |
| 5 Commerce | Code complete, untested |
| 6 Payments | Code complete, untested |
| 7 Marketplace | Code complete, untested |
| 8 Supporting features | Code complete, untested |
| 9 Admin **API** | Code complete, untested |
| 9 Admin **React portal** | **NOT STARTED** |
| 10 Seller **API** | Code complete, untested |
| 10 Seller **React portal** | **NOT STARTED** |
| 11 Frontend integration | **NOT STARTED** — storefront still calls its mock layer |
| 12 QA | This document; Docker/CI files written but unexecuted |

The two React portals and the storefront rewiring are the remaining bulk of the project.
