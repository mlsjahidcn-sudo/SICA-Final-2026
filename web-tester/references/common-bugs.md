# Common Bug Patterns

This document describes common bug patterns found in web applications and how to detect them.

## Permission & Access Control Bugs

### 1. UUID Type Mismatch

**Symptom**: Access denied (403) for users who should have access.

**Root Cause**: Comparing UUIDs from different tables (users.id vs partners.id).

**Example**:
```typescript
// WRONG - Comparing different UUID types
isOwner = application.partner_id === authUser.id;
// partner_id references partners.id, not users.id

// CORRECT - Use proper access control function
isOwner = await canPartnerAccessApplication(partnerUser, application.student_id, application.partner_id);
```

**Detection**:
- Check database schema for foreign key relationships
- Verify which table each UUID references
- Test with different user roles

### 2. Partner Role Hierarchy

**Symptom**: Partner team member can't access applications they should see.

**Root Cause**: Not checking partner_role for admin vs member permissions.

**Example**:
```typescript
// WRONG - All partners treated the same
if (user.role === 'partner') { /* grant access */ }

// CORRECT - Check specific role
const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
if (isAdmin) { /* full access */ }
else { /* limited access */ }
```

### 3. Student Referrer Access

**Symptom**: Partner can't access applications for students they referred.

**Root Cause**: Not checking `users.referred_by_partner_id` field.

**Detection**:
- Check if student was referred by a partner
- Verify referrer is in the partner's team

## Status & State Management Bugs

### 4. Terminal Status Check

**Symptom**: Can modify applications that should be locked.

**Root Cause**: Only checking for 'draft' status instead of all terminal statuses.

**Example**:
```typescript
// WRONG - Only draft check
if (application.status !== 'draft') { return error; }

// CORRECT - Check all terminal statuses
const terminalStatuses = ['accepted', 'rejected', 'withdrawn'];
if (terminalStatuses.includes(application.status)) { return error; }
```

### 5. Status Transition Validation

**Symptom**: Invalid status transitions allowed.

**Root Cause**: No state machine validation for status changes.

**Detection**:
- Define valid status transitions
- Validate each transition before allowing
- Log invalid transition attempts

## Data Structure Bugs

### 6. JSONB Field Access

**Symptom**: `personal_statement` or `study_plan` returns null.

**Root Cause**: These fields are stored in `profile_snapshot` JSONB column, not as direct columns.

**Example**:
```typescript
// WRONG - Direct column access
const statement = application.personal_statement;

// CORRECT - Extract from JSONB
const statement = application.profile_snapshot?.personal_statement;
```

**Detection**:
- Check database schema for JSONB columns
- Verify API extracts and returns JSONB fields
- Test field presence in responses

### 7. Null vs Undefined Handling

**Symptom**: Errors when accessing optional nested objects.

**Root Cause**: Not handling null/undefined in nested property access.

**Example**:
```typescript
// WRONG - May throw if any level is null
const name = application.students.users.full_name;

// CORRECT - Safe access
const name = application?.students?.users?.full_name || 'Unknown';
```

## API Design Bugs

### 8. Inconsistent Error Responses

**Symptom**: Some errors return different formats.

**Root Cause**: Not using standardized error response format.

**Solution**:
```typescript
// Standard error format
{ "error": "Human readable message", "details": "Optional technical details" }

// Standard success format
{ "success": true, "data": {...} }
```

### 9. Missing Pagination

**Symptom**: API returns too many records, causing timeouts.

**Root Cause**: No pagination on list endpoints.

**Detection**:
- Test with large datasets
- Check for limit/offset parameters
- Verify response includes pagination metadata

### 10. Over-fetching Data

**Symptom**: API responses are slow and large.

**Root Cause**: SELECT * instead of specific columns.

**Detection**:
- Check Supabase query select clauses
- Test response sizes
- Monitor query performance

## Database Bugs

### 11. RLS Infinite Recursion

**Symptom**: Error `42P17: infinite recursion detected in policy for relation "users"`.

**Root Cause**: RLS policies on other tables reference `users` in their policy expressions, creating circular dependency.

**Solution**: Use `SECURITY DEFINER` helper functions in RLS policies:
```sql
CREATE FUNCTION public.is_partner_admin() RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM partners WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;
```

### 12. Stale Data from exec_sql

**Symptom**: `exec_sql` returns different data than REST API.

**Root Cause**: `exec_sql` may read from replica or cached results.

**Solution**: For critical verification, use REST API:
```bash
curl -s "https://{project}.supabase.co/rest/v1/{table}?select=*&limit=1" \
  -H "apikey: {SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer {SERVICE_ROLE_KEY}"
```

## Frontend Bugs

### 13. Hydration Mismatch

**Symptom**: React hydration errors in console.

**Root Cause**: Using `Date.now()`, `Math.random()`, or `typeof window` in render.

**Solution**:
```typescript
// WRONG - Dynamic value in render
<div>{Date.now()}</div>

// CORRECT - Use useEffect for client-only values
const [time, setTime] = useState('');
useEffect(() => { setTime(new Date().toISOString()); }, []);
return <div>{time}</div>;
```

### 14. Missing Loading States

**Symptom**: UI jumps or shows empty content during data fetch.

**Root Cause**: Not handling loading state.

**Solution**:
```typescript
if (isLoading) return <Skeleton />;
if (error) return <Error message={error} />;
return <Content data={data} />;
```

## Security Bugs

### 15. Exposing Service Role Key

**Symptom**: Service role key visible in client-side code.

**Root Cause**: Using service role key in frontend.

**Solution**: Only use `anon` key in frontend. Service role key only in API routes.

### 16. Missing Input Validation

**Symptom**: API accepts invalid data.

**Root Cause**: No validation on request body.

**Solution**: Always validate input:
```typescript
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});
const validated = schema.parse(body);
```

## How to Debug These Bugs

1. **Check the logs**: `tail -n 50 /app/work/logs/bypass/app.log`
2. **Verify database schema**: Use REST API, not `exec_sql`
3. **Test with different roles**: Student, Partner, Admin
4. **Check response format**: Ensure consistent structure
5. **Review foreign keys**: Verify UUID relationships
6. **Check JSONB fields**: Extract nested data correctly
