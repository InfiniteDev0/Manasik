# Database Schema

Lenzro uses **Neon PostgreSQL** via **Prisma ORM**. All migrations live in `packages/database/prisma/migrations/`. The schema is designed for a multi-tenant business productivity platform with nested pages, a widget/block document model, and role-based access control.

---

## Table of Contents

- [Connection Setup](#connection-setup)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Tables](#tables)
  - [users](#users)
  - [workspaces](#workspaces)
  - [workspace\_members](#workspace_members)
  - [pages](#pages)
  - [widgets](#widgets)
  - [databases](#databases)
  - [database\_records](#database_records)
  - [comments](#comments)
- [Enums](#enums)
- [Indexes](#indexes)
- [Conventions](#conventions)

---

## Connection Setup

Lenzro uses **two** connection strings with Neon's built-in connection pooler (PgBouncer):

| Variable       | Purpose                                      | Use case                     |
|---------------|----------------------------------------------|------------------------------|
| `DATABASE_URL` | Pooled connection via `-pooler.neon.tech`   | App runtime queries           |
| `DIRECT_URL`   | Direct non-pooled connection                | Prisma migrations             |

```env
DATABASE_URL="postgresql://<user>:<pass>@<host>-pooler.neon.tech/<db>?sslmode=require"
DIRECT_URL="postgresql://<user>:<pass>@<host>.neon.tech/<db>?sslmode=require"
```

Set both in `.env` (local) and in your deployment provider's environment variables.

---

## Entity Relationship Diagram

```
users
 ├─< workspaces (owner)
 ├─< workspace_members
 ├─< pages (author)
 ├─< comments (author)
 └─< database_records (created_by)

workspaces
 ├─< workspace_members >─ users
 ├─< pages
 └─< databases (linked to a page)

pages
 ├─ parent (self-ref, nullable)
 ├─< pages (children)
 ├─< comments
 └─< widgets (stored as BlockDoc JSON, not separate rows)

databases
 ├─< database_records
 └─ page (the page that owns/embeds this database)

comments
 └─ parent (self-ref, nullable thread)
```

---

## Tables

### `users`

Stores all registered users across every workspace.

| Column       | Type        | Notes                          |
|-------------|-------------|--------------------------------|
| `id`         | `CUID`      | Primary key                    |
| `email`      | `TEXT`      | Unique, case-insensitive index |
| `name`       | `TEXT`      | Display name                   |
| `avatar`     | `TEXT?`     | URL to profile image           |
| `password_hash` | `TEXT?` | Null for OAuth-only users      |
| `created_at` | `TIMESTAMPTZ` | Auto-set on insert           |
| `updated_at` | `TIMESTAMPTZ` | Auto-updated                 |

---

### `workspaces`

A workspace is the top-level container for a business or team.

| Column       | Type        | Notes                                     |
|-------------|-------------|-------------------------------------------|
| `id`         | `CUID`      | Primary key                               |
| `name`       | `TEXT`      | Display name                              |
| `slug`       | `TEXT`      | Unique URL-safe identifier (`@lenzro/utils` slugify) |
| `icon`       | `TEXT?`     | Emoji or URL                              |
| `plan`       | `Plan`      | Subscription tier (enum)                  |
| `owner_id`   | `TEXT`      | FK → `users.id` ON DELETE CASCADE         |
| `created_at` | `TIMESTAMPTZ` |                                         |
| `updated_at` | `TIMESTAMPTZ` |                                         |

---

### `workspace_members`

Junction table linking users to workspaces with a role.

| Column         | Type        | Notes                               |
|---------------|-------------|-------------------------------------|
| `id`           | `CUID`      | Primary key                         |
| `workspace_id` | `TEXT`      | FK → `workspaces.id` ON DELETE CASCADE |
| `user_id`      | `TEXT`      | FK → `users.id` ON DELETE CASCADE   |
| `role`         | `Role`      | Enum: OWNER, ADMIN, MEMBER, GUEST   |
| `joined_at`    | `TIMESTAMPTZ` | Auto-set on insert                |

**Unique constraint:** `(workspace_id, user_id)`

---

### `pages`

The core content unit. Every page belongs to a workspace and optionally a parent page.

| Column         | Type        | Notes                                              |
|---------------|-------------|----------------------------------------------------|
| `id`           | `CUID`      | Primary key                                        |
| `title`        | `TEXT`      | Default: `"Untitled"`                              |
| `icon`         | `TEXT?`     | Emoji or image URL                                 |
| `cover_image`  | `TEXT?`     | Banner image URL                                   |
| `content`      | `JSONB?`    | TipTap `BlockDoc` — all widgets stored here        |
| `is_public`    | `BOOL`      | Enables public share link (default: false)         |
| `is_favorite`  | `BOOL`      | Pinned to sidebar (per-user via separate table in future) |
| `is_archived`  | `BOOL`      | Soft delete (default: false)                       |
| `position`     | `INT`       | Ordering within parent (default: 0)                |
| `parent_id`    | `TEXT?`     | Self-referential FK (SET NULL on parent delete)    |
| `workspace_id` | `TEXT`      | FK → `workspaces.id` ON DELETE CASCADE             |
| `author_id`    | `TEXT`      | FK → `users.id` ON DELETE CASCADE                  |
| `created_at`   | `TIMESTAMPTZ` |                                                  |
| `updated_at`   | `TIMESTAMPTZ` |                                                  |

**Indexes:** `workspace_id`, `author_id`, `parent_id`, `is_archived`, `(workspace_id, is_archived)`

> **Widget storage:** Core widgets (paragraphs, headings, images, etc.) are stored directly in the `content` JSONB column as a `BlockDoc`. Only widgets that need independent querying (inline databases, marketplace widgets with external data) have their own tables.

---

### `widgets`

Marketplace and standalone widgets that need server-side state beyond the page's `content` JSONB.

| Column         | Type        | Notes                                         |
|---------------|-------------|-----------------------------------------------|
| `id`           | `CUID`      | Primary key                                   |
| `type`         | `TEXT`      | Widget type identifier, e.g. `"map"`, `"chart"` |
| `config`       | `JSONB`     | User-configured settings (widget-specific)    |
| `page_id`      | `TEXT`      | FK → `pages.id` ON DELETE CASCADE             |
| `workspace_id` | `TEXT`      | FK → `workspaces.id` ON DELETE CASCADE        |
| `position`     | `INT`       | Position within page (mirrors BlockDoc node)  |
| `created_at`   | `TIMESTAMPTZ` |                                             |
| `updated_at`   | `TIMESTAMPTZ` |                                             |

---

### `databases`

A **Lenzro Database** is a structured collection of records with a typed property schema, linked to a page.

| Column         | Type        | Notes                                         |
|---------------|-------------|-----------------------------------------------|
| `id`           | `CUID`      | Primary key                                   |
| `name`         | `TEXT`      | Display name                                  |
| `schema`       | `JSONB`     | Property definitions (name, type, options)    |
| `default_view` | `TEXT`      | `"table"`, `"kanban"`, `"calendar"`, `"gallery"`, `"timeline"` |
| `page_id`      | `TEXT`      | FK → `pages.id` ON DELETE CASCADE (the page that owns this DB) |
| `workspace_id` | `TEXT`      | FK → `workspaces.id`                          |
| `created_at`   | `TIMESTAMPTZ` |                                             |
| `updated_at`   | `TIMESTAMPTZ` |                                             |

**Property types in `schema`:** `text`, `number`, `date`, `select`, `multi_select`, `checkbox`, `url`, `email`, `phone`, `relation`, `rollup`, `formula`, `person`, `file`

---

### `database_records`

Individual rows in a Lenzro Database.

| Column         | Type        | Notes                                         |
|---------------|-------------|-----------------------------------------------|
| `id`           | `CUID`      | Primary key                                   |
| `data`         | `JSONB`     | Property values keyed by property ID          |
| `position`     | `INT`       | Ordering (default: 0)                         |
| `database_id`  | `TEXT`      | FK → `databases.id` ON DELETE CASCADE         |
| `page_id`      | `TEXT?`     | FK → `pages.id` (if record opens as a page)   |
| `created_by`   | `TEXT`      | FK → `users.id`                               |
| `created_at`   | `TIMESTAMPTZ` |                                             |
| `updated_at`   | `TIMESTAMPTZ` |                                             |

---

### `comments`

Comments are threaded (one level of nesting) and attached to pages.

| Column       | Type        | Notes                                           |
|-------------|-------------|-------------------------------------------------|
| `id`         | `CUID`      | Primary key                                     |
| `content`    | `TEXT`      | Comment text (may include `@mentions`)          |
| `resolved`   | `BOOL`      | Thread resolved state (default: false)          |
| `page_id`    | `TEXT`      | FK → `pages.id` ON DELETE CASCADE               |
| `author_id`  | `TEXT`      | FK → `users.id` ON DELETE CASCADE               |
| `parent_id`  | `TEXT?`     | Self-referential FK (reply thread, SET NULL)    |
| `created_at` | `TIMESTAMPTZ` |                                               |
| `updated_at` | `TIMESTAMPTZ` |                                               |

**Indexes:** `page_id`, `author_id`, `parent_id`, `(page_id, resolved)`

---

## Enums

### `Role`
```
OWNER    — Full control, can delete workspace
ADMIN    — Manage members and all content
MEMBER   — Create and edit content
GUEST    — Read-only (or limited write via explicit page share)
```

### `Plan`
```
FREE        — Single workspace, limited pages & widgets
PRO         — Unlimited pages, advanced widgets, version history
TEAM        — All PRO + collaboration features, audit log
ENTERPRISE  — SSO, advanced permissions, SLA, dedicated support
```

---

## Indexes

| Table                | Index columns                       | Purpose                              |
|---------------------|-------------------------------------|--------------------------------------|
| `users`              | `email`                             | Unique login lookup                  |
| `workspaces`         | `slug`                              | Unique workspace URL                 |
| `workspace_members`  | `(workspace_id, user_id)`           | Unique membership + fast lookup      |
| `pages`              | `workspace_id`                      | List all workspace pages             |
| `pages`              | `author_id`                         | User's pages                         |
| `pages`              | `parent_id`                         | Load children of a page              |
| `pages`              | `is_archived`                       | Filter active vs archived            |
| `pages`              | `(workspace_id, is_archived)`       | Main sidebar query                   |
| `comments`           | `page_id`                           | Load page comments                   |
| `comments`           | `(page_id, resolved)`               | Unresolved comments count            |
| `database_records`   | `database_id`                       | Load all rows of a database          |

---

## Conventions

- All tables use **snake_case** column names, enforced via Prisma `@map()`.
- All IDs are **CUIDs** generated by Prisma (collision-resistant, URL-friendly).
- All timestamps are **`TIMESTAMPTZ`** (UTC stored, timezone-aware).
- Soft deletes use `is_archived = true`; hard deletes are reserved for GDPR erasure requests.
- JSONB columns (`content`, `config`, `schema`, `data`) are typed with TypeScript interfaces in `@lenzro/types`.
- All schema changes go through Prisma migrations (`npm run db:migrate`) — never alter tables manually in production.
