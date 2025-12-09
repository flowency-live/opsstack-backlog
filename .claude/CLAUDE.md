# FlowencyBuild-Backlog - Claude Code Context

This file is automatically loaded by Claude Code for all work in this project.

---

## Project Overview

**FlowencyBuild-Backlog** is an internal product backlog collaboration tool for Flowency Build. It enables Flowency team and clients to collaboratively manage, prioritise, and refine product backlogs.

**Key Characteristics:**
- Internal tool (NOT a white-label SaaS product)
- Multi-tenant with single shared database
- Full collaboration model (clients can create, edit, reorder PBIs)
- AI-ready with markdown export for Claude analysis

---

## Critical Documentation

### Implementation Plan (Primary Reference)
**Location:** `IMPLEMENTATION_PLAN.md`

Contains:
- Complete architecture overview
- Database schema
- Route structure
- Feature specifications
- Phase-by-phase implementation tasks
- Progress tracker

**This document MUST be kept in sync with code changes.**

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Auth | Auth.js v5 (Google + email/password) |
| Database | PostgreSQL (AWS RDS) via Prisma |
| Storage | AWS S3 |
| Hosting | AWS Amplify |
| UI | Tailwind + shadcn/ui |
| Drag & Drop | @dnd-kit |

---

## User Roles

| Role | Scope |
|------|-------|
| `flowency_admin` | All clients, client_id = NULL |
| `client_admin` | Own client only |
| `client_member` | Own client only |

---

## PBI Structure

Each Product Backlog Item has:
- Title
- Description (markdown)
- Type: feature | bug | tweak | idea
- Status: todo | in_progress | done | blocked
- Effort: XS | S | M | L | XL
- Stack Position (drag to reorder priority)
- Comments
- Attachments

---

## Key Patterns

### Multi-Tenant Data Access
```typescript
// Always filter by client_id for non-flowency users
const pbis = await prisma.pbi.findMany({
  where: {
    client_id: session.user.clientId
  }
});
```

### Auth Check Pattern
```typescript
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

if (session.user.role !== 'flowency_admin' && session.user.clientId !== clientId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## Development Rules

### Code Style
- **No emojis** in code, comments, or console.log
- **UK English** in all user-facing text
- **No quick fixes** - production-grade solutions only
- **One-line commit messages** (clear, concise)

### Before Making Changes
1. Read IMPLEMENTATION_PLAN.md
2. Check which phase the task belongs to
3. Understand current progress state

### After Making Changes
1. Update progress tracker in IMPLEMENTATION_PLAN.md
2. Mark completed tasks with [x]
3. Run `npm run type-check` (must pass)

---

## Folder Structure

```
flowency-backlog/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── invite/[token]/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── clients/
│   │   └── backlog/[slug]/
│   ├── api/
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── pbis/
│   │   └── upload/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/           (shadcn components)
│   ├── auth/
│   ├── dashboard/
│   ├── backlog/
│   └── shared/
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── s3.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── IMPLEMENTATION_PLAN.md
└── .claude/
    └── CLAUDE.md
```

---

## Common Commands

```bash
# Development
npm run dev

# Database
npx prisma generate
npx prisma migrate dev
npx prisma studio

# Quality
npm run type-check
npm run lint
npm run build
```

---

## When in Doubt

1. Read IMPLEMENTATION_PLAN.md
2. Check the phase you're working on
3. Follow established patterns
4. Ask specific questions with file/line references

**IMPLEMENTATION_PLAN.md is the source of truth.**
