# Code Conventions and Standards

These conventions keep the Lenzro codebase consistent, readable, and maintainable. All new code should follow these guidelines. When in doubt, look at existing code for precedent.

---

## Table of Contents

- [TypeScript](#typescript)
- [File and Folder Naming](#file-and-folder-naming)
- [Imports](#imports)
- [React and Next.js](#react-and-nextjs)
- [NestJS API](#nestjs-api)
- [Shared Packages](#shared-packages)
- [CSS and Tailwind](#css-and-tailwind)
- [Git Workflow](#git-workflow)
- [Commit Messages](#commit-messages)
- [Code Reviews](#code-reviews)

---

## TypeScript

### General rules

- **Strict mode is on.** Never use `@ts-ignore` — fix the type error or use `@ts-expect-error` with a comment.
- Prefer `type` over `interface` for DTOs and plain data shapes. Use `interface` for class contracts and when declaration merging is needed.
- Use `type`-only imports for types consumed from other packages:
  ```typescript
  import type { Page } from '@lenzro/types';
  ```
- Do not use `any`. Use `unknown` for genuinely unknown data and narrow it down before use.
- Use `as const` for literal tuples and enum-like objects:
  ```typescript
  const VIEWS = ['table', 'kanban', 'calendar'] as const;
  type View = typeof VIEWS[number];
  ```

### Naming

| Construct           | Convention       | Example                          |
|--------------------|------------------|----------------------------------|
| Variable / function | `camelCase`      | `fetchPages`, `currentUser`      |
| Class / Component  | `PascalCase`     | `PageEditor`, `WorkspaceService` |
| Interface / Type   | `PascalCase`     | `CreatePageInput`, `BlockDoc`    |
| Enum (value export)| `SCREAMING_SNAKE`| `Role.OWNER`, `Plan.FREE`        |
| Constant           | `SCREAMING_SNAKE`| `MAX_PAGE_TITLE_LENGTH = 256`    |
| Private class field| `_camelCase`     | `_prismaClient`                  |

### Null vs undefined

- Prefer `null` for intentionally absent values stored in the database (aligns with Prisma).
- Use `undefined` for optional function parameters and partial update inputs.
- Never return `null | undefined` from the same function — pick one.

---

## File and Folder Naming

| Item                  | Convention        | Example                                   |
|----------------------|-------------------|-------------------------------------------|
| React component file  | `PascalCase.tsx`  | `PageEditor.tsx`, `WorkspaceSidebar.tsx`  |
| Hook file             | `use*.ts`         | `useRealtimePage.ts`, `useWorkspace.ts`   |
| Utility / helper      | `kebab-case.ts`   | `date.ts`, `string.ts`                    |
| NestJS module folder  | `kebab-case/`     | `pages/`, `workspace-members/`            |
| NestJS service        | `*.service.ts`    | `pages.service.ts`                        |
| NestJS controller     | `*.controller.ts` | `pages.controller.ts`                     |
| Schema file           | `*.schema.ts`     | `page.schema.ts`                          |
| Test file             | `*.spec.ts`       | `pages.service.spec.ts`                   |
| E2E test file         | `*.e2e-spec.ts`   | `auth.e2e-spec.ts`                        |

### Folder structure in `apps/web/src/`

```
src/
├── app/                  Next.js App Router pages and layouts
│   ├── (auth)/           Route group — login, register, forgot-password
│   └── (workspace)/      Route group — workspace UI
│       └── [slug]/
│           └── [pageId]/
├── components/
│   ├── ui/               Primitive UI components (Button, Input, Modal, etc.)
│   ├── editor/           TipTap editor and block components
│   ├── sidebar/          Workspace navigation sidebar
│   └── widgets/          Widget renderers and marketplace browser
├── hooks/                Custom React hooks
├── lib/                  Third-party client setup (socket, queryClient, etc.)
├── stores/               Zustand stores
└── styles/               Global CSS
```

---

## Imports

### Order (enforced by ESLint)

1. External packages (`react`, `next/...`, `@nestjs/...`)
2. Internal monorepo packages (`@lenzro/types`, `@lenzro/utils`)
3. Absolute imports from `@/` alias (`@/components/...`, `@/hooks/...`)
4. Relative imports (`./`, `../`)

Separate each group with a blank line. Example:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@nestjs/prisma';

import type { CreatePageInput } from '@lenzro/types';
import { slugify } from '@lenzro/utils';

import { WorkspaceGuard } from '@/guards/workspace.guard';

import type { PageResponse } from './pages.dto';
```

### Barrel files

Each package and module exposes a public API via its `index.ts`. Do not import from internal files of another package:

```typescript
// ✅ correct
import { slugify } from '@lenzro/utils';

// ❌ wrong — reaches into package internals
import { slugify } from '@lenzro/utils/src/string';
```

---

## React and Next.js

### Components

- Use **function components** exclusively — no class components.
- Define component props as a local `type Props = { ... }`.
- Co-locate component-specific hooks and helpers in the same file if small; split into separate files when they grow beyond ~50 lines.
- Avoid default-exporting anonymous components:
  ```typescript
  // ✅
  export function PageEditor({ page }: Props) { ... }
  
  // ❌
  export default ({ page }: Props) => { ... }
  ```

### State management

- Local state: `useState`, `useReducer`
- Cross-component state: **Zustand** stores in `src/stores/`
- Server state / data fetching: **TanStack Query** (`useQuery`, `useMutation`)
- Do not use React Context for frequently changing values (e.g. realtime cursor positions) — use a Zustand store instead.

### Data fetching (Next.js App Router)

- **Server Components** by default — mark as `'use client'` only when you need interactivity.
- Fetch data directly in Server Components with `async/await`.
- Use **Route Handlers** (`app/api/...`) only for browser-initiated mutations. Prefer calling the NestJS API directly from Server Components using `fetch`.

---

## NestJS API

### Module structure

Each feature module lives in its own folder with this structure:

```
pages/
├── pages.module.ts
├── pages.controller.ts
├── pages.service.ts
├── pages.dto.ts          ← request/response shapes (separate from @lenzro/types)
├── pages.guard.ts        ← module-specific guards (optional)
└── pages.service.spec.ts
```

### Validation

- Use the global `ValidationPipe` with `transform: true, whitelist: true`.
- DTOs use `class-validator` decorators. Map from `@lenzro/validations` Zod schemas where possible to avoid duplication.
- Return **422 Unprocessable Entity** (not 400) for validation failures — NestJS does this by default with `ValidationPipe`.

### Error handling

- Throw NestJS built-in exceptions: `NotFoundException`, `ForbiddenException`, `ConflictException`, etc.
- Never expose raw Prisma errors — catch `PrismaClientKnownRequestError` and map to HTTP exceptions.
- A global exception filter catches unhandled errors and returns a consistent `{ statusCode, message }` shape.

---

## Shared Packages

### `@lenzro/types`

- Contains only TypeScript **types and interfaces** — no runtime code except `ROLE_PERMISSIONS` and `hasPermission()`.
- No external dependencies.
- All imports from this package must use `import type`.

### `@lenzro/validations`

- Contains only **Zod schemas** and their inferred types.
- Only dependency is `zod`.

### `@lenzro/utils`

- Pure functions — no side effects, no external dependencies.
- Every exported function must be unit-tested.

### `@lenzro/database`

- The only place that imports `@prisma/client`.
- Exports the singleton `prisma` client and Prisma-generated types.
- Never import the Prisma client directly in `apps/` — always go through `@lenzro/database`.

---

## CSS and Tailwind

- Use **Tailwind utility classes** directly in JSX. Avoid writing custom CSS unless unavoidable.
- Order classes: layout → spacing → sizing → typography → colors → borders → effects → responsive → dark mode. Use the `prettier-plugin-tailwindcss` plugin to auto-sort.
- Extract repeated class combinations into a component, not a `@apply` rule.
- CSS variables for design tokens are defined in `packages/config/tailwind/base.config.ts` and set in `globals.css`. Reference them as `text-brand-500`, `bg-surface`, etc.
- Dark mode uses the `class` strategy — the `dark` class is applied to `<html>`.

---

## Git Workflow

### Branches

| Branch pattern     | Purpose                                    |
|-------------------|--------------------------------------------|
| `main`             | Production-ready code                      |
| `develop`          | Integration branch (optional)             |
| `feat/<name>`      | New features                               |
| `fix/<name>`       | Bug fixes                                  |
| `chore/<name>`     | Tooling, deps, config changes              |
| `docs/<name>`      | Documentation only                         |
| `refactor/<name>`  | Code restructuring without behavior change |

### Pull Requests

- All changes go through a PR — no direct pushes to `main`.
- PRs must pass CI (lint, type-check, tests, build).
- Require at least one review approval before merging.
- Squash-merge to `main` to keep history clean.
- Delete the source branch after merge.

---

## Commit Messages

Use **Conventional Commits** format:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer: BREAKING CHANGE, Closes #123]
```

**Types:**

| Type       | When to use                                     |
|-----------|-------------------------------------------------|
| `feat`     | A new feature                                   |
| `fix`      | A bug fix                                       |
| `docs`     | Documentation changes only                     |
| `style`    | Formatting, whitespace (no logic change)        |
| `refactor` | Code change that neither fixes nor adds a feature |
| `test`     | Adding or fixing tests                          |
| `chore`    | Build system, CI, dependency updates            |
| `perf`     | Performance improvement                         |
| `revert`   | Revert a previous commit                        |

**Scopes** (optional, use the affected package or app):

```
feat(pages): add move page endpoint
fix(auth): handle expired refresh token gracefully
chore(deps): upgrade prisma to 5.12.0
docs(api): add openapi spec skeleton
```

---

## Code Reviews

### As an author

- Keep PRs focused — one logical change per PR.
- Write a clear PR description explaining _why_, not just _what_.
- Add screenshots for UI changes.
- Respond to all comments before requesting re-review.

### As a reviewer

- Approve if the code is correct, even if you'd have done it differently.
- Distinguish between blocking issues (`[blocking]`) and suggestions (`[nit]`, `[suggestion]`).
- Check: correctness, security, performance implications, test coverage, and adherence to these conventions.
