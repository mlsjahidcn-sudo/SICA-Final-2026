---
name: admin-partner-student-management
overview: "Build comprehensive admin interface for managing partner students and applications including: enhanced data tables with dynamic partner loading, student creation form, application management with approve/reject actions, student detail pages, and ability to create applications on behalf of partners and assign students to partners."
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Enterprise Admin
    - Clean Minimalist
    - Data-Dense
    - Status-Badged
    - Action-Oriented
    - Professional
  fontSystem:
    fontFamily: Inter
    heading:
      size: 24px
      weight: 700
    subheading:
      size: 16px
      weight: 600
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#2563EB"
      - "#3B82F6"
      - "#60A5FA"
    background:
      - "#FFFFFF"
      - "#F8FAFC"
      - "#F1F5F9"
    text:
      - "#0F172A"
      - "#475569"
      - "#94A3B8"
    functional:
      - "#10B981"
      - "#EF4444"
      - "#F59E0B"
      - "#8B5CF6"
todos:
  - id: api-admin-create-student
    content: Create POST /api/admin/partner-students/route.ts endpoint - accepts student form data + partner_id, creates user record with referred_by_partner_id set to selected partner, creates students table entry
    status: completed
  - id: api-admin-create-application
    content: Create POST /api/admin/partner-applications/route.ts endpoint - accepts student_id, selected_program_ids[], intake, notes, creates application records with proper partner linkage
    status: completed
  - id: api-admin-approve-reject
    content: "Create approve/reject routes: POST /api/admin/partner-applications/[id]/approve/route.ts and [id]/reject/route.ts - update application status with optional admin notes"
    status: completed
  - id: improve-partner-students-page
    content: Redesign admin partner-students/page.tsx - dynamic partner loading from API, enhanced stats cards with gradient accents, improved table with avatar column, Create Student dialog with partner selector, inline active/inactive toggle, better empty/loading states, responsive layout
    status: completed
    dependencies:
      - api-admin-create-student
  - id: admin-student-detail-page
    content: Create admin/v2/partner-students/[id]/page.tsx - full student profile view with personal info cards, application list, document section, transfer button, edit link, activity timeline
    status: completed
  - id: improve-partner-applications-page
    content: Redesign admin partner-applications/page.tsx - dynamic partner loading, enhanced stats cards with color coding per status, improved table with priority indicators, inline Approve/Reject action buttons with confirmation, Add Application dialog, batch actions toolbar
    status: completed
    dependencies:
      - api-admin-create-application
      - api-admin-approve-reject
  - id: admin-application-detail-page
    content: Create admin/v2/partner-applications/[id]/page.tsx - application detail view with program info card, status timeline, student info sidebar, admin action panel (approve/reject/notes), documents section, application metadata
    status: completed
  - id: admin-create-student-dialog
    content: Create reusable AdminStudentCreateDialog component - wraps existing StudentForm with partner selector dropdown, uses POST /api/admin/partner-students, includes success feedback and list refresh
    status: completed
    dependencies:
      - api-admin-create-student
  - id: admin-create-app-dialog
    content: Create reusable AdminApplicationCreateDialog component - simplified version of ApplicationWizard for admin context with student search selector, program selection, intake/priority fields, uses POST /api/admin/partner-applications
    status: completed
    dependencies:
      - api-admin-create-application
  - id: final-polish-test
    content: Final polish - verify TypeScript compilation, check responsive behavior across breakpoints, ensure consistent styling between all new pages, test all CRUD operations work end-to-end
    status: completed
    dependencies:
      - improve-partner-students-page
      - improve-partner-applications-page
      - admin-student-detail-page
      - admin-application-detail-page
      - admin-create-student-dialog
      - admin-create-app-dialog
---

## Product Overview

A comprehensive Admin Interface for managing partner students and their applications. The admin dashboard enables administrators to view all partner student profiles, search and filter data, review/accept/reject student applications, create students on behalf of partners, add new applications, and reassign students to different partner organizations.

## Core Features

1. **Partner Students Data Table**: Full-featured table showing student name, email, partner (with company name), nationality, application counts, status (active/inactive), creation date, with avatar display
2. **Search & Filtering**: Real-time text search by name/email, filter by nationality, status (active/inactive), and dynamically loaded partner dropdown
3. **Student Actions**: View details, transfer to another partner, toggle active/inactive status
4. **Create Student**: Admin can create new students on behalf of any partner, using a full form with personal/passport/academic/family tabs + partner assignment selector
5. **Applications Data Table**: Shows student name, program, university, degree level, status badge, priority, submitted date, partner info
6. **Application Review**: Approve or reject applications directly from the table with one-click actions
7. **Add Application**: Admin can add applications for any partner-referred student via a streamlined wizard form
8. **Application Detail Page**: Full detail view with status timeline, program/university info, documents section
9. **Responsive Design**: Works well on desktop (admin's primary use case) with clean modern UI

## Tech Stack

- **Frontend**: Next.js App Router + React 18 + TypeScript + Tailwind CSS + shadcn/ui components (existing stack)
- **Auth**: `requireAdmin()` server-side + `getValidToken()` client-side (existing pattern)
- **Database**: Supabase client (`getSupabaseClient()`) with existing tables: `users`, `students`, `applications`, `programs`, `universities`, `partners`
- **State Management**: React useState/useEffect (no external state library needed)
- **Notifications**: Sonner toast library (already in use)
- **Icons**: Lucide React (already in use)

## Architecture Design

### System Flow

```mermaid
graph TD
    A[Admin Dashboard] --> B[Partner Students Page]
    A --> C[Partner Applications Page]
    B --> B1[List/Search/Filter Table]
    B --> B2[Create Student Dialog]
    B --> B3[Student Detail Page]
    B --> B4[Transfer to Partner]
    C --> C1[List/Search/Filter Table]
    C --> C2[Approve/Reject Action]
    C --> C3[Add Application Dialog]
    C --> C4[Application Detail Page]
    
    B2 --> API1[POST /api/admin/partner-students]
    B4 --> API2[POST /api/admin/partner-students/id/transfer]
    C2 --> API3[POST /api/admin/partner-applications/id/approve]
    C2 --> API4[POST /api/admin/partner-applications/id/reject]
    C3 --> API5[POST /api/admin/partner-applications]
    
    API1 --> DB[(Supabase)]
    API2 --> DB
    API3 --> DB
    API4 -> DB
    API5 -> DB
```

### Key Decisions

- **Reuse existing StudentForm component** for the admin "create student" page, wrapping it with an extra partner selector dropdown
- **Reuse existing ApplicationWizard** for the admin "add application" flow, passing admin context
- **Dialog-based creation** for both students and applications (keeps context, no page navigation needed)
- **Inline approve/reject** buttons on the applications table row for quick action without leaving the list
- **Dynamic partner loading** via `/api/admin/partners` endpoint (already exists) to replace static/hardcoded dropdowns
- **Admin-specific API endpoints** that bypass partner scope checks (admin sees everything)

## Implementation Notes

- All pages follow the existing admin layout pattern: `useAuth()` check → `SidebarProvider` > `AppSidebar` + `SiteHeader` > content
- Use `requireAdmin()` for all new API route handlers
- Partner dropdowns fetch from `/api/admin/partners?limit=100&status=approved` on mount
- The existing `StudentTransferDialog` at `@/components/admin/student-transfer-dialog.tsx` is already functional — reuse as-is
- Application approve/reject should update status field and set `updated_at` timestamp; consider adding notes
- For admin-created students, allow specifying which partner owns them via `referred_by_partner_id`
- Nationality filter should use dynamic values from actual data instead of hardcoded options

## Design Style: Modern Enterprise Admin Dashboard

Adopting a clean, professional enterprise dashboard aesthetic inspired by tools like Linear, Vercel Dashboard, and modern SaaS admin panels.

**Visual Language**: Clean white cards with subtle borders, generous whitespace, clear visual hierarchy, consistent spacing system. Status badges use color-coded pill design. Tables feature alternating row hover states with subtle background highlights. Action menus are compact dropdowns.

**Layout Philosophy**: Sidebar + main content area (existing layout). Content uses max-width containers with responsive grid layouts. Stats cards in horizontal rows of 4-6 items. Data tables below filters. Pagination at bottom.

**Interaction Patterns**: Inline actions (approve/reject badges clickable), dialog modals for creation forms, slide-out or overlay panels for details. Search input has debounce. Filter dropdowns auto-populate from API.

## Agent Extensions

- **ui-ux-pro-max**
- Purpose: Generate optimal design system guidelines for the admin dashboard UI, including color palette, typography, component patterns, and layout best practices for enterprise data tables and management interfaces
- Expected outcome: Comprehensive design tokens and UI patterns that ensure the admin interface is visually polished, accessible, and follows modern SaaS dashboard conventions
- **modern-web-app**
- Purpose: Ensure React + TypeScript + shadcn/ui code follows best practices for component structure, state management patterns, and form handling
- Expected outcome: Clean, maintainable code that integrates seamlessly with the existing project architecture
- **lucide-icons**
- Purpose: Download specific icons needed for new UI elements (e.g., UserPlus, ClipboardCheck, ShieldCheck, ArrowRightLeft icons not yet used in the project)
- Expected outcome: SVG icon files ready for import in the new admin components