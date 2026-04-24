# Success Cases Storage Configuration

## Supabase Storage Bucket Setup

### Step 1: Create Storage Bucket

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: **Storage** → **New Bucket**
3. Create a new bucket with the following settings:
   - **Name**: `success-cases`
   - **Public bucket**: ❌ No (keep it private for security)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: 
     ```
     image/jpeg,image/png,image/webp,application/pdf
     ```

### Step 2: Configure Storage Policies

Run the following SQL in Supabase SQL Editor to set up storage policies:

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

### Step 3: Test the Setup

After creating the bucket and policies, test with:

```bash
# Test public read access (should work)
curl -I https://maqzxlcsgfpwnfyleoga.supabase.co/storage/v1/object/public/success-cases/test.jpg

# Note: Actual file upload will be handled by the admin API with service role key
```

## File Organization

Files will be organized in the bucket as:
```
success-cases/
  ├── {case_id}/
  │   ├── admission_notice_{timestamp}.pdf
  │   ├── jw202_{timestamp}.pdf
  │   └── photo_{timestamp}.jpg
  └── ...
```

## Security Notes

- **Service Role Key**: Admin API will use the service role key to upload files, bypassing RLS
- **Signed URLs**: API will generate signed URLs for secure file access (1 hour expiry)
- **File Validation**: API will validate file types and sizes before upload
- **Access Control**: Only published cases will be publicly accessible
