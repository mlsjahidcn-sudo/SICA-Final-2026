#!/bin/bash

# Test script for rate limiting fixes
# This script tests that rate limiting is working correctly on critical endpoints

echo "========================================="
echo "Testing Rate Limiting Implementation"
echo "========================================="
echo ""

BASE_URL="${1:-http://localhost:5000}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
  local endpoint=$1
  local method=$2
  local data=$3
  local expected_limit=$4
  local name=$5

  echo -e "\n${YELLOW}Testing: $name${NC}"
  echo "Endpoint: $method $endpoint"
  echo "Expected limit: $expected_limit requests"
  echo "---"

  success_count=0
  rate_limited_count=0

  for i in $(seq 1 $((expected_limit + 5))); do
    response=$(curl -s -o /dev/null -w "%{http_code}" \
      -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint")

    if [ "$response" == "429" ]; then
      rate_limited_count=$((rate_limited_count + 1))
      if [ $success_count -eq $expected_limit ]; then
        echo -e "  Request $i: ${GREEN}✓ Rate limited (expected)${NC}"
      else
        echo -e "  Request $i: ${RED}✗ Rate limited too early${NC}"
      fi
    elif [ "$response" == "200" ] || [ "$response" == "201" ]; then
      success_count=$((success_count + 1))
      if [ $success_count -le $expected_limit ]; then
        echo -e "  Request $i: ${GREEN}✓ Success ($response)${NC}"
      else
        echo -e "  Request $i: ${RED}✗ Should have been rate limited${NC}"
      fi
    else
      echo -e "  Request $i: ${YELLOW}Other status: $response${NC}"
    fi
  done

  echo ""
  echo "Results:"
  echo "  Successful requests: $success_count"
  echo "  Rate limited requests: $rate_limited_count"

  if [ $success_count -eq $expected_limit ] && [ $rate_limited_count -gt 0 ]; then
    echo -e "  ${GREEN}✓ PASS: Rate limiting working correctly${NC}"
  else
    echo -e "  ${RED}✗ FAIL: Rate limiting not working as expected${NC}"
  fi
}

echo "Starting tests..."
echo ""

# Test 1: Chat endpoint (should allow 10 requests per minute)
test_endpoint \
  "/api/chat" \
  "POST" \
  '{"message":"Hello"}' \
  10 \
  "Chat Endpoint"

# Test 2: Auth signin endpoint (should allow 5 requests per minute)
test_endpoint \
  "/api/auth/signin" \
  "POST" \
  '{"email":"test@test.com","password":"wrongpass"}' \
  5 \
  "Auth Signin Endpoint"

# Test 3: Auth signup endpoint (should allow 5 requests per minute)
test_endpoint \
  "/api/auth/signup" \
  "POST" \
  '{"email":"test'$RANDOM'@test.com","password":"TestPass123","fullName":"Test User","role":"student"}' \
  5 \
  "Auth Signup Endpoint"

echo ""
echo "========================================="
echo "Testing Complete!"
echo "========================================="
echo ""
echo "Note: These tests assume the server is running on $BASE_URL"
echo "If the server is not running, start it with: pnpm dev"
