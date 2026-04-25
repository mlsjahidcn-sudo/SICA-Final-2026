# Student Delete Fix

## 🐛 Problem

Admins were unable to delete students added by partners due to a missing `admin_notes` column in the `students` table.

## 🔍 Root Cause

1. **Missing Column**: The DELETE endpoint in `/api/admin/students/[id]/route.ts` attempted to update a non-existent `admin_notes` column when soft-deleting orphan students with applications.

2. **Incorrect Error Handling**: When the update failed, it returned a 500 error instead of gracefully handling the situation.

## ✅ Solution

### 1. Added Soft Delete Columns

```sql
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

### 2. Updated DELETE Endpoint

**File**: `src/app/api/admin/students/[id]/route.ts`

**Changes**:
- Removed reference to non-existent `admin_notes` column
- Added soft delete using `is_active` and `deleted_at` columns
- Orphan students with applications are now soft-deleted instead of returning an error

### 3. Updated GET Endpoint

**File**: `src/app/api/admin/students/route.ts`

**Changes**:
- Added filters to exclude soft-deleted orphan students from the list:
  ```typescript
  .or('is_active.is.null,is_active.eq.true')
  .is('deleted_at', null)
  ```

## 📋 How It Works Now

### Regular Students (with user accounts)
- **No applications**: Hard delete (removes from `users`, `students`, and `auth.users`)
- **Has applications**: Soft delete (sets `is_active = false` on `users` table)

### Orphan Students (without user accounts)
- **No applications**: Hard delete (removes from `students` table)
- **Has applications**: Soft delete (sets `is_active = false` and `deleted_at = now()` on `students` table)

## 🧪 Testing

To test the fix:

1. **Create an orphan student** (via partner referral without claim)
2. **Add an application** to that student
3. **Delete the student** - it should now soft delete instead of failing
4. **Verify** the student no longer appears in the admin list

## 📝 Related Files Modified

- `src/app/api/admin/students/[id]/route.ts` - DELETE endpoint fix
- `src/app/api/admin/students/route.ts` - GET endpoint filter for soft deletes
- `migrations/add_student_soft_delete.sql` - Database migration (auto-applied)

## ⚠️ Important Notes

1. **Soft deletes are now the default** for students with applications
2. **Soft-deleted students are filtered out** from the admin list automatically
3. **Partner delete** remains unchanged (it just clears the referral link)
4. **No data loss** - all application data is preserved

## 🔄 Deployment Checklist

- [x] Database migration applied (added `deleted_at` and `is_active` columns)
- [x] TypeScript compilation passed
- [x] DELETE endpoint updated
- [x] GET endpoint updated
- [ ] Test on Hostinger deployment
