# Testing Guidelines

Lenzro follows a **testing pyramid** approach: many unit tests, fewer integration tests, and a small suite of critical E2E tests.

---

## Table of Contents

- [Overview](#overview)
- [Test Stack](#test-stack)
- [Running Tests](#running-tests)
- [Unit Tests](#unit-tests)
  - [Utility Functions](#utility-functions)
  - [Validation Schemas](#validation-schemas)
  - [React Components](#react-components)
  - [NestJS Services](#nestjs-services)
- [Integration Tests](#integration-tests)
  - [API Endpoints](#api-endpoints)
  - [Database](#database)
- [End-to-End Tests](#end-to-end-tests)
- [Test Data and Factories](#test-data-and-factories)
- [Coverage](#coverage)
- [CI Integration](#ci-integration)

---

## Overview

```
                 ┌─────────────────────┐
                 │    E2E Tests        │  ← Few, slow, high confidence
                 │  (Playwright)       │     Critical user flows only
                 └────────┬────────────┘
              ┌───────────▼────────────────┐
              │   Integration Tests        │  ← API endpoints + DB queries
              │   (Jest + Supertest)        │     Each module's contract
              └──────────┬─────────────────┘
        ┌─────────────────▼────────────────────────┐
        │              Unit Tests                  │  ← Many, fast, isolated
        │  (Jest / Vitest + Testing Library)        │     Functions, components
        └──────────────────────────────────────────┘
```

---

## Test Stack

| Layer        | Framework           | Use case                                          |
|-------------|---------------------|---------------------------------------------------|
| Unit         | **Vitest**          | `@lenzro/utils`, `@lenzro/validations`, React components |
| Unit (API)   | **Jest**            | NestJS services and controllers                   |
| Integration  | **Jest + Supertest**| NestJS API endpoints with real database (Neon branch) |
| E2E          | **Playwright**      | Critical user flows in the browser               |

---

## Running Tests

```bash
# Run all tests across all packages
npm test

# Run tests for a specific package/app
npx turbo run test --filter=@lenzro/utils
npx turbo run test --filter=api
npx turbo run test --filter=web

# Watch mode (single package)
cd packages/utils
npx vitest --watch

# Coverage report
npm run test:coverage

# E2E tests (requires running apps)
npm run test:e2e
```

---

## Unit Tests

### Utility Functions

All functions in `@lenzro/utils` must have unit tests. Tests live adjacent to the source:

```
packages/utils/src/
├── date.ts
├── date.test.ts     ← co-located test file
├── string.ts
├── string.test.ts
└── validation.ts
    validation.test.ts
```

**Example:**

```typescript
// packages/utils/src/string.test.ts
import { describe, it, expect } from 'vitest';
import { slugify, truncate, initials } from './string';

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips accented characters', () => {
    expect(slugify('Café au lait')).toBe('cafe-au-lait');
  });

  it('removes consecutive hyphens', () => {
    expect(slugify('foo  --  bar')).toBe('foo-bar');
  });
});

describe('truncate', () => {
  it('does not truncate strings shorter than maxLength', () => {
    expect(truncate('short', 20)).toBe('short');
  });

  it('truncates and appends ellipsis', () => {
    expect(truncate('long string here', 10)).toBe('long strin…');
  });
});
```

### Validation Schemas

Test each Zod schema for valid and invalid inputs:

```typescript
// packages/validations/src/auth.schema.test.ts
import { describe, it, expect } from 'vitest';
import { registerSchema } from './auth.schema';

describe('registerSchema', () => {
  const valid = { name: 'Alice', email: 'alice@example.com', password: 'Secure@123' };

  it('accepts valid input', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects weak password', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'weak' });
    expect(result.success).toBe(false);
  });

  it('normalises email to lowercase', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'ALICE@EXAMPLE.COM' });
    expect(result.success && result.data.email).toBe('alice@example.com');
  });
});
```

### React Components

Use **Vitest** + **React Testing Library** for component tests. Focus on behaviour, not implementation:

```typescript
// apps/web/src/components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when loading', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

**Guidelines:**
- Query by role (`getByRole`) or label (`getByLabelText`) — not by test IDs unless unavoidable.
- Never test that a component calls a specific function with specific args — test the visible outcome instead.
- Use `userEvent` (from `@testing-library/user-event`) for user interactions rather than `fireEvent` when possible.

### NestJS Services

Mock all dependencies (Prisma, other services) using Jest's manual mocks:

```typescript
// apps/api/src/pages/pages.service.spec.ts
import { Test } from '@nestjs/testing';
import { PagesService } from './pages.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PagesService', () => {
  let service: PagesService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PagesService,
        {
          provide: PrismaService,
          useValue: {
            page: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(PagesService);
    prisma = module.get(PrismaService);
  });

  describe('findById', () => {
    it('throws NotFoundException when page does not exist', async () => {
      prisma.page.findUnique.mockResolvedValue(null);
      await expect(service.findById('nonexistent-id', 'user-id'))
        .rejects.toThrow('Page not found');
    });
  });
});
```

---

## Integration Tests

### API Endpoints

Integration tests spin up the full NestJS application and make real HTTP requests against a **Neon test branch**:

```typescript
// apps/api/src/pages/pages.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, createTestUser, createTestWorkspace } from '../test/helpers';

describe('Pages API', () => {
  let app: INestApplication;
  let accessToken: string;
  let workspaceId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const { token, workspace } = await createTestUser(app);
    accessToken = token;
    workspaceId = workspace.id;
  });

  afterAll(() => app.close());

  describe('POST /workspaces/:id/pages', () => {
    it('creates a page', async () => {
      const res = await request(app.getHttpServer())
        .post(`/workspaces/${workspaceId}/pages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'My Page' })
        .expect(201);

      expect(res.body).toMatchObject({
        title: 'My Page',
        workspaceId,
        isArchived: false,
      });
    });

    it('returns 401 without auth token', () => {
      return request(app.getHttpServer())
        .post(`/workspaces/${workspaceId}/pages`)
        .send({ title: 'My Page' })
        .expect(401);
    });
  });
});
```

**Test database setup:**

- Use a dedicated Neon **branch** for integration tests (create via `neon branches create --name test`).
- Set `TEST_DATABASE_URL` in CI environment.
- Reset the database before the test suite: run `prisma migrate reset --force`.
- Never run integration tests against the production database.

### Database

Test complex Prisma queries in isolation:

```typescript
// packages/database/src/queries/pages.test.ts
import { prisma } from '../client';
import { buildPageTree } from './pages';

// Uses TEST_DATABASE_URL automatically in test environment
describe('buildPageTree', () => {
  it('returns nested page structure', async () => {
    // arrange: create pages with parent/child relationships
    // act: call the query
    // assert: validate the tree shape
  });
});
```

---

## End-to-End Tests

E2E tests use **Playwright** and run against the full application (web + API). Keep the suite small and focused on critical paths.

### Critical flows to test

1. **Auth:** Register → verify email → login → logout
2. **Workspace:** Create workspace → invite member → accept invite
3. **Pages:** Create page → add content → share page publicly
4. **Realtime:** Two users editing the same page — changes visible to both
5. **Database widget:** Create inline database → add records → switch views

### Example

```typescript
// apps/web/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can register and login', async ({ page }) => {
  await page.goto('/register');

  await page.getByLabel('Name').fill('Alice Nguyen');
  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByLabel('Password').fill('Secure@123');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/workspace/);
  await expect(page.getByText('Alice Nguyen')).toBeVisible();
});
```

---

## Test Data and Factories

Use factory functions to create test data — never hardcode IDs:

```typescript
// apps/api/src/test/factories.ts
import { prisma } from '@lenzro/database';

export async function createUser(overrides = {}) {
  return prisma.user.create({
    data: {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      ...overrides,
    },
  });
}

export async function createWorkspace(ownerId: string, overrides = {}) {
  return prisma.workspace.create({
    data: {
      name: 'Test Workspace',
      slug: `test-workspace-${Date.now()}`,
      ownerId,
      ...overrides,
    },
  });
}
```

---

## Coverage

Coverage targets (enforced in CI):

| Layer                | Target   |
|---------------------|----------|
| `@lenzro/utils`      | ≥ 90%    |
| `@lenzro/validations`| ≥ 90%    |
| NestJS services      | ≥ 75%    |
| NestJS controllers   | ≥ 60%    |
| React components     | ≥ 60%    |

Generate a coverage report:

```bash
npm run test:coverage
# Opens coverage/lcov-report/index.html
```

---

## CI Integration

The `.github/workflows/ci.yml` runs tests in three parallel shards:

```yaml
strategy:
  matrix:
    shard: [1, 2, 3]

steps:
  - run: npm test -- --shard=${{ matrix.shard }}/3
```

Integration tests run only on the `main` branch and PRs targeting `main` (not on feature branches) to save CI time.

E2E tests run on a schedule (nightly) and on release PRs.
