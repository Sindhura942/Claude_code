# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server on localhost:3000 (Next.js + Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all tests (Vitest)
npm run db:reset     # Reset SQLite database and re-run all migrations
```

Run a single test file: `npx vitest run src/lib/transform/__tests__/jsx-transformer.test.ts`

## Environment

Key variables in `.env`:
- `ANTHROPIC_API_KEY` — Optional. If missing, a `MockLanguageModel` is used (generates static templates based on prompt keywords).
- `JWT_SECRET` — Defaults to `"development-secret-key"` if unset.

## Architecture Overview

UIGen is a full-stack Next.js app where users describe React components in natural language and Claude generates them with a live preview. All generated files live in a **virtual file system** (in-memory, never written to disk).

### Data Flow

1. User types in `ChatInterface` → `ChatProvider` sends messages + serialized `VirtualFileSystem` state to `POST /api/chat`
2. The API route calls Claude (via Vercel AI SDK `streamText`) with two tools:
   - **`str_replace_editor`** (`lib/tools/str-replace.ts`) — create, read, and patch files
   - **`file_manager`** (`lib/tools/file-manager.ts`) — rename and delete files/folders
3. Tool call results stream back in real-time; the client applies changes to the in-memory `VirtualFileSystem`
4. `PreviewFrame` picks up the updated file system, transforms JSX via **Babel in-browser**, and renders in an `<iframe>`
5. On stream completion (`onFinish`), the entire project (messages + file system JSON) is persisted to SQLite via Prisma (authenticated users only)

### Virtual File System

`lib/file-system.ts` — `VirtualFileSystem` class backed by a `Map`. Serialized to/from JSON for API transmission. The entrypoint for generated components must be `/App.jsx`. The `@/` import alias maps to other files in the virtual FS. Missing imports auto-generate placeholder modules with an empty default component. CSS imports are stripped by the Babel transformer and collected separately into a `cssImports` Set.

### AI Integration

- Model: Claude Haiku 4.5 (`lib/provider.ts`)
- System prompt: `lib/prompts/generation.tsx` — instructs Claude to use Tailwind CSS (no inline styles), create `/App.jsx` as entrypoint, use the `@/` alias for cross-file imports
- Max 10k tokens, 40 agentic steps (4 for mock provider)

### Auth

JWT-based sessions via `lib/auth.ts` (7-day expiry, stored in httpOnly cookies). Server actions in `actions/index.ts` handle sign-up/sign-in/sign-out with bcrypt-hashed passwords. Middleware in `src/middleware.ts` guards `/api/projects` and `/api/filesystem` routes (returns 401 without a valid session). Anonymous users can call `/api/chat` (generate components) but cannot persist projects. Anonymous work is tracked in `lib/anon-work-tracker.ts` via sessionStorage to warn users before losing unsaved work.

### Key Contexts

- `lib/contexts/file-system-context.tsx` — holds the `VirtualFileSystem` instance and exposes file CRUD to the component tree
- `lib/contexts/chat-context.tsx` — manages chat messages and the streaming connection to `/api/chat`

### Database Schema

```
User     { id, email, password, projects[] }
Project  { id, name, userId, messages (JSON), data (JSON VirtualFileSystem) }
```

Prisma client is generated to `src/generated/prisma/`.

### UI Stack

- **shadcn/ui** components (`components/ui/`) built on Radix UI primitives
- **Tailwind CSS v4** — config via `src/app/globals.css`, no `tailwind.config.js`
- **Monaco Editor** for the code editor panel
- **Lucide React** for icons
- Add new shadcn components with: `npx shadcn@latest add <component>`

### Testing

Tests use **Vitest + jsdom** with `@testing-library/react`. Tests use `test()` directly (no `describe` blocks). Browser APIs (`URL.createObjectURL`, etc.) are mocked via `vi.mock()`. Run a single test: `npx vitest run <path>`.
