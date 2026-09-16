# Workspace MVP — build plan

Breakdown of `apps/web/src/components/layout/workspace.md` into ordered, checkable work.

**Source of truth for scope:** that spec. **Source of truth for architecture:** `ROADMAP.md`. Where they disagree, see "Reconciling the spec" below.

---

## Reconciling the spec with what already exists

The spec was written as if starting from zero. This project is not at zero, so three points are adjusted deliberately:

| Spec says | Reality | Decision |
|---|---|---|
| "Do not build backend logic or authentication" | Auth, multi-tenancy, RLS and workspaces are built and tested (Phases 2–4) | **Keep them.** The instruction was about not blocking UI work on backend — that risk is already gone. |
| "Create realistic mock data" | Pilgrims, packages, bookings, invoices, payments, groups, documents have **no** backend | **Mock those**, exactly as specified. Auth/org data stays real. |
| Monorepo with `packages/ui`, `packages/i18n` | We have `config`, `types`, `utils`, `validations`; UI lives in `apps/web` | **Don't split `ui` out yet.** One consumer, so extraction is churn with no payoff. Revisit at a second app. |

**Naming:** "Baraka Travels" in the spec is the *sample agency*, not a rename. The product is Manasik.

**The central workflow every page must serve:**

```
Create Package → Add Pilgrim → Create Booking → Track Documents & Payments
→ Assign to Departure Group → Complete Trip
```

---

## Phase A — Foundations (~15%)

Nothing below can be built well without these. Doing them first avoids rewriting eight pages.

- [~] **A1. Fix the fonts.** SKIPPED at your request. `@theme` maps `--font-heading` to `--font-sans` (Geist). Spec requires **Manrope** headings, **Outfit** body. Also remove the duplicate `@import url(fonts.googleapis.com/...)` at the top of `globals.css` — `next/font` already self-hosts both, and the CSS import adds a render-blocking request that defeats it.
- [x] **A2. Trim the sidebar** to the MVP eight: Dashboard, Pilgrims, Packages, Bookings, Groups, Payments, Documents, Settings. Hotels / Transport / Flights / Calendar / Staff become disabled "Coming soon" entries rather than links to empty pages.
- [x] **A3. List table.** DiceUI abandoned — it is Radix-based and this project is Base UI (32 type errors across 8 files). Replaced with `components/workspace/data-table.tsx`: TanStack Table v8 on the plain shadcn table, owning search, sorting, faceted filters, column visibility and pagination. Original text kept below for the record.
  - ~~Install the data grid (`@diceui/data-grid`)~~ (`@diceui/data-grid` + sort/filter/view/row-height/skeleton/select-column). ⚠️ Its CLI does not rewrite import paths — `lib/data-grid.ts`, `hooks/use-data-grid.ts` and every `components/data-grid/*.tsx` need manual fixes to `@/lib/data-grid` and `@/types/data-grid`. Budget for that.
- [x] **A4. Mock data layer** — `src/mocks/{data,queries,store}.ts`. `data` is one relational graph; `queries` joins and derives; `store` makes it mutable via `useSyncExternalStore` so create/edit persist across routes within a session. — `src/mocks/`. One coherent dataset, not per-page fixtures: the whole point is that clicking a booking reaches a real pilgrim and a real invoice.
- [x] **A5. Domain types** — `packages/types/src/operations.ts`. in `@manasik/types`: `Package`, `Booking`, `Invoice`, `Payment`, `Document`, `Group`, `Guide`, `Activity`. `Pilgrim` already has a DB table (V4) — mirror it so the eventual wiring is a swap, not a rewrite.
- [x] **A6. Shared page primitives** — plus `DetailField`/`DetailFieldGrid` and `DataTable`.: `PageHeader`, `StatCard`, `StatusBadge`, `EmptyState`, `DetailTabs`. Every page uses them; building them per-page guarantees drift.
- [x] **A7. Strings module** — `src/lib/strings/`, typed dot-path keys, `statusLabel`/`enumLabel` for SCREAMING_SNAKE enums. Spec forbids hardcoded UI copy. Full `next-intl` is heavier than this stage needs — start with a typed `en` messages object behind a `t()` helper so the call sites are already correct when next-intl lands.
- [x] **A8. Money + date helpers** — `lib/money.ts`, `lib/dates.ts`. **USD default** (changed from KES: Hajj/Umrah are quoted and settled in dollars), configurable. `balance_due` is **always** computed, never stored or typed (spec rule 5–6).

---

## Phase B — Pages (~75%)

Spec order. Each is only done when its detail view and cross-links work — a list alone is half a page.

| # | Page | Share of B | Status | Built as |
|---|---|---|---|---|
| 1 | **Packages** | 8% | ✅ | List + detail (`?tab=` overview/bookings) + create/edit dialog. |
| 2 | **Pilgrims** | 12% | ✅ | List + 4-tab profile (overview / bookings / documents / payments) + sectioned form. Medical and access needs sit above the tabs, not inside one. |
| 3 | **Bookings** | 14% | ✅ | List + detail with blockers panel, payment progress and inline payment history. Creating a booking creates its invoice in the same call. |
| 4 | **Payments** | 14% | ✅ | Invoices / payments as two tabs — they answer opposite questions. All four statuses derived. |
| 5 | **Groups** | 12% | ✅ | Cards, not a table. Detail has members / logistics / readiness, plus an assign dialog restricted to same-package unassigned bookings. |
| 6 | **Documents** | 8% | ✅ | A per-pilgrim **matrix** rather than a document list: the question is "who is missing what". Rows expand to the shared checklist. |
| 7 | **Dashboard** | 12% | ✅ | Ordered by urgency, not by entity. Every card links to its filtered page. |
| 8 | **Settings** | 8% | ✅ | Organisation form (local-only, labelled as such) + read-only members and billing from the real session. |
| — | Responsive + mobile table pattern | 12% | ✅ | Every table scrolls inside its own container; toolbars, stat grids and page headers stack at `sm`. |

**Deviations from the spec, deliberate:**

- Pilgrim profile has 4 tabs, not 6. The spec's "notes" and "activity" tabs have no data source that is not already on the page.
- Group detail has 3 tabs, not 7. Hotels / transport / flights are free-text notes in the MVP — there is no inventory to tab between, and four near-empty tabs read as unfinished.
- Documents is a matrix, not a filtered list. A list answers "what documents exist", which nobody asks.

### Rules that apply to every page

1. **Never render a typed balance.** `balance_due = invoice_total - sum(payments)`, computed at the call site.
2. **Status is derived, not stored** — Unpaid / Partially paid / Paid / Overdue follow from totals and due date.
3. **Every table row links somewhere.** A dead-end row is a bug.
4. **Every dashboard card links to its filtered page.**
5. **Mobile:** stacked cards or deliberate horizontal scroll. Never a squashed table.
6. **No empty-state-only screens** — realistic mock data throughout, so the workflow is visible.

---

## Phase C — Wiring to the backend (~10%, later)

Deliberately last. Doing it per-page as we go would mean designing seven APIs against a UI that is still moving.

- [ ] Migrations for packages, bookings, invoices, payments, groups, documents — each **must** carry `organization_id` + `ENABLE`/`FORCE` RLS + a tenant policy **in the same migration** (see `V4__pilgrims.sql`).
- [ ] Entities with `@TenantId`, repositories, services, controllers.
- [ ] Swap the mock layer for real fetches. If A4 is done properly this is a change of import, not of components.

---

## Known traps, recorded so they are not rediscovered

- **`pnpm typecheck` passing does not mean the app builds.** Type-only imports are erased before the bundler runs; a runtime import from a workspace package needs `transpilePackages`.
- **`TenantAwareDataSource` stamps the tenant at connection acquisition.** Any operation that creates a tenant and then writes to it needs two transactions (see `OrganizationService.createWorkspace`).
- **`open-in-view` is false.** A lazy association read outside a transaction throws — use `@EntityGraph`.
- **`organizations.plan` is denormalized** from `subscriptions.plan`. Update both together.
