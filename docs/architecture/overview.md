# System Architecture Overview

Lenzro is a business productivity platform for teams — similar in spirit to Notion and ClickUp, but built around the concept of **interconnected pages** that can model any business process. Every page can contain any combination of **widgets** (rich content blocks), and pages can reference, embed, or link to other pages across a workspace.

---

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Monorepo Structure](#monorepo-structure)
- [Core Concepts](#core-concepts)
- [Tech Stack](#tech-stack)
- [Data Flow](#data-flow)
- [Service Boundaries](#service-boundaries)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              apps/web  (Next.js 14 App Router)             │ │
│  │                                                            │ │
│  │  Page Editor  │  Widget Engine  │  Sidebar  │  Realtime   │ │
│  └───────────────────────────┬────────────────────────────────┘ │
└──────────────────────────────│──────────────────────────────────┘
                               │  REST + WebSocket
┌──────────────────────────────▼──────────────────────────────────┐
│                          API Layer                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               apps/api  (NestJS)                           │ │
│  │                                                            │ │
│  │  Auth  │  Workspaces  │  Pages  │  Widgets  │  Realtime  │ │
│  └───────────────────────────┬────────────────────────────────┘ │
└──────────────────────────────│──────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────▼───────┐   ┌─────────▼──────┐   ┌─────────▼──────────┐
│  Neon Postgres │   │  Redis (cache  │   │  Object Storage     │
│  (Prisma ORM)  │   │  + pub/sub)    │   │  (S3 / R2)          │
└────────────────┘   └────────────────┘   └────────────────────┘
```

---

## Monorepo Structure

```
lenzro/
├── apps/
│   ├── web/             Next.js 14 — user-facing application
│   └── api/             NestJS — REST API + WebSocket gateway
│
├── packages/
│   ├── types/           @lenzro/types       — shared TypeScript types & interfaces
│   ├── validations/     @lenzro/validations — Zod schemas for all DTOs
│   ├── utils/           @lenzro/utils       — date, string, validation helpers
│   ├── config/          @lenzro/config      — shared ESLint, TS, Tailwind configs
│   └── database/        @lenzro/database    — Prisma client, schema, migrations, seed
│
├── services/            (future) isolated microservices (notifications, search, AI)
│
├── docs/                architecture, API, deployment, and development docs
│
└── .github/             CI/CD workflows and issue / PR templates
```

---

## Core Concepts

### Workspaces
A **workspace** is the top-level container for a business or team. It has a unique `slug`, a subscription `plan` (FREE → ENTERPRISE), and one or more **members** with roles (`OWNER`, `ADMIN`, `MEMBER`, `GUEST`).

### Pages
A **page** is the fundamental unit of content in Lenzro. Pages:
- Belong to exactly one workspace.
- Can be **nested** inside other pages (tree hierarchy).
- Can be **linked** to any other page within the same workspace.
- Store content as a structured **block document** (see Widgets).
- Can be marked public for external sharing via a unique URL.
- Support full change history and comments/threads.

### Widgets
Widgets are the content blocks that live inside a page. They are stored as a typed JSON block document (TipTap-compatible). Widget categories:

| Category       | Examples                                                              |
|---------------|-----------------------------------------------------------------------|
| **Text**       | Paragraph, Heading (H1–H6), Bullet list, Ordered list, Blockquote, Code block |
| **Media**      | Image, Video, Audio, File attachment                                 |
| **Data**       | Inline database, Table, Kanban board, Calendar, Timeline, Gallery   |
| **Relational** | Page link, Page embed, Backlinks view, Mention                      |
| **Structure**  | Divider, Columns, Callout, Toggle/Accordion, Table of contents      |
| **Marketplace** | Charts, Maps, Weather, Form embed, Figma, GitHub, Jira, and more  |

### Widget Marketplace
Third-party and first-party widgets are distributed through the **Lenzro Marketplace**. Marketplace widgets are versioned packages that expose a standard widget API surface:
- `WidgetConfig` — schema for user-configurable settings
- `WidgetRenderer` — React component for rendering
- `WidgetEditor` — React component for the settings panel
- Sandboxed execution for untrusted code (iframe + postMessage)

### Databases (Inline & Linked)
Any page can have an attached **database** — a structured set of records with typed properties (text, number, date, select, relation, formula, rollup). Databases can be viewed as:
- Table
- Kanban
- Calendar
- Timeline / Gantt
- Gallery

---

## Tech Stack

| Layer          | Technology                                         |
|---------------|-----------------------------------------------------|
| Web app        | Next.js 14 (App Router), React 18, Tailwind CSS    |
| Block editor   | TipTap 2 (ProseMirror-based)                       |
| API server     | NestJS (TypeScript, Express adapter)               |
| ORM            | Prisma 5                                           |
| Database       | Neon PostgreSQL (serverless)                       |
| Cache / PubSub | Redis (Upstash or self-hosted)                     |
| Realtime       | WebSockets (Socket.IO via NestJS gateway)          |
| Auth           | JWT (access + refresh tokens)                      |
| File storage   | S3-compatible (AWS S3, Cloudflare R2)              |
| Monorepo       | npm workspaces + Turborepo                         |
| CI/CD          | GitHub Actions                                     |
| Deployments    | Vercel (web), Railway / AWS (API)                  |

---

## Data Flow

### Page Load
```
Browser → GET /workspaces/:slug/pages/:pageId
        ← { page, content: BlockDoc, children[] }
        
Widget Engine renders BlockDoc nodes as React components.
Realtime socket joins room "page:{pageId}" for live updates.
```

### Page Edit (Collaborative)
```
User types → TipTap emits transaction
           → OT/CRDT diff computed
           → PATCH /pages/:id (debounced, full save)
           → WebSocket broadcast to room (live cursors + incremental)
           → Other clients apply diff
```

### Widget Data (Inline Database)
```
Widget renders → GET /widgets/:widgetId/data?view=table&sort=...&filter=...
              ← { rows[], schema, totalCount }
```

---

## Service Boundaries

| Service          | Responsibility                                                   |
|-----------------|------------------------------------------------------------------|
| `AuthModule`     | Registration, login, token lifecycle, OAuth providers           |
| `WorkspaceModule`| CRUD, member management, plan/billing hooks                     |
| `PagesModule`    | Page tree, CRUD, move, archive, publish, history                |
| `WidgetsModule`  | Block CRUD, inline databases, widget data queries               |
| `CommentsModule` | Comment threads, mentions, resolution                           |
| `RealtimeModule` | WebSocket gateway, presence, live cursors, OT broadcast         |
| `FilesModule`    | Upload, storage, URL signing                                    |
| `SearchModule`   | Full-text search across pages and widget content                |
| `MarketplaceModule` | Widget registry, install/uninstall, versioning              |
