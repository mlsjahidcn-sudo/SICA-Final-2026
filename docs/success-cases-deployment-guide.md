# Success Cases Display System - Deployment Guide

## 📋 Overview

This document provides complete instructions for deploying the Success Cases Display System, which allows administrators to manage and display successful admission cases with A4 documents (admission notices and JW202 forms).

## 🎯 Features

### Public Pages
- **List Page** (`/success-cases`): Grid display of published success cases with pagination
- **Detail Page** (`/success-cases/[id]`): Full case details with A4 document previews
- A4 documents display at reduced scale with proper aspect ratio (1:1.414)
- Click to zoom/download documents
- Featured cases highlighting

### Admin Panel
- **List Page** (`/admin/v2/success-cases`): Table view with filters, search, and pagination
- **Create/Edit Forms**: Full CRUD with file upload support
- Status management (Draft, Published, Archived)
- Featured case toggle
- Statistics dashboard

## 🚀 Deployment Steps

### Step 1: Database Migration

Run the SQL migration to create the `success_cases` table:

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: **SQL Editor**
3. Copy the contents of `migrations/20260413_create_success_cases.sql`
4. Execute the SQL

**Alternatively**, run via command line:
```bash
# If you have psql installed
psql -h db.maqzxlcsgfpwnfyleoga.supabase.co -U postgres -d postgres -f migrations/20260413_create_success_cases.sql
```

**Verify the table was created:**
```sql
SELECT * FROM success_cases LIMIT 1;
```

### Step 2: Configure Supabase Storage

1. **Create Storage Bucket**
   - Go to Supabase Dashboard → Storage → New Bucket
   - Name: `success-cases`
   - Public bucket: ❌ No (keep private)
   - File size limit: 10 MB
   - Allowed MIME types: `image/jpeg,image/png,image/webp,application/pdf`

2. **Configure Storage Policies**
   Run the following SQL in Supabase SQL Editor:
   
   ```sql
   -- Allow public to view files in success-cases bucket
   CREATE POLICY "Public can view success case files"
     ON storage.objects FOR SELECT
     USING (bucket_id = 'success-cases');

   -- Allow authenticated admins to upload files
   CREATE POLICY "Admins can upload success case files"
     ON storage.objects FOR INSERT
     WITH CHECK (
       bucket_id = 'success-cases' 
       AND auth.jwt() ->> 'role' = 'admin'
     );

   -- Allow authenticated admins to update files
   CREATE POLICY "Admins can update success case files"
     ON storage.objects FOR UPDATE
     USING (
       bucket_id = 'success-cases' 
       AND auth.jwt() ->> 'role' = 'admin'
     );

   -- Allow authenticated admins to delete files
   CREATE POLICY "Admins can delete success case files"
     ON storage.objects FOR DELETE
     USING (
       bucket_id = 'success-cases' 
       AND auth.jwt() ->> 'role' = 'admin'
     );
   ```

3. **Test Storage Access**
   ```bash
   # Test public read (should fail - bucket is private)
   curl -I https://maqzxlcsgfpwnfyleoga.supabase.co/storage/v1/object/public/success-cases/test.jpg
   ```

### Step 3: Build and Deploy

1. **Build the application**
   ```bash
   pnpm install
   pnpm build
   ```

2. **Start the server**
   ```bash
   pnpm start
   # or
   ./scripts/start.sh
   ```

### Step 4: Test the System

1. **Test Admin Panel**
   - Navigate to: `http://localhost:3000/admin/v2/success-cases`
   - Login as admin
   - Create a test success case with documents
   - Verify documents upload correctly

2. **Test Public Pages**
   - Navigate to: `http://localhost:3000/success-cases`
   - Verify cases appear (must be published first)
   - Test detail page and document preview
   - Test document zoom/download functionality

## 📁 File Structure

```
src/
├── app/
│   ├── (public)/success-cases/
│   │   ├── page.tsx              # Public list page
│   │   └── [id]/page.tsx         # Public detail page
│   ├── admin/(admin-v2)/v2/success-cases/
│   │   ├── page.tsx              # Admin list page
│   │   ├── new/page.tsx          # Admin create page
│   │   └── [id]/edit/page.tsx    # Admin edit page
│   └── api/
│       ├── success-cases/
│       │   ├── route.ts          # Public API (GET)
│       │   └── [id]/route.ts     # Public detail API (GET)
│       └── admin/success-cases/
│           ├── route.ts          # Admin API (GET, POST)
│           └── [id]/route.ts     # Admin detail API (GET, PUT, DELETE)
├── components/
│   ├── admin-v2/
│   │   ├── success-cases-list.tsx    # Admin list component
│   │   └── success-case-form.tsx     # Admin form component
│   └── ui/
│       └── a4-document-preview.tsx   # A4 document preview component
├── components/dashboard-v2-sidebar.tsx  # Updated with Success Cases link
└── migrations/
    └── 20260413_create_success_cases.sql  # Database migration
```

## 🔧 API Endpoints

### Public API

**GET /api/success-cases**
- Returns list of published success cases
- Query params: `page`, `limit`, `featured`, `year`
- Response includes signed URLs for documents

**GET /api/success-cases/[id]**
- Returns single published success case
- Includes signed URLs for all documents

### Admin API

**GET /api/admin/success-cases**
- Returns all success cases (any status)
- Query params: `page`, `limit`, `status`, `search`
- Includes statistics

**POST /api/admin/success-cases**
- Creates new success case
- Body: multipart/form-data with files
- Files: student_photo, admission_notice, jw202

**GET /api/admin/success-cases/[id]**
- Returns single success case (any status)

**PUT /api/admin/success-cases/[id]**
- Updates success case
- Body: multipart/form-data with files (optional)

**DELETE /api/admin/success-cases/[id]**
- Deletes success case and associated files

## 🎨 UI Components

### A4DocumentPreview
- Displays A4 documents with correct aspect ratio (1:1.414)
- Supports PDF and image files
- Hover overlay with view/download buttons
- Modal preview for detailed viewing
- Props:
  - `url`: Document URL
  - `title`: Document title
  - `maxWidth`: Maximum display width (default: 400px)
  - `showActions`: Show hover actions (default: true)

## 🔐 Security

### Row Level Security (RLS)
- Public users can only view published cases
- Admin operations require authentication
- File uploads use service role key (bypasses RLS)
- Signed URLs expire after 1 hour

### File Upload Security
- File type validation (PDF, JPG, PNG, WebP)
- File size limit: 10MB
- Files stored in private bucket
- Signed URLs for secure access

## 📊 Database Schema

```sql
success_cases (
  id UUID PRIMARY KEY,
  student_name_en TEXT NOT NULL,
  student_name_cn TEXT,
  student_photo_url TEXT,
  university_name_en TEXT,
  university_name_cn TEXT,
  program_name_en TEXT,
  program_name_cn TEXT,
  admission_notice_url TEXT,
  jw202_url TEXT,
  description_en TEXT,
  description_cn TEXT,
  status TEXT DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  admission_year INTEGER,
  intake TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

## 🐛 Troubleshooting

### Issue: Table not found
- **Solution**: Run the database migration in Step 1

### Issue: File upload fails
- **Check**:
  1. Storage bucket exists
  2. Storage policies are configured
  3. File size < 10MB
  4. File type is allowed

### Issue: Documents not displaying
- **Check**:
  1. Files uploaded to correct bucket
  2. Signed URLs generated correctly
  3. Case status is 'published'

### Issue: Admin panel not accessible
- **Check**:
  1. User is logged in as admin
  2. User role is 'admin' in database

## 📝 Notes

- A4 aspect ratio is 1:1.414 (210mm × 297mm)
- Signed URLs expire after 1 hour for security
- Featured cases appear first in public list
- Display order allows manual sorting
- Status flow: draft → published → archived

## 🎉 Success Criteria

- [x] Database table created
- [x] Storage bucket configured
- [x] Public pages accessible
- [x] Admin panel functional
- [x] File uploads working
- [x] Document previews display correctly
- [x] Navigation links added
- [x] RLS policies configured

## 📞 Support

If you encounter any issues during deployment:

1. Check the browser console for errors
2. Check Supabase logs for database errors
3. Verify all environment variables are set
4. Ensure all migration steps completed successfully

---

**Last Updated**: 2026-04-13
**Version**: 1.0.0
