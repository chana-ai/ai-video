# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chana AI Video is a Next.js 14 application for AI-powered video generation. It features project management, scene editing with drag-and-drop, script configuration, asset management, and video generation capabilities.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS with custom theme configuration
- **UI Components**: Radix UI primitives + Ant Design for complex components
- **Drag & Drop**: `@hello-pangea/dnd` (react-beautiful-dnd wrapper)
- **HTTP Client**: Axios with request/response interceptors
- **State Management**: React hooks + localStorage for caching

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Architecture Overview

### Routing Structure

- `/` → redirects to `/ai/dashboard`
- `/ai/` → AI application pages:
  - `dashboard/` → User dashboard with projects list
  - `projects/` → Project management
    - `projects/page.tsx` → Projects list view
    - `projects/script-configuration/` → Script configuration
    - `projects/scenes/` → Scene editing with drag-and-drop
    - `projects/value-assets/` → Asset management
  - `videos/` → Video gallery
  - `materials/` → Material library
  - `balance-bill/` → Billing information
- `/auth/` → Authentication pages (login, signup, find-password)
- `/settings/` → Application settings

### Key Features

**Scene Management** (src/app/ai/projects/scenes/):
- Drag-and-drop scene reordering using `@hello-pangea/dnd`
- Scene settings panel with tabs for image, prompt, voice, and storyboard
- Suggestion list with AI-powered recommendations
- Right panel for diagram visualization and settings

**Project Flow**:
1. Create project → Define metadata (name, aspect, theme, style, audiences, narration)
2. Generate script → AI-powered script generation from prompt
3. Configure scenes → Edit individual scene settings
4. Manage assets → Add/organize value assets
5. Generate video → Process scenes into final video

**API Communication**:
- Backend URL configured via `NEXT_PUBLIC_HOST` environment variable (default: `http://localhost:8081`)
- API client with automatic token injection in headers
- User ID automatically added to POST requests and GET params
- 401 responses trigger automatic redirect to login

### Code Organization

- **app/**: Next.js App Router pages and layouts
- **components/ui/**: Radix UI wrapper components (button, dialog, select, etc.)
- **components/**: Business-specific components (header, card, etc.)
- **lib/**: Utilities (axios client, local cache, helper functions)

### Important Patterns

**API Calls**:
```typescript
import api from '@/lib/axios';
// Returns data directly (not wrapped in {code, data, message})
const response = await api.get('/endpoint');
```

**Local Storage Cache**:
```typescript
import { setUserId, setCredentials, getUserId, getCredentials, clearCache } from '@/lib/localcache';
```

**Configuration Access**:
```typescript
import config from '@/app/settings/config';
const apiUrl = config.host; // Configured via NEXT_PUBLIC_HOST
```

**Drag-and-Drop with @hello-pangea/dnd**:
- Used in scenes management for reordering scene cards
- Components in `src/app/ai/projects/scenes/components/` use this library

## Backend Integration

- The application requires a backend API server running at the configured host
- Backend expects responses in format: `{ code: number, data: any, message?: string }`
- Code 0 or 200 indicate success; other codes are treated as errors
- All requests require authentication via `satoken` header

## State Management

Most components use React hooks (`useState`, `useEffect`) for local state. Shared user data is cached in localStorage via `lib/localcache.tsx`.
