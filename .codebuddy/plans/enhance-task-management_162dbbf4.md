---
name: enhance-task-management
overview: Comprehensively enhance task management with student portal, subtasks UI, comments, attachments, notifications, templates, calendar view, and advanced features for admin/partner/student workflows.
todos:
  - id: implement-subtasks-ui
    content: Create TaskSubtasks component with drag-drop reordering, inline add/edit/delete, progress percentage display
    status: completed
  - id: implement-comments-ui
    content: Create TaskComments component with comment input, user mentions, timestamps, edit/delete functionality
    status: completed
  - id: implement-attachments-ui
    content: Create TaskAttachments component with drag-drop upload, file preview, download, and delete
    status: completed
  - id: create-student-tasks-portal
    content: Create student task portal at /student-v2/tasks with personal task CRUD and application-linked tasks
    status: completed
  - id: add-task-notifications
    content: Integrate task notifications with existing WebSocket system for assignments, due dates, and updates
    status: completed
  - id: implement-calendar-view
    content: Add calendar view component with month/week views and drag-drop rescheduling
    status: completed
  - id: add-bulk-operations
    content: Implement bulk operations toolbar with multi-select, bulk status/priority change, assign, and delete
    status: completed
  - id: enhance-filtering-search
    content: Add advanced filter panel (assignee, date range, labels) and full-text search input
    status: completed
  - id: add-task-templates
    content: Create task template system with template CRUD and apply-template functionality
    status: completed
  - id: add-labels-tags
    content: Implement labels/tags system with color picker, label management, and filtering
    status: completed
---

## Product Overview

Comprehensive task management enhancement for the SICA Study Abroad Platform, transforming the basic task tracking system into a full-featured project management solution that serves all user roles effectively.

## Core Features

### Phase 1: Missing Schema Features UI Implementation

- **Subtasks/Checklist UI**: Drag-and-drop reorderable checklist items with progress tracking and completion percentages
- **Comments System**: Threaded comments with user mentions (@username), edit/delete functionality, and real-time updates
- **File Attachments**: Drag-drop upload, preview, download, and delete with support for images, PDFs, and documents

### Phase 2: Student Task Portal

- **Personal Task Dashboard**: Students can create personal tasks linked to their applications
- **Application-Linked Tasks**: Auto-generated tasks from application milestones (document submission, interview prep, visa application)
- **Document Checklists**: Task-based document collection with completion tracking

### Phase 3: Advanced Features

- **Calendar View**: Month/week calendar with drag-and-drop rescheduling and due date visualization
- **Task Notifications**: Integration with existing notification system for assignments, due dates, status changes
- **Bulk Operations**: Multi-select tasks with bulk status change, assign, delete, and archive
- **Advanced Search & Filtering**: Full-text search, filter by assignee, date range, labels, priority

### Phase 4: Productivity Features

- **Task Templates**: Reusable templates for common workflows (application follow-up, visa checklist, partner onboarding)
- **Labels/Tags System**: Color-coded labels for task categorization with filtering support

### Key Use Cases

1. **Application Follow-up Tasks**: Track document requests, interview scheduling, offer letter follow-ups
2. **Document Collection Reminders**: Automated reminders for missing documents per application stage
3. **Interview Preparation**: Checklist items for interview prep tasks assigned to students
4. **Visa Application Workflow**: Step-by-step visa application task templates
5. **Partner Onboarding**: Standardized task templates for new partner setup
6. **Team Collaboration**: Admins assign tasks to team members with due dates and priorities

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **UI Components**: shadcn/ui (Radix UI based)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase PostgreSQL (External: maqzxlcsgfpwnfyleoga.supabase.co)
- **Real-time**: WebSocket via existing notification infrastructure
- **File Storage**: S3-compatible object storage (existing coze-coding-dev-sdk)

## Implementation Approach

### Architecture Pattern

Extend existing layered architecture with new task-specific components:

- **Presentation Layer**: New task components in `/src/components/tasks/`
- **Business Logic Layer**: Enhanced API routes with new endpoints
- **Data Layer**: Utilize existing tables (admin_tasks, admin_task_comments, admin_task_attachments, admin_task_subtasks)

### Database Schema Additions

```sql
-- Add new columns to admin_tasks
ALTER TABLE admin_tasks ADD COLUMN labels TEXT[] DEFAULT '{}';
ALTER TABLE admin_tasks ADD COLUMN template_id UUID REFERENCES task_templates(id);
ALTER TABLE admin_tasks ADD COLUMN estimated_hours DECIMAL(5,2);
ALTER TABLE admin_tasks ADD COLUMN actual_hours DECIMAL(5,2);

-- New task_templates table
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'application', 'visa', 'onboarding', etc.
  subtasks JSONB DEFAULT '[]', -- [{title, order}]
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task labels for filtering
CREATE TABLE task_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL, -- hex color
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for task-label many-to-many
CREATE TABLE admin_task_labels (
  task_id UUID REFERENCES admin_tasks(id) ON DELETE CASCADE,
  label_id UUID REFERENCES task_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);
```

### Key Technical Decisions

1. **Drag-and-Drop**: Use `@dnd-kit/core` for Kanban card reordering and subtask reordering (lightweight, accessible)
2. **Real-time Updates**: Leverage existing WebSocket infrastructure for live task updates
3. **File Uploads**: Use existing S3-compatible storage with presigned URLs
4. **Calendar**: Implement custom calendar component using `date-fns` for date manipulation
5. **Notifications**: Integrate with existing `/api/notifications` endpoint

## Directory Structure

### New Files to Create

```
project-root/
├── src/components/tasks/
│   ├── task-subtasks.tsx         # [NEW] Subtasks/checklist component
│   ├── task-comments.tsx         # [NEW] Comments section component
│   ├── task-attachments.tsx      # [NEW] File attachments component
│   ├── task-calendar.tsx         # [NEW] Calendar view component
│   ├── task-filters.tsx          # [NEW] Advanced filter component
│   ├── task-bulk-actions.tsx     # [NEW] Bulk operations toolbar
│   ├── task-labels.tsx           # [NEW] Labels/tags component
│   └── task-template-dialog.tsx  # [NEW] Template selection dialog
├── src/app/(student-v2)/student-v2/tasks/
│   ├── page.tsx                  # [NEW] Student tasks page
│   └── [id]/
│       └── page.tsx              # [NEW] Student task detail page
├── src/app/api/admin/tasks/
│   ├── [id]/
│   │   ├── comments/
│   │   │   └── route.ts          # [NEW] Comments CRUD API
│   │   ├── attachments/
│   │   │   └── route.ts          # [NEW] Attachments upload/delete API
│   │   └── subtasks/
│   │       └── route.ts          # [NEW] Subtasks CRUD API
│   └── bulk/
│       └── route.ts              # [NEW] Bulk operations API
├── src/app/api/student/tasks/
│   └── route.ts                  # [NEW] Student tasks API
├── src/app/api/tasks/templates/
│   └── route.ts                  # [NEW] Task templates API
└── migrations/
    └── 008_task_enhancements.sql # [NEW] Database schema additions
```

### Files to Modify

```
├── src/app/admin/(admin-v2)/v2/tasks/
│   ├── page.tsx                  # [MODIFY] Add calendar view, bulk ops, labels
│   └── [id]/
│       └── page.tsx              # [NEW] Task detail page with comments, subtasks, attachments
├── src/app/(partner-v2)/partner-v2/tasks/
│   └── page.tsx                  # [MODIFY] Add calendar view, enhanced features
├── src/components/student-v2/
│   └── student-sidebar.tsx       # [MODIFY] Add Tasks menu item
└── src/lib/email.ts              # [MODIFY] Add task notification email templates
```

## Implementation Notes

### Performance Considerations

- **N+1 Query Prevention**: Batch fetch user info for task comments/assignees
- **Pagination**: Implement cursor-based pagination for large task lists
- **Optimistic Updates**: Update UI immediately on status changes, revert on error
- **Debounced Search**: Debounce full-text search queries (300ms)
- **Calendar Data**: Fetch only tasks within visible date range

### Real-time Updates

- Reuse existing WebSocket infrastructure from `/src/ws-handlers/notifications.ts`
- Add new message types: `task_assigned`, `task_updated`, `task_comment`, `task_due_soon`
- Subscribe to task channel on task pages: `tasks:{user_id}`

### File Attachments

- Use existing S3-compatible storage via `coze-coding-dev-sdk`
- Generate presigned URLs for secure uploads/downloads
- Support file types: images (jpg, png), documents (pdf, doc, docx), spreadsheets (xls, xlsx)
- Max file size: 10MB per attachment

### Security & Access Control

- Students can only view/edit their own tasks
- Partners can view tasks assigned to them or related to their referrals
- Admins have full access to all tasks
- File uploads require authentication token validation

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: Already completed initial exploration of task management codebase
- Expected outcome: Verified existing implementation patterns and identified modification targets

### Skill

- **supabase-postgres-best-practices**
- Purpose: Optimize database queries for task filtering and search performance
- Expected outcome: Efficient indexes and query patterns for task list operations