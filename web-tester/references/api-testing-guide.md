# API Testing Best Practices

## Overview

This guide covers best practices for testing REST APIs.

## HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST creating new resource |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, constraint violation |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Server-side error |

## Request/Response Formats

### Standard Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "field1": "value1"
  }
}
```

### Standard Error Response

```json
{
  "error": "Human readable error message",
  "details": "Optional technical details",
  "code": "ERROR_CODE"
}
```

### List Response with Pagination

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

## Testing Tools

### curl Commands

```bash
# GET request
curl -s http://localhost:5000/api/resource -H "Authorization: Bearer $TOKEN"

# POST with JSON body
curl -s -X POST http://localhost:5000/api/resource \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field":"value"}'

# PUT with JSON body
curl -s -X PUT http://localhost:5000/api/resource/123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field":"updated"}'

# DELETE
curl -s -X DELETE http://localhost:5000/api/resource/123 \
  -H "Authorization: Bearer $TOKEN"

# Get HTTP status code
curl -s -w "%{http_code}" -o /dev/null http://localhost:5000/api/resource

# Get timing info
curl -w "\nTime: %{time_total}s\n" -s http://localhost:5000/api/resource
```

### Python Helper

```python
import subprocess
import json

def api_call(method, url, token=None, data=None):
    cmd = ["curl", "-s", "-X", method, url]
    cmd.extend(["-H", "Content-Type: application/json"])
    if token:
        cmd.extend(["-H", f"Authorization: Bearer {token}"])
    if data:
        cmd.extend(["-d", json.dumps(data)])
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(result.stdout)

# Usage
response = api_call("GET", "http://localhost:5000/api/applications", token=TOKEN)
```

## Authentication Testing

### Token Extraction

```bash
# Extract token from login response
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"Test1234!"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('session',{}).get('access_token',''))")

echo "Token: $TOKEN"
```

### Token Validation

```bash
# Validate token with /me endpoint
curl -s http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('User:', d.get('user',{}).get('email')); print('Role:', d.get('user',{}).get('role'))"
```

## Validation Testing

### Required Fields

```bash
# Test missing required field
curl -s -X POST http://localhost:5000/api/resource \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('error'))"
```

### Field Types

```bash
# Test wrong type
curl -s -X POST http://localhost:5000/api/resource \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"count":"not_a_number"}'
```

### Enum Values

```bash
# Test invalid enum value
curl -s -X POST http://localhost:5000/api/resource \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"invalid_status"}'
```

## Security Testing

### SQL Injection

```bash
# Test SQL injection in search
curl -s "http://localhost:5000/api/users?search='; DROP TABLE users;--"
```

### XSS

```bash
# Test XSS in input
curl -s -X POST http://localhost:5000/api/resource \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>"}'
```

### IDOR (Insecure Direct Object Reference)

```bash
# Test accessing other user's resource
# Login as User A
TOKEN_A="..."
# Try to access User B's resource
curl -s http://localhost:5000/api/resource/user_b_id \
  -H "Authorization: Bearer $TOKEN_A"
# Should return 403 or 404
```

## Performance Testing

### Response Time

```bash
# Measure response time
curl -w "Time: %{time_total}s\n" -s -o /dev/null \
  http://localhost:5000/api/resource \
  -H "Authorization: Bearer $TOKEN"
```

### Load Testing (Basic)

```bash
# Simple concurrent test
for i in {1..10}; do
  curl -s http://localhost:5000/api/resource \
    -H "Authorization: Bearer $TOKEN" > /dev/null &
done
wait
echo "Completed 10 concurrent requests"
```

## Test Automation

### Test Script Template

```bash
#!/bin/bash

BASE_URL="http://localhost:5000"
TOKEN=""

# Helper functions
function test_get() {
    local endpoint=$1
    local expected=$2
    local status=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL$endpoint" -H "Authorization: Bearer $TOKEN")
    if [ "$status" = "$expected" ]; then
        echo "✅ GET $endpoint: $status"
    else
        echo "❌ GET $endpoint: Expected $expected, got $status"
    fi
}

function test_post() {
    local endpoint=$1
    local data=$2
    local expected=$3
    local status=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$BASE_URL$endpoint" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$data")
    if [ "$status" = "$expected" ]; then
        echo "✅ POST $endpoint: $status"
    else
        echo "❌ POST $endpoint: Expected $expected, got $status"
    fi
}

# Tests
echo "Running tests..."
test_get "/api/applications" "200"
test_get "/api/universities" "200"
test_post "/api/applications" '{"program_id":"uuid"}' "201"

echo "Done."
```

## Common Pitfalls

### 1. Not Checking Status Code

```python
# Wrong
response = requests.get(url)
data = response.json()  # May fail if response is error

# Correct
response = requests.get(url)
if response.status_code == 200:
    data = response.json()
else:
    print(f"Error: {response.status_code}")
```

### 2. Ignoring Error Response Body

```python
# Wrong
if response.status_code != 200:
    print("Failed")

# Correct
if response.status_code != 200:
    error = response.json().get('error', 'Unknown error')
    print(f"Failed: {error}")
```

### 3. Not Testing Edge Cases

Always test:
- Empty arrays/objects
- Null values
- Missing fields
- Extra fields
- Very long strings
- Special characters
- Unicode characters
