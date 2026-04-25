---
name: Partner Portal - Students & Applications Enhancements
overview: Enhance the Partner Portal's Students and Applications modules with bulk actions, better filtering, communication tracking, and improved UX.
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Clean
    - Functional
    - Data-focused
  fontSystem:
    fontFamily: Inter
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#3B82F6"
      - "#2563EB"
    background:
      - "#FFFFFF"
      - "#F9FAFB"
    text:
      - "#111827"
      - "#6B7280"
    functional:
      - "#10B981"
      - "#EF4444"
      - "#F59E0B"
todos:
  - id: add-bulk-selection
    content: Add bulk selection UI to applications and students list pages
    status: completed
  - id: create-bulk-api
    content: Create bulk operations API endpoints (update status, delete, assign)
    status: completed
  - id: add-multi-filters
    content: Implement multi-select filters for status, university, degree
    status: completed
  - id: add-saved-views
    content: Add saved filter views functionality
    status: completed
  - id: create-activity-log
    content: Create activity log component and API
    status: completed
  - id: add-table-view
    content: Add table view option with sortable columns
    status: completed
  - id: add-quick-actions
    content: Implement quick actions context menu
    status: completed
---

## Product Overview

Enhance the Partner Portal's Students and Applications modules with bulk operations, advanced filtering, activity tracking, and UX improvements to improve team productivity and user experience.

## Core Features

### Priority 1: Bulk Operations

- Multi-select for applications and students (checkbox selection, select all)
- Bulk status update for applications
- Bulk delete for students and applications
- Bulk assign to team member
- Bulk export selected items

### Priority 2: Advanced Filtering

- Multi-select filters (multiple statuses, universities, degrees)
- Filter by assigned team member
- Saved filter views (save/load filter combinations)
- Quick filter presets (My Drafts, Pending Review, Recently Submitted)

### Priority 3: Activity & Communication Tracking

- Activity log per student/application
- Enhanced notes with categories and pinning
- Action history (who, what, when)

### Priority 4: UX Improvements

- Table view option (toggle card/table)
- Column customization
- Quick actions menu (right-click or dropdown)
- Keyboard shortcuts

### Priority 5: Analytics Enhancement

- Conversion metrics (status flow rates)
- Team performance dashboard
- Response time tracking

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **UI Components**: shadcn/ui (Card, Table, Checkbox, Dropdown, Dialog)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State**: React useState/useCallback with URL params for filters

## Implementation Approach

### Phase 1: Bulk Operations

1. Add selection state to list pages (selectedIds array)
2. Add checkboxes to each card/row
3. Create BulkActionsBar component (appears when items selected)
4. Create bulk API endpoints with transaction support

### Phase 2: Advanced Filtering

1. Convert single-select to multi-select using Combobox/Command components
2. Store filters in URL params for shareability
3. Create SavedFilters component with localStorage + database sync
4. Add "Assigned To" filter with team member dropdown

### Phase 3: Activity Tracking

1. Create activity_log table (id, entity_type, entity_id, action, actor_id, metadata, created_at)
2. Create activity API endpoint
3. Create ActivityLog component with real-time updates
4. Integrate logging into existing operations

### Phase 4: UX Improvements

1. Add view toggle (card/table)
2. Create DataTable component with sortable columns
3. Add QuickActions dropdown using ContextMenu or DropdownMenu
4. Implement column visibility controls

## Directory Structure

```
project-root/
├── src/app/(partner-v2)/partner-v2/
│   ├── applications/
│   │   ├── page.tsx                    # [MODIFY] Add bulk selection, table view, multi-select filters
│   │   └── [id]/
│   │       └── page.tsx                # [MODIFY] Add activity log section
│   ├── students/
│   │   ├── page.tsx                    # [MODIFY] Add bulk selection, filters, table view
│   │   └── [id]/
│   │       └── page.tsx                # [MODIFY] Add activity log, enhanced notes
│
├── src/components/partner-v2/
│   ├── bulk-actions-bar.tsx           # [NEW] Bulk actions toolbar component
│   ├── activity-log.tsx                # [NEW] Activity log display component
│   ├── saved-filters.tsx               # [NEW] Saved filter management
│   ├── multi-select-filter.tsx        # [NEW] Multi-select filter dropdown
│   ├── data-table-view.tsx             # [NEW] Table view component
│   └── quick-actions-menu.tsx          # [NEW] Quick actions context menu
│
├── src/app/api/partner/
│   ├── applications/
│   │   ├── bulk/route.ts              # [NEW] Bulk operations API
│   │   └── bulk-assign/route.ts       # [NEW] Bulk assign to team member
│   ├── students/
│   │   └── bulk/route.ts              # [NEW] Bulk delete for students
│   ├── activity/route.ts              # [NEW] Activity log API
│   └── saved-views/route.ts           # [NEW] Saved filter views API
│
└── src/lib/
    └── activity-logger.ts              # [NEW] Activity logging utility
```

## Implementation Details

### Bulk Actions API Design

```typescript
// POST /api/partner/applications/bulk
{
  action: 'update_status' | 'delete' | 'assign',
  applicationIds: string[],
  data?: { status?: string, assignedTo?: string }
}
```

### Activity Log Schema

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'student' | 'application' | 'document'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created' | 'updated' | 'deleted' | 'status_changed' | 'assigned'
  actor_id UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Saved Filters Schema

```sql
CREATE TABLE saved_filter_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  view_type TEXT NOT NULL, -- 'applications' | 'students'
  filters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Enhance the existing partner portal UI with modern data table patterns, bulk selection UI, and activity timeline components. Maintain consistency with the current shadcn/ui dashboard design.

## Agent Extensions

### Skill

- **ui-ux-pro-max**
- Purpose: Design modern data table and bulk actions UI patterns
- Expected outcome: Production-ready component designs for bulk operations

### SubAgent

- **code-explorer**
- Purpose: Explore existing component patterns and API structures
- Expected outcome: Understanding of current implementation for consistent enhancement