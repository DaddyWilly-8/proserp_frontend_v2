# ProsERP-style Frontend Architecture Prompt

Use this prompt to bootstrap a new Next.js frontend following the same architecture as ProsERP.

---

Build a Next.js (App Router) + TypeScript frontend following this architecture:

## 1. BFF Proxy Pattern
The Next.js app has zero direct database access. All data comes from an external backend REST API (`API_BASE_URL` env var). Every feature gets a matching pair:
- `src/app/api/<module>/route.ts` — thin proxy route handler: extract auth headers/cookies from the incoming request, forward to `${API_BASE_URL}/<resource>` via `fetch` or a shared axios instance, relay the JSON response back verbatim. No business logic lives here.
- A shared axios client at `src/lib/services/config.js` with `baseURL = API_BASE_URL`, cookie forwarding for SSR, and auth header injection.
- Shared proxy helpers in `src/lib/utils/apiUtils.ts` (`getAuthHeaders`, `handleJsonResponse`).

## 2. Feature-module folder structure
Mirror the same module names across three trees:
- `src/app/[lang]/(common)/<module>/` — pages (locale-prefixed via a `[lang]` dynamic segment)
- `src/app/api/<module>/` — proxy API routes
- `src/components/<module>/` — feature components, plus a colocated `<module>-services.js` (or `.ts`) file per feature exporting plain functions that call the module's API routes via axios (e.g. `stakeholderServices.getLedgers(params)`)

Generic shared UI goes in `src/components/shared/`. Cross-cutting concerns (`hooks/`, `types/`, `utilities/`, `config/`, `themes/`) live at `src/`.

## 3. Auth
NextAuth (Credentials provider) that itself calls the external backend's `/login` endpoint. JWT session callback stores `accessToken` (bearer token for the backend), `organization_id`/`organization_name` (multi-tenant scoping), and a `permissions` array (RBAC). A `checkOrganizationPermission(PERMISSIONS.X)` helper gates UI and actions everywhere — permission constants centralized in `src/utilities/constants/permissions.ts`.

## 4. Forms
Every create/edit form: `react-hook-form` + `yup` (via `@hookform/resolvers/yup`) for validation, wrapped as a Dialog component (`<Feature>DialogForm.jsx`). Default values are seeded from an optional `entity` prop when editing, `null`/sane defaults when creating. Split large forms into subcomponents (`<Feature>TopInformation`, `<Feature>ItemForm`, `<Feature>Summary`) that receive `register`, `watch`, `setValue`, `errors` via a `FormProvider` context rather than prop-drilling every field.

## 5. Data fetching
`@tanstack/react-query` for all server state — list views use `useQuery` with a queryKey array including filters; mutations use `useMutation` with `onSuccess` invalidating the relevant queryKeys and firing a snackbar (`notistack`), `onError` mapping backend `validation_errors` back onto form fields via `setError`.

## 6. i18n
Locale-segment routing (`[lang]`) with a custom middleware and per-language JSON dictionaries in `src/dictionaries/`.

## 7. UI kit
MUI as the base design system (`Grid` with the `size` prop, not the legacy `xs`/`md` props directly). Keep one dialog form + one summary/list view pattern per module.

Apply this structure to build: **[describe your new project's domain/modules here]**.

---

## Optional: forking shared infra instead of rebuilding from scratch

Files to copy verbatim from ProsERP as a starter (generic, not domain-specific):

| File | Purpose |
|---|---|
| `src/lib/services/config.js` | Shared axios instance — baseURL, cookie forwarding, auth header injection |
| `src/lib/utils/apiUtils.ts` | `getAuthHeaders`, `handleJsonResponse`, header/geo helpers used by every proxy route |
| `src/middleware/auth.ts` | Auth-gating middleware (checks `/api/auth/status`, redirects) |
| `src/middleware/locale.ts` | i18n locale middleware |
| `src/app/api/auth/[...nextauth]/route.js` | NextAuth Credentials provider calling external `/login`, JWT/session callbacks |
| `src/utilities/constants/permissions.ts` | Pattern for centralizing `PERMISSIONS.X` constants |
| A sample `<module>/route.ts` proxy handler | Copy as the proxy-route template to clone per new resource |
| A sample `<Feature>DialogForm.jsx` + `<Feature>-services.js` pair | Copy as the form/service template |
| `.eslintrc.json`, `.prettierrc.json`, `tsconfig.json` path-alias setup | Tooling conventions |

Do **not** fork anything ERP-domain-specific (`purchase-services.js`, HR/POS/manufacturing components, `@jumbo/*` template internals).

If forking, prepend this to the handoff prompt:

> I'm forking the infrastructure layer from an existing Next.js + TypeScript ERP frontend (BFF proxy architecture) into this new project. I've copied these files verbatim — treat them as the established convention, don't rewrite their style: [list the files copied]. For every new feature module, create the matching trio described above.
