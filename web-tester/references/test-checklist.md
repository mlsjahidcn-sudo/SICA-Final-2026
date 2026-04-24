# Test Checklist

Use this checklist for systematic testing of website implementations.

## Pre-Test Setup

- [ ] Confirm service running on port 5000
- [ ] Check no critical errors in logs
- [ ] Verify database connection

## Authentication & Authorization Tests

### Sign In / Sign Out
- [ ] Student can sign in with valid credentials
- [ ] Partner can sign in with valid credentials
- [ ] Admin can sign in with valid credentials
- [ ] Invalid credentials return appropriate error
- [ ] Token is returned on successful login
- [ ] Token can be used for authenticated requests

### Role-Based Access Control
- [ ] Student can access student-only endpoints
- [ ] Student cannot access partner endpoints (403)
- [ ] Student cannot access admin endpoints (403)
- [ ] Partner can access partner endpoints
- [ ] Partner cannot access admin endpoints (403)
- [ ] Admin can access all endpoints
- [ ] Partner admin has broader access than partner member

### Token Validation
- [ ] Expired token returns 401
- [ ] Invalid token returns 401
- [ ] Missing token returns 401 for protected routes

## CRUD Operations Tests

### Create (POST)
- [ ] Valid data creates record (201)
- [ ] Invalid data returns validation error (400)
- [ ] Missing required fields returns error (400)
- [ ] Duplicate unique field returns error (409)
- [ ] Auth required for protected creates (401)

### Read (GET)
- [ ] List endpoint returns array (200)
- [ ] Single item endpoint returns object (200)
- [ ] Non-existent ID returns 404
- [ ] Pagination works correctly
- [ ] Filtering works correctly
- [ ] Search works correctly

### Update (PUT/PATCH)
- [ ] Valid update modifies record (200)
- [ ] Partial update works (PATCH)
- [ ] Invalid data returns validation error (400)
- [ ] Non-existent ID returns 404
- [ ] Auth required for protected updates (401)
- [ ] Permission check for ownership (403)

### Delete (DELETE)
- [ ] Existing record is deleted (200)
- [ ] Non-existent ID returns 404
- [ ] Auth required for protected deletes (401)
- [ ] Permission check for ownership (403)
- [ ] Related records handled correctly (cascade/nullify)

## Module-Specific Tests

### Applications Module
- [ ] Create application with valid program_id
- [ ] Application status starts as 'draft'
- [ ] Submit application changes status to 'submitted'
- [ ] Only draft applications can be edited
- [ ] Terminal statuses cannot be modified
- [ ] Partner access control works correctly
- [ ] profile_snapshot stores personal_statement, study_plan, intake

### Documents Module
- [ ] Upload document with valid file
- [ ] File size limit enforced
- [ ] File type validation works
- [ ] Document status starts as 'pending'
- [ ] Partner can view related documents
- [ ] Download URL generation works
- [ ] Document rejection with reason works

### Meetings Module
- [ ] Create meeting with valid data
- [ ] Meeting link generation works
- [ ] Meeting reminder emails sent (if configured)
- [ ] Cancel meeting updates status
- [ ] Reschedule meeting creates new date

### Universities/Programs Module
- [ ] List universities with pagination
- [ ] Filter universities by province/type
- [ ] Search universities by name
- [ ] List programs by university
- [ ] Filter programs by degree/scholarship

## Database Integrity Tests

- [ ] Foreign keys are valid
- [ ] Required fields are not null
- [ ] Unique constraints enforced
- [ ] Enum values are valid
- [ ] Timestamps update correctly

## Error Handling Tests

- [ ] 400 errors have meaningful messages
- [ ] 401 errors prompt authentication
- [ ] 403 errors explain permission issue
- [ ] 404 errors indicate missing resource
- [ ] 500 errors are logged with details
- [ ] Error response format is consistent

## Performance Tests

- [ ] List endpoints respond within 2 seconds
- [ ] Single item endpoints respond within 1 second
- [ ] Large datasets paginate correctly
- [ ] No N+1 query issues

## Security Tests

- [ ] SQL injection attempts are blocked
- [ ] XSS attempts are sanitized
- [ ] CSRF protection works (if implemented)
- [ ] Sensitive data is not exposed in responses
- [ ] Passwords are not returned in responses

## Integration Tests

- [ ] Email notifications sent (if configured)
- [ ] File uploads stored correctly
- [ ] WebSocket connections work (if implemented)
- [ ] External API integrations work

## Regression Tests

- [ ] Previous bug fixes still work
- [ ] Existing features not broken
- [ ] API contracts maintained
