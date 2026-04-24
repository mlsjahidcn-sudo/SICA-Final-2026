# Overall Documents Management Plan

## 1. Summary
The goal is to unify the document management system across the Student, Partner, and Admin portals by migrating the Admin portal to use the new `documents` table as the single source of truth. Additionally, we will introduce a global "Documents" management page for Admins to easily verify, reject, and manage documents across all students and applications.

## 2. Current State Analysis
*   **Data Fragmentation:** The Student V2 and Partner V2 portals upload and manage documents using the `documents` table. However, the Admin portal APIs currently read from and write to the legacy `application_documents` table. This causes Admins to miss newly uploaded documents from the V2 portals.
*   **Missing Global Admin Page:** Admins do not have a centralized `/admin/v2/documents` page. They can only manage documents by navigating into specific application details pages.
*   **Bug in Admin Student Details:** The `GET /api/admin/students/[id]` route currently fetches documents for only the *first* application (`applications?.[0]?.id || ''`), rather than fetching all documents associated with the student.
*   **Inconsistent Verification:** Document verification currently relies on different endpoints and tables depending on the portal being used.

## 3. Proposed Changes

### Step 1: Database Migration Script
*   Create a SQL script (`scripts/migrate-documents.sql`) to copy existing records from `application_documents` to `documents` to ensure no historical data is lost.
*   Ensure fields like `file_key`, `file_name`, `status`, `document_type`, and `application_id` are mapped correctly.

### Step 2: Admin API Refactoring
*   **Create `GET /api/admin/documents/route.ts`:** To serve the new global documents page. It will support filtering by status (pending, verified, rejected), document type, student ID, and application ID.
*   **Create `PATCH /api/admin/documents/[id]/verify/route.ts`:** To handle document verification/rejection directly on the `documents` table.
*   **Create `DELETE /api/admin/documents/[id]/route.ts`:** To allow admins to delete invalid documents.
*   **Update `src/app/api/admin/applications/[id]/route.ts`:** Change the document fetching query from `application_documents` to `documents` where `application_id` matches.
*   **Update `src/app/api/admin/students/[id]/route.ts`:** Change the document fetching query to fetch from `documents` where `student_id` matches, fixing the bug that only fetched the first application's documents.
*   **Update `src/app/api/admin/documents/[id]/route.ts`:** Update the single document fetch query to use the `documents` table.

### Step 3: Admin UI Implementation & Design Consistency
*   **Create Global Documents Page (`src/app/admin/(admin-v2)/v2/documents/page.tsx`):**
    *   Build a data table to list all documents across the platform using Admin v2 standards (`PageContainer`, `PageHeader`, `Card`, `Table`).
    *   Add filters for `status` (Pending, Verified, Rejected), `type`, and a search bar for student names.
    *   Add inline actions to quickly Verify or Reject documents (with a modal for rejection reasons).
*   **Update Admin Sidebar (`src/components/admin/sidebar.tsx` & `responsive-sidebar.tsx`):** Add a navigation link for the new global Documents page.
*   **Update Admin Application Documents Page (`src/app/admin/(admin-v2)/v2/applications/[id]/documents/page.tsx`):** Ensure it uses the updated verification API, correctly reflects the `documents` table structure, and maintains design consistency with the global page.
*   **Update Admin Student Details Page (`src/app/admin/(admin-v2)/v2/students/[id]/page.tsx`):** Ensure the documents tab/section displays all of the student's documents correctly.
*   **UI Container & Design Consistency Check across Portals:**
    *   Ensure the Student V2 (`/student-v2/documents`), Partner V2 (`/partner-v2/documents`), and Admin V2 global documents pages have a consistent look and feel for document items.
    *   Standardize the `Status Badges` (Pending, Verified, Rejected) colors and icons across all three portals.
    *   Standardize the `Expiry Badges` and file size formatting logic across all three portals.

## 4. Assumptions & Decisions
*   **Single Source of Truth:** The `documents` table will replace `application_documents` completely for all active portals.
*   **Document Ownership:** Documents in the `documents` table are primarily tied to a `student_id`, and optionally to an `application_id` (if they are application-specific). This allows for document reuse across multiple applications.
*   **Backward Compatibility:** The existing legacy portal APIs (`/admin/...` vs `/admin/v2/...`) will be updated to point to the new table to avoid maintaining two separate sets of data.

## 5. Verification Steps
1.  **Run Migration:** Execute the migration script and verify `documents` contains all legacy files.
2.  **Upload Test:** Upload a new document via the Student V2 portal.
3.  **Admin Visibility:** Log in as an Admin, navigate to the new `/admin/v2/documents` page, and verify the newly uploaded document appears as "Pending".
4.  **Verification Flow:** Verify the document as an Admin. Log back into the Student V2 portal and confirm the status has changed to "Verified".
5.  **Student Details Test:** Open a Student Details page in the Admin portal and ensure all their historical and new documents are listed correctly.