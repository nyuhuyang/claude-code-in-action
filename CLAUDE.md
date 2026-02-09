# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. It uses Claude AI (via Anthropic API) to generate React components in real-time within a virtual file system. The application features a chat interface where users describe components, and the AI generates them with live preview rendering.

## Development Commands

### Initial Setup
```bash
npm run setup
```
This runs `npm install`, generates the Prisma client, and runs database migrations.

### Development Server
```bash
npm run dev
```
Starts Next.js dev server with Turbopack on port 3000. Requires `NODE_OPTIONS='--require ./node-compat.cjs'`.

### Run Development Server as Daemon
```bash
npm run dev:daemon
```
Runs the dev server in the background, writing logs to `logs.txt`.

### Build
```bash
npm run build
```
Creates production build.

### Testing
```bash
npm test          # Run all tests with Vitest
```
Tests are located in `__tests__` directories next to components (e.g., `src/components/chat/__tests__/`).

### Database Operations
```bash
npx prisma generate           # Regenerate Prisma client after schema changes
npx prisma migrate dev        # Create and apply new migration
npm run db:reset              # Reset database (force reset migrations)
npx prisma studio             # Open Prisma Studio GUI
```

### Linting
```bash
npm run lint
```

## Coding Conventions

- Use comments sparingly. Only comment complex code.
- The database schema is defined in the `prisma/schema.prisma` file. Reference it anytime you need to understand the structure of data stored in the database.

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: SQLite via Prisma ORM
- **AI**: Anthropic Claude API (claude-haiku-4-5) via Vercel AI SDK
- **Testing**: Vitest with jsdom and React Testing Library
- **Build Tool**: Turbopack

### Core Concepts

#### Virtual File System
The application uses a **VirtualFileSystem** class (`src/lib/file-system.ts`) to manage all generated code in memory without writing to disk. This is the heart of the system:

- Files are stored in a Map-based tree structure with `FileNode` objects
- Supports standard operations: `createFile`, `updateFile`, `deleteFile`, `rename`, etc.
- Text editor command implementations: `viewFile`, `createFileWithParents`, `replaceInFile`, `insertInFile`
- Serialization methods (`serialize`/`deserialize`) for persistence to database
- All file paths use Unix-style paths starting with `/`

#### AI Agent Tools
The AI generates components by calling tools that manipulate the virtual file system:

1. **`str_replace_editor`** (`src/lib/tools/str-replace.ts`): Text editing commands
   - `view`: Display file or directory contents with line numbers
   - `create`: Create new files with parent directories
   - `str_replace`: Replace all occurrences of a string
   - `insert`: Insert text at a specific line number

2. **`file_manager`** (`src/lib/tools/file-manager.ts`): File operations
   - Not currently in use but available for file management

#### Live Preview System
The preview system (`src/components/preview/PreviewFrame.tsx` and `src/lib/transform/jsx-transformer.ts`) renders generated React components in real-time:

1. **JSX Transformation**: Uses `@babel/standalone` to transform JSX/TSX to JavaScript in the browser
2. **Import Map**: Creates ES module import maps to handle module resolution
   - React libraries loaded from `https://esm.sh/`
   - User files transformed to blob URLs with proper import aliases (`@/`)
3. **Sandboxed Iframe**: Preview runs in an iframe with `allow-scripts` and `allow-same-origin`
4. **Entry Point**: Looks for `/App.jsx`, `/App.tsx`, `/index.jsx`, or `/index.tsx` as the main component

#### Mock Provider
When no `ANTHROPIC_API_KEY` is set in `.env`, the system uses a **MockLanguageModel** (`src/lib/provider.ts`):
- Implements the Vercel AI SDK `LanguageModelV1` interface
- Returns static component code (Counter, Form, or Card based on prompt)
- Simulates streaming responses with delays
- Limited to 4 steps to prevent repetition (vs 40 for real API)

### Project Structure

```
src/
├── actions/              # Server actions for project CRUD operations
│   ├── create-project.ts
│   ├── get-project.ts
│   ├── get-projects.ts
│   └── index.ts         # Re-exports all actions
├── app/                  # Next.js App Router pages
│   ├── [projectId]/     # Dynamic route for specific project
│   ├── api/chat/        # Streaming AI chat endpoint
│   ├── layout.tsx       # Root layout
│   ├── main-content.tsx # Main UI container
│   └── page.tsx         # Home page
├── components/
│   ├── auth/            # Authentication UI (login, signup, user menu)
│   ├── chat/            # Chat interface components
│   ├── editor/          # Code editor with Monaco
│   ├── preview/         # Live preview iframe
│   ├── ui/              # shadcn/ui components
│   └── HeaderActions.tsx
├── lib/
│   ├── contexts/        # React contexts (file system, auth)
│   ├── prompts/         # AI system prompts
│   ├── tools/           # AI tool implementations
│   ├── transform/       # JSX transformation logic
│   ├── anon-work-tracker.ts  # Anonymous user project management
│   ├── auth.ts          # JWT session management
│   ├── file-system.ts   # Virtual file system implementation
│   ├── prisma.ts        # Prisma client singleton
│   ├── provider.ts      # Language model provider (real + mock)
│   └── utils.ts         # Utility functions
├── generated/prisma/    # Generated Prisma client (output dir)
└── middleware.ts        # Route protection middleware
```

### Database Schema

Located in `prisma/schema.prisma`:

- **User**: Authentication data (email, password hash)
- **Project**: User projects with serialized messages and file system state
  - `messages`: JSON array of chat messages
  - `data`: JSON object of serialized FileNode data
  - `userId`: Optional (supports anonymous users)

Prisma client is generated to `src/generated/prisma/` (not the default location).

### Authentication
- JWT-based sessions using `jose` library
- Session cookies: `session` (7 days), `anonymousId` (365 days for anon users)
- Middleware protects API routes: `/api/projects`, `/api/filesystem`
- Anonymous users can create projects but they're tracked by `anonymousId`
- Projects migrate to user account on signup

### File Import Conventions
- All imports use the `@/` alias for project files (configured in `tsconfig.json`)
- Example: `import { FileSystem } from '@/lib/file-system'`
- This is enforced in the AI generation prompt

### AI Generation Prompt
Located at `src/lib/prompts/generation.tsx`. Key constraints:
- Must create `/App.jsx` as entrypoint (exports default React component)
- Use Tailwind CSS for styling (no inline styles)
- Use `@/` import alias for local files
- No HTML files (React only)
- Operating on virtual FS root (`/`)

## Important Notes

### Environment Variables
The `.env` file should contain:
```
ANTHROPIC_API_KEY=your-api-key-here
```
If omitted, the app runs with the mock provider returning static components.

### Node Compatibility
The `node-compat.cjs` file is required and loaded via `NODE_OPTIONS` in all npm scripts. This handles Node.js compatibility issues.

### Testing
- Tests use Vitest with `jsdom` environment for React component testing
- Path aliases are resolved via `vite-tsconfig-paths` plugin in `vitest.config.mts`
- Test files are colocated in `__tests__/` directories

### Database Migrations
After changing `prisma/schema.prisma`:
1. Run `npx prisma generate` to update the client
2. Run `npx prisma migrate dev` to create and apply migration
3. Restart dev server to pick up changes

### Turbopack
The dev server uses Turbopack (`--turbopack` flag) for faster builds. If you encounter issues, you can temporarily remove this flag from `package.json`.
