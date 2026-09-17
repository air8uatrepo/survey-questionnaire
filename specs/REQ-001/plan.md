# REQ-001 Demonstration Questionnaire Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public, demonstration-only questionnaire that persists four validated values and lets the one authenticated Business App Owner view and export those records as CSV.

**Architecture:** A Next.js App Router application exposes the public form and a server-side Route Handler. The handler validates all values with one shared parser before using a server-only Supabase client to insert them into an RLS-protected table. Admin pages and admin Route Handlers first verify the Supabase Auth user matches `BUSINESS_APP_OWNER_USER_ID`, then use that same server-only client to list or export records.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Supabase (`@supabase/supabase-js` and `@supabase/ssr`), Vitest, Playwright, Supabase CLI migrations.

**Spec:** `specs/REQ-001/spec.md`

## Global Constraints

- Use the confirmed run ID `DEMO-REQ-001-20260918-01`; every field value, fixture, seed, export assertion, browser label, log assertion, and test-account identifier begins with that prefix.
- The four public plain-text fields are exactly `nickname`, `organization`, `profession`, and `jobTitle`; all are required.
- A value is valid only when `value.trim().startsWith('DEMO-REQ-001-20260918-01')` is true; validate this in the browser, the server Route Handler, and the database.
- Never collect, persist, export, log, screenshot, or expose actual personal or business information. Do not include submitted values in error logs or HTTP error bodies.
- Public requests use only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `SUPABASE_SERVICE_ROLE_KEY` is server-only and is never placed in a `NEXT_PUBLIC_` variable, browser bundle, test report, or committed environment file.
- `BUSINESS_APP_OWNER_USER_ID` is the only authorized administrator. Missing, malformed, or nonmatching authentication returns the user to `/admin/login` or returns HTTP 401/403 from an admin Route Handler.
- Store the schema change as an additive Supabase migration. Enable RLS and create no anonymous/client read policy; all response reads and writes go through authenticated server code.
- Preserve the cumulative browser path: public submit → reload → owner login → submitted demo record visible → CSV downloaded and contains that record.
- Internal `plan.md`, `tasks.md`, test design, and technical records do not require a business response. Only a verified preview deployment may move the workflow to `WAITING_ON_PREVIEW`.

## File Structure

| Path | Responsibility |
| --- | --- |
| `package.json` | Reproducible application, test, lint, build, and browser-test commands with pinned dependencies and lockfile. |
| `app/layout.tsx`, `app/page.tsx`, `app/globals.css` | Root document, public questionnaire entry point, and Tailwind styling. |
| `app/api/responses/route.ts` | Server-only public submission endpoint; validates then persists without echoing raw values. |
| `app/admin/login/page.tsx`, `app/admin/login/login-form.tsx` | Owner sign-in page and client-side Supabase Auth form. |
| `app/admin/page.tsx` | Server-rendered owner-only response list. |
| `app/api/admin/responses/export/route.ts` | Owner-only CSV download endpoint. |
| `src/lib/questionnaire.ts` | Shared field names, request/response types, demo-prefix parser, and safe validation result. |
| `src/lib/responses.ts` | Server-side insert/list operations and deterministic CSV serialization. |
| `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/service.ts` | Separate publishable browser client, cookie-aware auth client, and server-only service-role client. |
| `supabase/migrations/` | Contains the CLI-generated `create_questionnaire_responses` additive migration with checks, RLS, and least-privilege grants. |
| `tests/questionnaire.test.ts`, `tests/responses.test.ts` | Unit coverage of parser and CSV format using real application functions. |
| `e2e/req-001-questionnaire.spec.ts`, `e2e/global-setup.ts` | One cumulative browser E2E path and a check that a privileged adapter has provisioned the configured synthetic owner. |
| `playwright.config.ts`, `vitest.config.ts`, `.env.example` | Test runner configuration and variable names without secret values. |

## Data and access design

Create table `public.questionnaire_responses` with `id uuid primary key default gen_random_uuid()`, four `text not null` response columns, and `created_at timestamptz not null default now()`. Add one `check` constraint per response column using the literal `DEMO-REQ-001-20260918-01%` prefix. Enable RLS. Do not grant response-table privileges to `anon` or `authenticated`; the public Route Handler and owner-only pages use the service client after application-level validation and authorization.

The service client is only imported by files running on the server (`import 'server-only'`). The owner page obtains the session user from the cookie-aware server client and compares `user.id` directly to `process.env.BUSINESS_APP_OWNER_USER_ID`; it never trusts client-submitted user IDs, email addresses, or metadata. The owner sign-in form performs Supabase password sign-in in the browser and redirects only to `/admin`.

`parseQuestionnaireSubmission(input)` returns either `{ ok: true, value: QuestionnaireSubmission }` or `{ ok: false, fieldErrors: Record<QuestionnaireField, string> }`. `insertResponse(submission)` returns a `QuestionnaireResponse` without logging it. `toResponsesCsv(rows)` returns UTF-8 CSV with header `id,nickname,organization,profession,jobTitle,createdAt`, RFC 4180 quote escaping, and CRLF line endings.

---

### Task 1: Bootstrap the application and the shared demo-data parser

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `app/layout.tsx`, `app/globals.css`, `src/lib/questionnaire.ts`, `tests/questionnaire.test.ts`, `.env.example`
- Modify: `.gitignore`

**Interfaces:**
- Produces `QUESTIONNAIRE_FIELDS`, `QuestionnaireField`, `QuestionnaireSubmission`, `QuestionnaireResponse`, `DEMO_PREFIX`, and `parseQuestionnaireSubmission(input: unknown)` from `src/lib/questionnaire.ts`.
- Consumed by the public form, `POST /api/responses`, repository code, and browser tests.

- [ ] **Step 1: Create the Next.js, Tailwind, Vitest, and Playwright project manifest**

Create `package.json` with scripts `dev`, `build`, `start`, `lint`, `test`, `test:watch`, and `test:e2e`. Pin `next@16`, `react@19`, `react-dom@19`, `@supabase/supabase-js`, `@supabase/ssr`, `typescript`, `vitest`, `@playwright/test`, `tailwindcss`, `@tailwindcss/postcss`, and their required type/lint packages. Generate and commit the lockfile from this manifest. Create `.env.example` containing only the names `NEXT_PUBLIC_SUPABASE_URL=`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=`, `SUPABASE_SERVICE_ROLE_KEY=`, and `BUSINESS_APP_OWNER_USER_ID=`; add `.env*` except `.env.example` to `.gitignore`.

- [ ] **Step 2: Write the failing parser tests**

Create `tests/questionnaire.test.ts` before `src/lib/questionnaire.ts` with these executable assertions:

```ts
import { describe, expect, it } from 'vitest';
import { DEMO_PREFIX, parseQuestionnaireSubmission } from '@/src/lib/questionnaire';

const valid = {
  nickname: `${DEMO_PREFIX}-nickname`,
  organization: `${DEMO_PREFIX}-organization`,
  profession: `${DEMO_PREFIX}-profession`,
  jobTitle: `${DEMO_PREFIX}-job-title`,
};

describe('parseQuestionnaireSubmission', () => {
  it('returns trimmed compliant values for all four fields', () => {
    expect(parseQuestionnaireSubmission({
      nickname: ` ${valid.nickname} `,
      organization: valid.organization,
      profession: valid.profession,
      jobTitle: valid.jobTitle,
    })).toEqual({ ok: true, value: valid });
  });

  it('reports every missing field without accepting a partial submission', () => {
    expect(parseQuestionnaireSubmission({})).toEqual({
      ok: false,
      fieldErrors: {
        nickname: 'Nickname is required.',
        organization: 'Organization is required.',
        profession: 'Profession is required.',
        jobTitle: 'Job title is required.',
      },
    });
  });

  it('rejects a required field that lacks the demo prefix', () => {
    expect(parseQuestionnaireSubmission({ ...valid, profession: 'doctor' })).toEqual({
      ok: false,
      fieldErrors: {
        nickname: '',
        organization: '',
        profession: `Profession must start with ${DEMO_PREFIX}.`,
        jobTitle: '',
      },
    });
  });
});
```

- [ ] **Step 3: Run the parser test and observe the expected red failure**

Run: `npm test -- tests/questionnaire.test.ts`

Expected: the command fails because module `@/src/lib/questionnaire` does not yet exist. Do not create production code until this missing-module failure is observed.

- [ ] **Step 4: Implement the minimal parser and project configuration**

Create `src/lib/questionnaire.ts` with `DEMO_PREFIX = 'DEMO-REQ-001-20260918-01'`, the four literal field names, and a parser that reads only string input, trims it, assigns the exact required/prefix errors asserted above, and returns a discriminated result. Configure `@/*` to repository root in `tsconfig.json`; configure Vitest to resolve the same alias. Create the App Router layout and global Tailwind import, but do not add response persistence in this task.

The exported type boundary must have this shape:

```ts
export const DEMO_PREFIX = 'DEMO-REQ-001-20260918-01' as const;
export const QUESTIONNAIRE_FIELDS = ['nickname', 'organization', 'profession', 'jobTitle'] as const;
export type QuestionnaireField = (typeof QUESTIONNAIRE_FIELDS)[number];
export type QuestionnaireSubmission = Record<QuestionnaireField, string>;
export type QuestionnaireResponse = QuestionnaireSubmission & {
  id: string;
  createdAt: string;
};
export type ParseResult =
  | { ok: true; value: QuestionnaireSubmission }
  | { ok: false; fieldErrors: Record<QuestionnaireField, string> };
```

- [ ] **Step 5: Run the parser test and project checks**

Run: `npm test -- tests/questionnaire.test.ts && npm run lint && npm run build`

Expected: all commands pass; the parser test proves valid, blank, and wrong-prefix handling.

- [ ] **Step 6: Commit the bootstrap and parser**

Run:

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs vitest.config.ts app/layout.tsx app/globals.css src/lib/questionnaire.ts tests/questionnaire.test.ts .env.example .gitignore
git commit -m "feat: bootstrap questionnaire validation"
```

### Task 2: Add an additive, RLS-protected response store and server-only repository

**Files:**
- Create: one CLI-generated migration in `supabase/migrations/`, `src/lib/supabase/service.ts`, `src/lib/responses.ts`, `tests/responses.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes `QuestionnaireSubmission` and `QuestionnaireResponse` from `src/lib/questionnaire.ts`.
- Produces `insertResponse(submission: QuestionnaireSubmission): Promise<QuestionnaireResponse>`, `listResponses(): Promise<QuestionnaireResponse[]>`, and `toResponsesCsv(rows: QuestionnaireResponse[]): string` from `src/lib/responses.ts`.
- Consumed by the public submission Route Handler, the admin page, and the admin CSV endpoint.

- [ ] **Step 1: Generate the migration shell and write the failing CSV test**

Use `supabase migration new create_questionnaire_responses` to create the migration filename; retain the generated timestamped filename. Before implementing `toResponsesCsv`, create `tests/responses.test.ts`:

```ts
import { expect, it } from 'vitest';
import { toResponsesCsv } from '@/src/lib/responses';

it('serializes a response using RFC 4180 quoting and only demo values', () => {
  expect(toResponsesCsv([{
    id: '00000000-0000-4000-8000-000000000001',
    nickname: 'DEMO-REQ-001-20260918-01-nickname',
    organization: 'DEMO-REQ-001-20260918-01-organization, unit',
    profession: 'DEMO-REQ-001-20260918-01-profession',
    jobTitle: 'DEMO-REQ-001-20260918-01-"job-title"',
    createdAt: '2026-09-18T00:00:00.000Z',
  }])).toBe(
    'id,nickname,organization,profession,jobTitle,createdAt\\r\\n' +
    '00000000-0000-4000-8000-000000000001,DEMO-REQ-001-20260918-01-nickname,"DEMO-REQ-001-20260918-01-organization, unit",DEMO-REQ-001-20260918-01-profession,"DEMO-REQ-001-20260918-01-""job-title""",2026-09-18T00:00:00.000Z\\r\\n',
  );
});
```

- [ ] **Step 2: Run the CSV test and observe the expected red failure**

Run: `npm test -- tests/responses.test.ts`

Expected: the command fails because `@/src/lib/responses` does not yet exist.

- [ ] **Step 3: Implement the schema, server-only client, repository, and CSV serializer**

Fill the generated migration with:

```sql
create table public.questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (nickname like 'DEMO-REQ-001-20260918-01%'),
  organization text not null check (organization like 'DEMO-REQ-001-20260918-01%'),
  profession text not null check (profession like 'DEMO-REQ-001-20260918-01%'),
  job_title text not null check (job_title like 'DEMO-REQ-001-20260918-01%'),
  created_at timestamptz not null default now()
);

alter table public.questionnaire_responses enable row level security;
revoke all on table public.questionnaire_responses from anon, authenticated;
```

In `src/lib/supabase/service.ts`, place `import 'server-only'` before creating `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })`. In `src/lib/responses.ts`, map `job_title`/`created_at` to the camel-case public type, throw a generic `Response persistence failed.` error after recording only an operation identifier, and implement the exact CSV escaping tested in Step 1. Add `supabase` CLI scripts only after consulting `supabase --help` and its subcommand help in the implementation turn.

The repository must expose these exact functions and must not accept values outside the validated type:

```ts
export async function insertResponse(
  submission: QuestionnaireSubmission,
): Promise<QuestionnaireResponse>;

export async function listResponses(): Promise<QuestionnaireResponse[]>;

export function toResponsesCsv(rows: QuestionnaireResponse[]): string {
  const quote = (value: string) =>
    /[\",\r\n]/.test(value) ? `\"${value.replaceAll('\"', '\"\"')}\"` : value;
  return [
    'id,nickname,organization,profession,jobTitle,createdAt',
    ...rows.map((row) => [row.id, row.nickname, row.organization, row.profession, row.jobTitle, row.createdAt].map(quote).join(',')),
  ].join('\\r\\n') + '\\r\\n';
}
```

- [ ] **Step 4: Run the CSV test and migration validation against a populated proto database**

Run: `npm test -- tests/responses.test.ts`

Expected: PASS.

Then have the Deployment role apply the additive migration to `proto_survey_questionnaire_poc`, insert one compliant `DEMO-REQ-001-20260918-01-*` row through the server path, and verify the row can be read back. Expected: migration and data readback both succeed; no empty-schema-only migration result is accepted.

- [ ] **Step 5: Commit the data boundary**

Run:

```bash
git add supabase/migrations src/lib/supabase/service.ts src/lib/responses.ts tests/responses.test.ts package.json package-lock.json
git commit -m "feat: add questionnaire response store"
```

### Task 3: Build the public form and server-side submission route

**Files:**
- Create: `app/api/responses/route.ts`, `app/questionnaire-form.tsx`
- Modify: `app/page.tsx`, `tests/questionnaire.test.ts`

**Interfaces:**
- Consumes `parseQuestionnaireSubmission`, `insertResponse`, and the four field-name literals.
- Produces `POST /api/responses` JSON responses `{ ok: true }` (201) or `{ ok: false, fieldErrors }` (400), with no submitted values echoed.
- Consumed by the browser form and the E2E path.

- [ ] **Step 1: Write failing endpoint behavior tests**

Extend `tests/questionnaire.test.ts` with one test that posts four compliant values to `POST /api/responses` and expects status 201 plus `{ ok: true }`, and one test that posts `profession: 'doctor'` and expects status 400, `{ ok: false }`, a profession prefix error, and no call to `insertResponse`. Construct the handler dependency through an exported `createResponsesPostHandler({ insertResponse })` factory so the test invokes the real route logic with a deterministic in-memory async insert function.

- [ ] **Step 2: Run the endpoint tests and observe the expected red failure**

Run: `npm test -- tests/questionnaire.test.ts`

Expected: the new tests fail because `createResponsesPostHandler` has not been exported by `app/api/responses/route.ts`.

- [ ] **Step 3: Implement the minimal server route**

Implement `createResponsesPostHandler` to read `await request.json()`, call `parseQuestionnaireSubmission`, return the exact 400 shape for invalid input, and call the injected `insertResponse` only for a valid result. Export `POST` from the factory using the real repository. Catch JSON parse and persistence errors as generic safe responses; do not pass request values to `console`, error messages, or response bodies.

Use this handler boundary so the route test calls the same validation path as production:

```ts
type ResponseDependencies = {
  insertResponse: (submission: QuestionnaireSubmission) => Promise<QuestionnaireResponse>;
};

export function createResponsesPostHandler({ insertResponse }: ResponseDependencies) {
  return async function POST(request: Request): Promise<Response> {
    const parsed = parseQuestionnaireSubmission(await request.json());
    if (!parsed.ok) return Response.json({ ok: false, fieldErrors: parsed.fieldErrors }, { status: 400 });
    await insertResponse(parsed.value);
    return Response.json({ ok: true }, { status: 201 });
  };
}
```

- [ ] **Step 4: Implement the accessible public form**

Render an `h1` and visible notice: `Demonstration questionnaire: do not enter real personal or business information.` Render visible labels exactly `Nickname`, `Organization`, `Profession`, and `Job title`, all with `required`, `name`, and `aria-describedby` attributes. The client form uses `fetch('/api/responses', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(values) })`; it shows returned per-field errors or the exact success text `Submission successful`. Disable the submit button while pending and clear no user input after an error.

The four form controls must be generated from the same field names used by the parser:

```tsx
{QUESTIONNAIRE_FIELDS.map((field) => (
  <label key={field} htmlFor={field}>
    {LABELS[field]}
    <input id={field} name={field} required aria-describedby={`${field}-error`} />
    <span id={`${field}-error`} role="alert">{fieldErrors[field]}</span>
  </label>
))}
```

- [ ] **Step 5: Run red-to-green verification**

Run: `npm test -- tests/questionnaire.test.ts && npm run lint && npm run build`

Expected: all pass; the unit test demonstrates invalid input cannot call persistence, while the public page compiles with the four required controls and success state.

- [ ] **Step 6: Commit the public submission behavior**

Run:

```bash
git add app/page.tsx app/questionnaire-form.tsx app/api/responses/route.ts tests/questionnaire.test.ts
git commit -m "feat: add demonstration questionnaire submission"
```

### Task 4: Implement one protected administrator view and CSV download

**Files:**
- Create: `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/admin.ts`, `app/admin/login/page.tsx`, `app/admin/login/login-form.tsx`, `app/admin/page.tsx`, `app/api/admin/responses/export/route.ts`, `tests/admin.test.ts`
- Modify: `src/lib/responses.ts`

**Interfaces:**
- Produces `requireBusinessAppOwner(): Promise<void>` from `src/lib/admin.ts`; it redirects unauthenticated visitors and rejects an authenticated non-owner.
- Produces `GET /api/admin/responses/export` with `Content-Type: text/csv; charset=utf-8` and `Content-Disposition: attachment; filename="questionnaire-responses.csv"` for the owner only.
- Consumes `listResponses` and `toResponsesCsv` from the repository.

- [ ] **Step 1: Write failing authorization and export tests**

Create `tests/admin.test.ts` with a test that invokes the export handler factory using `{ getUser: async () => ({ id: 'other-user' }) }` and expects HTTP 403, plus a test with `{ id: 'owner-user' }`, `BUSINESS_APP_OWNER_USER_ID='owner-user'`, and one compliant response from `listResponses`; expect HTTP 200, the CSV content type, attachment header, and the fixture nickname in the body. The handler factory receives `getUser` and `listResponses` dependencies, so these tests exercise actual authorization and CSV wiring without a network substitute.

- [ ] **Step 2: Run the admin tests and observe the expected red failure**

Run: `npm test -- tests/admin.test.ts`

Expected: the command fails because the owner check and export handler do not yet exist.

- [ ] **Step 3: Implement cookie auth and strict owner authorization**

Implement `src/lib/supabase/browser.ts` with `createBrowserClient` using the two publishable environment values. Implement `src/lib/supabase/server.ts` with `createServerClient` and Next `cookies()` adapters. `requireBusinessAppOwner` calls `supabase.auth.getUser()`, compares only `user.id` to `BUSINESS_APP_OWNER_USER_ID`, and redirects to `/admin/login` if no user exists; it throws/returns forbidden for a nonmatching user. Do not authorize with email, `user_metadata`, URL parameters, or client-supplied IDs.

The authorization decision must follow this exact order:

```ts
const { data: { user } } = await createServerSupabaseClient().auth.getUser();
if (user === null) redirect('/admin/login');
if (user.id !== process.env.BUSINESS_APP_OWNER_USER_ID) {
  throw new Error('Forbidden');
}
return user;
```

- [ ] **Step 4: Implement the login, response list, and CSV endpoint**

Create a minimal login form that calls `supabase.auth.signInWithPassword`, displays a generic `Unable to sign in.` error, and redirects to `/admin` only after success. Make `/admin` call `requireBusinessAppOwner`, list rows newest-first, and show four labelled values plus `createdAt` without an edit or delete control. Implement the export GET handler as a dependency factory for tests, then bind it to the real auth/repository functions. The endpoint returns no response data when authentication fails.

Keep the HTTP authorization boundary explicit:

```ts
export function createExportGetHandler(dependencies: {
  getUser: () => Promise<{ id: string } | null>;
  listResponses: () => Promise<QuestionnaireResponse[]>;
}) {
  return async function GET() {
    const user = await dependencies.getUser();
    if (user === null) return new Response(null, { status: 401 });
    if (user.id !== process.env.BUSINESS_APP_OWNER_USER_ID) return new Response(null, { status: 403 });
    return new Response(toResponsesCsv(await dependencies.listResponses()), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="questionnaire-responses.csv"',
      },
    });
  };
}
```

- [ ] **Step 5: Run green verification**

Run: `npm test -- tests/admin.test.ts && npm test && npm run lint && npm run build`

Expected: all pass; the export is available only to the configured owner and serializes the stored compliant record.

- [ ] **Step 6: Commit the single-owner administration behavior**

Run:

```bash
git add src/lib/supabase/browser.ts src/lib/supabase/server.ts src/lib/admin.ts app/admin tests/admin.test.ts src/lib/responses.ts
git commit -m "feat: add owner response export"
```

### Task 5: Add the single cumulative browser E2E path and release-ready verification

**Files:**
- Create: `playwright.config.ts`, `e2e/global-setup.ts`, `e2e/req-001-questionnaire.spec.ts`
- Modify: `package.json`, `.gitignore`

**Interfaces:**
- Produces Playwright project command `npm run test:e2e` and one case named `REQ-001 submits and exports a compliant demonstration response`.
- Consumes the running application URL, the proto test database, and a pre-provisioned single owner whose test identity begins with `DEMO-REQ-001-20260918-01`.
- Provides deployment/test roles with repeatable preview and production evidence instructions; it does not deploy or write workflow state.

- [ ] **Step 1: Write the failing Playwright key-path test**

Create `e2e/req-001-questionnaire.spec.ts` with one test using these exact submitted values:

```ts
const run = 'DEMO-REQ-001-20260918-01';
const response = {
  nickname: `${run}-nickname`,
  organization: `${run}-organization`,
  profession: `${run}-profession`,
  jobTitle: `${run}-job-title`,
};
```

The test opens `/`, verifies the real-information warning, fills all four labelled controls, submits, expects `Submission successful`, reloads `/`, signs in at `/admin/login` using the provisioned demo owner, expects the nickname in `/admin`, clicks `Download CSV`, reads the downloaded file, and expects all four response values. Configure trace and screenshots only on failure; their labels and the entered values remain compliant synthetic data.

- [ ] **Step 2: Run the E2E test and observe the expected red failure**

Run: `npm run test:e2e -- e2e/req-001-questionnaire.spec.ts`

Expected: FAIL before Task 1–4 application and test-environment implementation is available, or fail at the first unmet user-visible assertion. Record the first failure without treating it as a successful verification.

- [ ] **Step 3: Implement deterministic E2E setup and runner configuration**

Implement `e2e/global-setup.ts` to verify that the privileged Deployment adapter has already provisioned exactly one synthetic owner with identifier `DEMO-REQ-001-20260918-01-owner@example.test`; its immutable ID must already equal `BUSINESS_APP_OWNER_USER_ID`. The setup reads the synthetic owner email/password only from ignored environment variables, never writes them, and refuses an unsafe target before a browser is opened. Configure Playwright `baseURL`, `webServer` for local execution, HTML reporting, and failed-only trace/screenshot capture. Add `test:e2e` to invoke `playwright test`.

Require the runner to reject an unsafe target before a browser is opened:

```ts
const target = process.env.BUSINESS_DIRECT_E2E_TARGET;
const baseUrl = new URL(process.env.PLAYWRIGHT_BASE_URL ?? '');
if (!['local', 'preview', 'production'].includes(target ?? '')) {
  throw new Error('E2E target is not approved.');
}
if (target === 'local' && baseUrl.hostname !== '127.0.0.1') {
  throw new Error('Local E2E requires a loopback URL.');
}
if (target !== 'local' && baseUrl.protocol !== 'https:') {
  throw new Error('Deployed E2E requires HTTPS.');
}
if (process.env.E2E_OWNER_EMAIL !== 'DEMO-REQ-001-20260918-01-owner@example.test') {
  throw new Error('E2E owner is not the approved synthetic identity.');
}
if (!process.env.BUSINESS_APP_OWNER_USER_ID || !process.env.E2E_OWNER_PASSWORD?.startsWith('DEMO-REQ-001-20260918-01')) {
  throw new Error('Synthetic owner configuration is incomplete.');
}
```

- [ ] **Step 4: Run the complete local verification suite**

Run: `npm test && npm run lint && npm run build && npm run test:e2e`

Expected: all commands pass. Save only command output paths, test IDs, build IDs, and compliant browser artifacts as evidence; never save or print credentials.

- [ ] **Step 5: Execute independent preview verification**

Hand the verified branch and migration to `business_direct_deployment` for a typed `ENSURE_DEMO_OWNER` intent, followed by populated `proto_survey_questionnaire_poc` migration/readback and preview deployment. The intent configures the one `DEMO-REQ-001-20260918-01-owner@example.test` owner and its immutable ID as the server-only `BUSINESS_APP_OWNER_USER_ID`; it never returns a password or secret. Then hand the preview URL and this exact Playwright case to `business_direct_tester` in `PREVIEW_E2E` mode. Expected: the tester reports browser-visible persistence-after-reload, owner list visibility, and CSV content with only `DEMO-REQ-001-20260918-01` values. A passing build or HTTP-only check is insufficient.

- [ ] **Step 6: Commit E2E coverage and verify the worktree**

Run:

```bash
git add playwright.config.ts e2e package.json package-lock.json .gitignore
git commit -m "test: cover questionnaire submission and export"
git diff --check
```

Expected: the browser test is retained as cumulative regression coverage and `git diff --check` has no output.

## Spec coverage self-review

| Confirmed requirement | Implementing tasks |
| --- | --- |
| Real-information warning | Task 3 public form; Task 5 browser assertion |
| Four required labelled fields | Task 1 parser; Task 3 controls and endpoint; Task 5 browser flow |
| Reject missing or unprefixed input without persistence | Task 1 parser; Task 3 route dependency test and handler |
| Server-side persistence and success message | Task 2 schema/repository; Task 3 route/form; Task 5 browser flow |
| Single owner view and CSV export after reload | Task 4 auth/list/export; Task 5 browser flow |
| Synthetic data in preview/production evidence | Global constraints; Task 2 proto readback; Task 5 fixture, preview handoff, and artifact rules |
| No Word export, configurable fields, multiple admins, edits, deletes, or response summary | Global constraints; Task 3 success-only form; Task 4 no edit/delete UI |

Placeholder scan: no incomplete implementation markers, generic validation directions, or unnamed interfaces remain. Type consistency review: every task uses `QuestionnaireSubmission`, `QuestionnaireResponse`, `parseQuestionnaireSubmission`, `insertResponse`, `listResponses`, and `toResponsesCsv` exactly as defined above.

## Execution handoff

The plan is saved at `specs/REQ-001/plan.md`. The coordinator must keep the local record in `BUILDING_PREVIEW`, dispatch the Developer automatically for Tasks 1–5, then dispatch Deployment and Tester for verified preview work. It must not ask the Business App Owner to review this plan or `tasks.md`; the only business pause is the verified preview deployment at `WAITING_ON_PREVIEW`.
