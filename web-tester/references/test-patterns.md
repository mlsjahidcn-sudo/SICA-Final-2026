# Test Patterns by Module

This document provides testing patterns for different module types.

## Authentication Module

### Test Pattern: Sign In Flow

```bash
# 1. Test with valid credentials
curl -s -X POST http://localhost:5000/api/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"Test1234!"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('token:', bool(d.get('session',{}).get('access_token'))); print('role:', d.get('user',{}).get('role'))"

# 2. Test with invalid credentials
curl -s -X POST http://localhost:5000/api/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"wrong"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('error:', d.get('error'))"

# 3. Test token validity
TOKEN="<your_token>"
curl -s http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Expected Results
- Valid credentials: 200, token returned
- Invalid credentials: 401, error message
- Invalid token: 401
- Expired token: 401

## CRUD Module

### Test Pattern: Full CRUD Cycle

```bash
# Setup
TOKEN="<your_token>"
BASE_URL="http://localhost:5000/api/<resource>"

# 1. CREATE
CREATE_RESULT=$(curl -s -X POST "$BASE_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field1":"value1","field2":"value2"}')
ID=$(echo "$CREATE_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))")
echo "Created: $ID"

# 2. READ
curl -s "$BASE_URL/$ID" -H "Authorization: Bearer $TOKEN"

# 3. UPDATE
curl -s -X PUT "$BASE_URL/$ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field1":"updated"}'

# 4. DELETE
curl -s -X DELETE "$BASE_URL/$ID" \
  -H "Authorization: Bearer $TOKEN"

# 5. VERIFY DELETED
curl -s "$BASE_URL/$ID" -H "Authorization: Bearer $TOKEN"
# Should return 404 or {"error": "Not found"}
```

### Expected Results
- CREATE: 201, returns created object with id
- READ: 200, returns object
- UPDATE: 200, returns updated object
- DELETE: 200 or 204
- After DELETE: 404

## Applications Module

### Test Pattern: Status Transitions

```bash
TOKEN="<partner_token>"
APP_ID="<application_id>"

# 1. Check initial status (should be 'draft')
curl -s "http://localhost:5000/api/applications/$APP_ID" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('application',{}).get('status'))"

# 2. Submit application (draft -> submitted)
curl -s -X POST "http://localhost:5000/api/applications/$APP_ID" \
  -H "Authorization: Bearer $TOKEN"

# 3. Verify status changed
curl -s "http://localhost:5000/api/applications/$APP_ID" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('application',{}).get('status'))"

# 4. Try to edit submitted (should fail for non-draft)
curl -s -X PUT "http://localhost:5000/api/applications/$APP_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"test"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('error','success'))"
```

### Expected Results
- Draft applications can be edited
- Submitted applications can be edited (if not terminal)
- Accepted/Rejected/Withdrawn applications cannot be edited

## Documents Module

### Test Pattern: Document Upload & Status

```bash
TOKEN="<student_token>"
APP_ID="<application_id>"

# 1. List documents for application
curl -s "http://localhost:5000/api/documents?application_id=$APP_ID" \
  -H "Authorization: Bearer $TOKEN"

# 2. Upload document (requires file)
# Note: Actual upload requires multipart/form-data
# This tests the endpoint existence
curl -s -X POST "http://localhost:5000/api/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"application_id":"'$APP_ID'","document_type":"passport"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('error:', d.get('error', 'success'))"

# 3. Get download URL
DOC_ID="<document_id>"
curl -s "http://localhost:5000/api/documents/$DOC_ID/url" \
  -H "Authorization: Bearer $TOKEN"
```

### Expected Results
- List returns array of documents
- Upload creates document record
- Download URL is a valid signed URL
- Status changes are reflected

## Permissions Module

### Test Pattern: Role-Based Access

```bash
# Get tokens for different roles
STUDENT_TOKEN="<student_token>"
PARTNER_TOKEN="<partner_token>"
ADMIN_TOKEN="<admin_token>"

# Test same endpoint with different roles
ENDPOINT="http://localhost:5000/api/admin/applications"

echo "Student access:"
curl -s "$ENDPOINT" -H "Authorization: Bearer $STUDENT_TOKEN" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('error:', d.get('error', 'success'))"

echo "Partner access:"
curl -s "$ENDPOINT" -H "Authorization: Bearer $PARTNER_TOKEN" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('error:', d.get('error', 'success'))"

echo "Admin access:"
curl -s "$ENDPOINT" -H "Authorization: Bearer $ADMIN_TOKEN" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('count:', len(d.get('applications',[])))"
```

### Expected Results
- Student: 403 Forbidden
- Partner: 403 Forbidden (unless has specific permission)
- Admin: 200 with data

## Pagination Module

### Test Pattern: List with Pagination

```bash
TOKEN="<token>"

# 1. Get first page
curl -s "http://localhost:5000/api/applications?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('count:', len(d.get('applications',[])))"

# 2. Get second page
curl -s "http://localhost:5000/api/applications?limit=10&offset=10" \
  -H "Authorization: Bearer $TOKEN"

# 3. Test total count
curl -s "http://localhost:5000/api/applications" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('total:', d.get('total', len(d.get('applications',[]))))"
```

## Search & Filter Module

### Test Pattern: Search Functionality

```bash
TOKEN="<token>"

# 1. Search by name
curl -s "http://localhost:5000/api/universities?search=Beijing" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('results:', len(d.get('universities',[])))"

# 2. Filter by type
curl -s "http://localhost:5000/api/universities?type=985" \
  -H "Authorization: Bearer $TOKEN"

# 3. Combined search and filter
curl -s "http://localhost:5000/api/universities?search=University&type=211" \
  -H "Authorization: Bearer $TOKEN"
```

## Webhook/Callback Module

### Test Pattern: Webhook Testing

```bash
# Simulate webhook callback
curl -s -X POST "http://localhost:5000/api/webhooks/payment" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.completed","data":{"id":"123"}}'

# Check if webhook was processed
curl -s "http://localhost:5000/api/payments/123" \
  -H "Authorization: Bearer $TOKEN"
```

## Error Response Pattern

### Test Pattern: Error Handling

```bash
# 1. Test 400 Bad Request
curl -s -X POST "http://localhost:5000/api/applications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('400 error:', d.get('error'))"

# 2. Test 401 Unauthorized
curl -s "http://localhost:5000/api/applications" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('401 error:', d.get('error'))"

# 3. Test 403 Forbidden
curl -s "http://localhost:5000/api/admin/users" \
  -H "Authorization: Bearer $STUDENT_TOKEN" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('403 error:', d.get('error'))"

# 4. Test 404 Not Found
curl -s "http://localhost:5000/api/applications/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('404 error:', d.get('error'))"
```

## Performance Test Pattern

### Test Pattern: Response Time

```bash
# Test response time
curl -w "\nTime: %{time_total}s\n" -s \
  "http://localhost:5000/api/applications" \
  -H "Authorization: Bearer $TOKEN" > /dev/null

# Test concurrent requests
for i in {1..10}; do
  curl -s "http://localhost:5000/api/applications" \
    -H "Authorization: Bearer $TOKEN" > /dev/null &
done
wait
echo "Concurrent test completed"
```
