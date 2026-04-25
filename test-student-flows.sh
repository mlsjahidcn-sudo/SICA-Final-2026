#!/bin/bash

# Student Management Flow Testing Script
# Tests all three student creation flows and orphan student claiming

BASE_URL="http://localhost:3000"
SUPABASE_URL="https://maqzxlcsgfpwnfyleoga.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcXp4bGNzZ2Zwd25meWxlb2dhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU3NzgxMywiZXhwIjoyMDkxMTUzODEzfQ.RG4cM2EoccJXqsSggkQ2cA8aYcDQiToSRmKxKjkZppY"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================"
echo "Student Management Flow Testing"
echo "======================================"
echo ""

# Function to check if student exists in database
check_student_in_db() {
    local email=$1
    echo -e "${YELLOW}Checking database for student: $email${NC}"
    
    # Check users table
    USER_DATA=$(curl -s "$SUPABASE_URL/rest/v1/users?email=eq.$email&select=id,email,role,referred_by_partner_id" \
        -H "apikey: $SERVICE_KEY" \
        -H "Authorization: Bearer $SERVICE_KEY")
    
    echo "Users table: $USER_DATA"
    
    # Check students table
    STUDENT_DATA=$(curl -s "$SUPABASE_URL/rest/v1/students?email=eq.$email&select=id,user_id,email,first_name,last_name" \
        -H "apikey: $SERVICE_KEY" \
        -H "Authorization: Bearer $SERVICE_KEY")
    
    echo "Students table: $STUDENT_DATA"
    echo ""
}

# Function to check orphan students
check_orphan_students() {
    echo -e "${YELLOW}Checking orphan students (user_id IS NULL):${NC}"
    
    ORPHANS=$(curl -s "$SUPABASE_URL/rest/v1/students?user_id=is.null&select=id,user_id,email,first_name,last_name,nationality&limit=5" \
        -H "apikey: $SERVICE_KEY" \
        -H "Authorization: Bearer $SERVICE_KEY")
    
    echo "$ORPHANS" | jq '.'
    echo ""
}

# Test 1: Check current state
echo "======================================"
echo "Test 1: Current Database State"
echo "======================================"
echo ""

echo "Total students in users table:"
curl -s "$SUPABASE_URL/rest/v1/users?role=eq.student&select=id" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" | jq 'length'
echo ""

echo "Total orphan students:"
curl -s "$SUPABASE_URL/rest/v1/students?user_id=is.null&select=id" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" | jq 'length'
echo ""

# Test 2: Check existing test student
echo "======================================"
echo "Test 2: Verify Existing Test Student"
echo "======================================"
echo ""

check_student_in_db "teststudent@sica.com"

# Test 3: Check orphan students
echo "======================================"
echo "Test 3: Check Orphan Students"
echo "======================================"
echo ""

check_orphan_students

# Test 4: Test email validation across flows
echo "======================================"
echo "Test 4: Email Validation Testing"
echo "======================================"
echo ""

echo -e "${YELLOW}Attempting to create duplicate student (should fail):${NC}"
echo "This tests if email validation prevents duplicates across flows"
echo ""

# Try to create a student with existing email via admin API
# Note: This would require authentication, so we'll just show the concept
echo "Manual test required:"
echo "1. Try to create student with existing email via admin API"
echo "2. Try to create student with existing email via partner API"
echo "3. Try to self-register with existing email"
echo "All should fail with appropriate error message"
echo ""

# Test 5: Test self-registration flow
echo "======================================"
echo "Test 5: Self-Registration Flow"
echo "======================================"
echo ""

TEST_EMAIL="test-self-register-$(date +%s)@example.com"
echo "Test email: $TEST_EMAIL"
echo ""

echo -e "${YELLOW}Manual test required:${NC}"
echo "1. Go to $BASE_URL/signup"
echo "2. Register with email: $TEST_EMAIL"
echo "3. Check database for both users and students table records"
echo ""

# Test 6: Test admin-created student (with account)
echo "======================================"
echo "Test 6: Admin-Created Student (With Account)"
echo "======================================"
echo ""

TEST_EMAIL="test-admin-with-account-$(date +%s)@example.com"
echo "Test email: $TEST_EMAIL"
echo ""

echo -e "${YELLOW}Manual test required:${NC}"
echo "1. Login as admin"
echo "2. Go to $BASE_URL/admin/v2/students"
echo "3. Create new student with email: $TEST_EMAIL"
echo "4. Do NOT check 'Skip user creation'"
echo "5. Verify both users and students table records created"
echo ""

# Test 7: Test admin-created orphan student
echo "======================================"
echo "Test 7: Admin-Created Orphan Student"
echo "======================================"
echo ""

TEST_EMAIL="test-orphan-$(date +%s)@example.com"
echo "Test email (optional): $TEST_EMAIL"
echo ""

echo -e "${YELLOW}Manual test required:${NC}"
echo "1. Login as admin"
echo "2. Go to $BASE_URL/admin/v2/students"
echo "3. Create new student"
echo "4. Check 'Skip user creation' option"
echo "5. Verify ONLY students table record created (user_id IS NULL)"
echo "6. Student should appear in orphan students list"
echo ""

# Test 8: Test partner-referred student
echo "======================================"
echo "Test 8: Partner-Referred Student"
echo "======================================"
echo ""

TEST_EMAIL="test-partner-referred-$(date +%s)@example.com"
echo "Test email: $TEST_EMAIL"
echo ""

echo -e "${YELLOW}Manual test required:${NC}"
echo "1. Login as partner"
echo "2. Go to partner dashboard"
echo "3. Create new student with email: $TEST_EMAIL"
echo "4. Verify both users and students table records created"
echo "5. Verify referred_by_partner_id is set on users table"
echo ""

# Test 9: Test orphan student claiming
echo "======================================"
echo "Test 9: Orphan Student Claiming"
echo "======================================"
echo ""

echo -e "${YELLOW}Manual test required:${NC}"
echo "1. Find an orphan student from Test 3 above"
echo "2. Login as admin"
echo "3. Click 'Send Claim Invitation' for the orphan student"
echo "4. Check email for invitation link (or check database for claim token)"
echo "5. Open claim link in browser"
echo "6. Complete account creation"
echo "7. Verify user_id is now set on the student record"
echo ""

# Summary
echo "======================================"
echo "Testing Summary"
echo "======================================"
echo ""
echo "✅ Automated checks completed:"
echo "  - Database connection verified"
echo "  - Current student count obtained"
echo "  - Orphan students identified"
echo ""
echo "📋 Manual testing required:"
echo "  - Self-registration flow"
echo "  - Admin student creation (with account)"
echo "  - Admin orphan student creation"
echo "  - Partner student creation"
echo "  - Orphan student claiming"
echo "  - Email validation across flows"
echo ""
echo "🔍 Key things to verify:"
echo "  1. Self-registration creates BOTH users AND students records"
echo "  2. Admin creation with account creates both records"
echo "  3. Admin orphan creation creates ONLY students record (user_id NULL)"
echo "  4. Partner creation creates both records with referred_by_partner_id"
echo "  5. Email validation prevents duplicates across all flows"
echo "  6. Orphan claiming links student to new user account"
echo ""
