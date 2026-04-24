# Student Management Testing Guide

## Overview
This guide walks you through testing all three student creation flows and the orphan student claiming workflow.

## Current Database State
- **Total students with user accounts**: 5
- **Orphan students (no user account)**: 2
- **Test student**: teststudent@sica.com (partner-referred)

## Prerequisites
1. Development server running on `http://localhost:3000`
2. Admin account access
3. Partner account access
4. Email service configured (Resend) for claim invitations

---

## Test 1: Self-Registration Flow

**Purpose**: Verify that self-registration creates BOTH users AND students table records.

### Steps:
1. Open browser and go to `http://localhost:3000/signup`
2. Fill in the registration form:
   - Email: `test-self-register-[timestamp]@example.com`
   - Password: (create a strong password)
   - Full Name: `Test Self Register`
3. Submit the form
4. Check email for confirmation (if email confirmation is enabled)
5. After confirmation, login to the application

### Verification:
Run this command to verify records were created:
```bash
curl -s "https://maqzxlcsgfpwnfyleoga.supabase.co/rest/v1/users?email=eq.[YOUR_EMAIL]&select=id,email,role" \
  -H "apikey: [SERVICE_KEY]" \
  -H "Authorization: Bearer [SERVICE_KEY]" | jq '.'

curl -s "https://maqzxlcsgfpwnfyleoga.supabase.co/rest/v1/students?user_id=eq.[USER_ID]&select=id,user_id,email" \
  -H "apikey: [SERVICE_KEY]" \
  -H "Authorization: Bearer [SERVICE_KEY]" | jq '.'
```

**Expected Result**: Both users and students table should have records for the new student.

---

## Test 2: Admin-Created Student (With Account)

**Purpose**: Verify that admin can create a student with a user account.

### Steps:
1. Login as admin at `http://localhost:3000/admin/login`
2. Navigate to `http://localhost:3000/admin/v2/students`
3. Click "Add Student" or similar button
4. Fill in the student form:
   - Email: `test-admin-with-account-[timestamp]@example.com`
   - Full Name: `Test Admin With Account`
   - Nationality: `Test Country`
   - Other details as needed
5. **Do NOT check** "Skip user creation" option
6. Submit the form

### Verification:
Check both tables for the new records (see Test 1 verification).

**Expected Result**: Both users and students table should have records, and the student should appear in the admin dashboard.

---

## Test 3: Admin-Created Orphan Student

**Purpose**: Verify that admin can create an orphan student (no user account).

### Steps:
1. Login as admin
2. Navigate to `http://localhost:3000/admin/v2/students`
3. Click "Add Student"
4. Fill in the student form:
   - Email: (optional - can leave blank)
   - First Name: `Orphan`
   - Last Name: `Student`
   - Nationality: `Test Country`
   - Other details as needed
5. **Check** "Skip user creation" option
6. Submit the form

### Verification:
```bash
# Check for orphan students (user_id is null)
curl -s "https://maqzxlcsgfpwnfyleoga.supabase.co/rest/v1/students?user_id=is.null&select=id,user_id,first_name,last_name" \
  -H "apikey: [SERVICE_KEY]" \
  -H "Authorization: Bearer [SERVICE_KEY]" | jq '.'
```

**Expected Result**:
- Only students table should have a record
- `user_id` should be NULL
- Student should appear in admin dashboard with "Orphan" source badge

---

## Test 4: Partner-Referred Student

**Purpose**: Verify that partner can create a student with referral tracking.

### Steps:
1. Login as partner at `http://localhost:3000/partner/login`
2. Navigate to partner dashboard
3. Look for "Add Student" or "Refer Student" option
4. Fill in the student form:
   - Email: `test-partner-referred-[timestamp]@example.com`
   - Full Name: `Test Partner Referred`
   - Other details as needed
5. Submit the form

### Verification:
```bash
# Check for partner referral
curl -s "https://maqzxlcsgfpwnfyleoga.supabase.co/rest/v1/users?email=eq.[YOUR_EMAIL]&select=id,email,referred_by_partner_id" \
  -H "apikey: [SERVICE_KEY]" \
  -H "Authorization: Bearer [SERVICE_KEY]" | jq '.'
```

**Expected Result**:
- Both users and students table should have records
- `referred_by_partner_id` should be set on the users table
- Student should appear with "Partner Referred" source in admin dashboard

---

## Test 5: Orphan Student Claiming

**Purpose**: Verify that orphan students can claim their account via email invitation.

### Steps:
1. Login as admin
2. Navigate to `http://localhost:3000/admin/v2/students`
3. Find an orphan student (look for "Orphan (Pending)" badge)
4. Click "Send Claim Invitation" button
5. Check email for invitation link (or check database for claim token)
6. Open the claim link in browser
7. Complete the account creation form:
   - Email: (should match the invitation)
   - Password: (create a strong password)
   - Full Name: (confirm or update)
8. Submit the form

### Verification:
```bash
# Check if student record now has user_id
curl -s "https://maqzxlcsgfpwnfyleoga.supabase.co/rest/v1/students?id=eq.[STUDENT_ID]&select=id,user_id,email" \
  -H "apikey: [SERVICE_KEY]" \
  -H "Authorization: Bearer [SERVICE_KEY]" | jq '.'
```

**Expected Result**:
- User account should be created
- `user_id` should now be set on the students table record
- Student can login with the created account
- "Orphan" badge should disappear from admin dashboard

---

## Test 6: Email Validation Across Flows

**Purpose**: Verify that duplicate emails are prevented across all creation flows.

### Steps:
1. Pick an existing email from the database (e.g., `teststudent@sica.com`)
2. Try to create a student with the same email via:
   - Self-registration (`/signup`)
   - Admin creation (`/admin/v2/students`)
   - Partner creation (`/partner/students`)
3. All should fail with appropriate error message

### Verification:
- Each attempt should return an error: "Email already exists" or similar
- No duplicate records should be created

---

## Test 7: Admin Dashboard Display

**Purpose**: Verify the admin dashboard correctly displays all student types.

### Steps:
1. Login as admin
2. Navigate to `http://localhost:3000/admin/v2/students`
3. Check the stats cards at the top:
   - Total Students
   - Individual (self-registered)
   - Partner Referred
   - Orphan Students (new!)
   - Active Students
   - New This Month
4. Check the source filter dropdown:
   - Should have options: "All", "Individual", "Partner Referred", "Orphan (Pending)"
5. Verify each student card shows correct source badge

### Expected Results:
- Stats should match database counts
- Filters should work correctly
- Source badges should be accurate:
  - Blue badge for "Individual"
  - Green badge for "Partner Referred"
  - Orange badge for "Orphan (Pending)"

---

## Automated Test Script

Run the automated test script to check database state:
```bash
./test-student-flows.sh
```

This will:
- Check current student counts
- Display orphan students
- Show existing test data
- Provide manual test instructions

---

## Common Issues & Solutions

### Issue 1: Orphan students not showing in dashboard
**Solution**: Check that the admin students API is correctly querying for `user_id IS NULL` records.

### Issue 2: Claim invitation not sent
**Solution**: 
- Verify email service (Resend) is configured
- Check `.env.local` for `RESEND_API_KEY`
- Check server logs for email sending errors

### Issue 3: Duplicate email error not showing
**Solution**: 
- Verify `checkEmailExists()` function is being called in all APIs
- Check that the validation runs before database insertion

### Issue 4: Student source showing as "Individual" instead of "Partner Referred"
**Solution**: 
- Verify `referred_by_partner_id` is set correctly on users table
- Check that the frontend correctly interprets the field

---

## Success Criteria

All tests pass if:
1. ✅ Self-registration creates both users and students records
2. ✅ Admin creation with account creates both records
3. ✅ Admin orphan creation creates only students record (user_id NULL)
4. ✅ Partner creation creates both records with referred_by_partner_id
5. ✅ Email validation prevents duplicates across all flows
6. ✅ Orphan claiming links student to new user account
7. ✅ Admin dashboard displays all student types correctly
8. ✅ Source badges and filters work accurately

---

## Next Steps After Testing

1. **Fix any issues found** during testing
2. **Document edge cases** discovered
3. **Consider performance optimizations** (e.g., caching, indexing)
4. **Add E2E tests** for critical flows
5. **Update user documentation** with new features
