# Partner Team Member Portal Plan

## 1. Overview

Enable partners to manage their own team members (invite, remove, update roles) without admin intervention.

---

## 2. Current State Analysis

### 2.1 What's Already Implemented (Admin-Only)

| Feature | Admin API | Partner API |
|---------|-----------|-------------|
| List partner users | ✅ `/api/admin/partners/[id]/users` | ❌ Missing |
| Invite team member | ✅ Admin-only | ❌ Missing |
| Remove team member | ✅ Admin-only | ❌ Missing |
| Update team member | ✅ Admin-only | ❌ Missing |
| Role management | ⚠️ Basic | ❌ Missing |

**File**: `src/app/api/admin/partners/[id]/users/route.ts`

---

## 3. Proposed Features

### Phase 1: Core Team Management (Priority: High 🔴)

#### 3.1 Partner User List API (Partner-Side)
**Endpoint**: `GET /api/partner/team`

**Purpose**: Partner can view their own team members

**Features**:
- Pagination support
- Search by name/email
- Filter by role/status
- Show last active time
- Show application activity

**Response**:
```json
{
  "team": [
    {
      "id": "uuid",
      "email": "user@partner.com",
      "full_name": "User Name",
      "role": "partner_admin|member",
      "is_active": true,
      "last_sign_in_at": "timestamp",
      "applications_viewed": 42,
      "created_at": "timestamp"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

---

#### 3.2 Invite Team Member API
**Endpoint**: `POST /api/partner/team/invite`

**Purpose**: Partner can invite new team members

**Features**:
- Email invitation
- Auto-approve (partner-invited users skip approval)
- Role assignment (partner_admin/member)
- Welcome email with temporary password
- Invitation link expiration

**Request Body**:
```json
{
  "email": "new@partner.com",
  "full_name": "New User",
  "phone": "+123...",
  "role": "member"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Invitation sent",
  "user": { /* user object */ }
}
```

---

#### 3.3 Update Team Member API
**Endpoint**: `PUT /api/partner/team/[userId]`

**Purpose**: Partner can update team member details

**Permissions**:
- `partner_admin` can update any team member
- `member` can only update own profile

**Features**:
- Update name/phone
- Change role (partner_admin/member)
- Activate/deactivate user
- Cannot change email (for security)

---

#### 3.4 Remove Team Member API
**Endpoint**: `DELETE /api/partner/team/[userId]`

**Purpose**: Partner can remove team members

**Permissions**:
- Only `partner_admin` can remove users
- Cannot remove self

**Features**:
- Soft delete (deactivate) or hard delete
- Transfer ownership option
- Confirmation prompt

---

### Phase 2: Role-Based Access Control (Priority: High 🔴)

#### 2.1 Partner Roles Definition

| Role | Permissions |
|------|-------------|
| `partner_admin` | Full partner portal access + team management |
| `member` | Basic access, no team management |

**Role Matrix**:

| Feature | partner_admin | member |
|---------|----------------|--------|
| View dashboard | ✅ | ✅ |
| View applications | ✅ | ✅ |
| View students | ✅ | ✅ |
| Add notes | ✅ | ✅ |
| View team | ✅ | ❌ |
| Invite team members | ✅ | ❌ |
| Update team members | ✅ | ❌ |
| Remove team members | ✅ | ❌ |
| Change roles | ✅ | ❌ |
| Partner settings | ✅ | ✅ (own only) |
| Partner profile | ✅ | ✅ (own only) |

---

#### 2.2 Role Verification Middleware
**File**: `lib/partner-auth-utils.ts` (new)

```typescript
// Verify partner role
export async function verifyPartnerRole(
  request: NextRequest,
  requiredRole: 'partner_admin' | 'member' = 'member'
) {
  const user = await verifyAuthToken(request);
  if (!user || user.role !== 'partner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get user's partner role from database
  const supabase = getSupabaseClient();
  const { data: profile } = await supabase
    .from('users')
    .select('partner_role, partner_id')
    .eq('id', user.id)
    .single();

  // Check if user has required role
  if (requiredRole === 'partner_admin' && profile?.partner_role !== 'partner_admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  return { user, partnerId: profile?.partner_id, partnerRole: profile?.partner_role };
}
```

---

### Phase 3: Team Management UI (Priority: Medium 🟡)

#### 3.1 Team Management Page
**Path**: `/partner-v2/team`

**Features**:
- Team member list table
- Search & filter
- Invite button (modal)
- Edit/remove actions
- Role badges
- Activity indicators
- Last active display

**UI Components**:
- Team list table
- Invite user modal
- Edit user modal
- Role selector
- Active/deactive toggle
- Confirmation dialogs

---

#### 3.2 Sidebar Navigation Update
Add "Team" item to partner sidebar:
```
Partner Portal
├── Dashboard
├── Applications
├── Students
├── Team (NEW) ←
├── Meetings
├── Universities
├── Analytics
├── Notifications
├── Settings
└── Profile
```

---

#### 3.3 Invite User Modal
**Modal Contents**:
- Email input
- Full name input
- Phone input (optional)
- Role selector (partner_admin/member)
- Send invite button
- Invitation status indicator

---

### Phase 4: Database Updates (Priority: High 🔴)

#### 4.1 Users Table Enhancements
Add partner role field:
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS partner_role TEXT DEFAULT 'member';

-- Add index for partner role queries
CREATE INDEX IF NOT EXISTS idx_users_partner_role ON users(partner_role);

-- Update existing partner users to partner_admin
UPDATE users 
SET partner_role = 'partner_admin' 
WHERE role = 'partner' AND partner_role IS NULL;
```

#### 4.2 Partner Team Activity Log (Optional)
```sql
CREATE TABLE IF NOT EXISTS partner_team_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT, -- 'invited', 'removed', 'role_changed', 'deactivated', 'activated'
  target_user_id UUID REFERENCES users(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);
```

---

### Phase 5: Audit & Notifications (Priority: Low 🟢)

#### 5.1 Team Activity Log
**Endpoint**: `GET /api/partner/team/activity`

**Features**:
- Team member changes log
- Who did what, when
- Filterable by user/action/date
- Pagination support

---

#### 5.2 Team Change Notifications
- Email notifications for team changes
- In-app notifications
- Who invited/removed/changed role
- Optional: push notifications

---

## 4. Implementation Order

### Sprint 1: Core APIs (2-3 days)
1. Add `partner_role` column to users table
2. Create `verifyPartnerRole` utility
3. Implement `GET /api/partner/team` - List team
4. Implement `POST /api/partner/team/invite` - Invite user
5. Implement `PUT /api/partner/team/[id]` - Update user
6. Implement `DELETE /api/partner/team/[id]` - Remove user

### Sprint 2: Team UI (2 days)
1. Create `/partner-v2/team` page
2. Add team list component
3. Add invite user modal
4. Add edit user modal
5. Add remove user dialog
6. Update partner sidebar

### Sprint 3: Polish & Notifications (1 day)
1. Role-based UI hiding
2. Activity logging
3. Notifications
4. Testing & bug fixes

---

## 5. API Endpoints Summary

### Partner-Side Team APIs
| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|----------------|
| GET | `/api/partner/team` | List team | Partner |
| POST | `/api/partner/team/invite` | Invite member | Partner Admin |
| PUT | `/api/partner/team/[id]` | Update member | Partner Admin |
| DELETE | `/api/partner/team/[id]` | Remove member | Partner Admin |
| GET | `/api/partner/team/activity` | Activity log | Partner Admin |

---

## 6. Database Migration

### Migration SQL
```sql
-- Add partner_role column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS partner_role TEXT DEFAULT 'member';

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_partner_role ON users(partner_role);

-- Set existing partners as partner_admin
UPDATE users 
SET partner_role = 'partner_admin' 
WHERE role = 'partner' AND partner_role IS NULL;
```

---

## 7. Security Considerations

### 7.1 Authorization Rules
- Partner can only manage their own team
- `partner_admin` required for team management
- Cannot remove self
- Cannot change email (security)
- All actions logged

### 7.2 Data Isolation
- Partner can only see their own team
- Cannot access other partners' teams
- All queries filter by `partner_id`

---

## 8. Success Metrics

- Partners can invite team members without admin
- Partners can manage their own team
- Role-based access control works
- No security vulnerabilities
- Good UX/UI for team management
