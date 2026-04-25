import { getSupabaseClient } from '../src/storage/database/supabase-client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function migrateDocuments() {
  console.log('Starting document migration from application_documents to documents...');
  const supabase = getSupabaseClient();

  // 1. Fetch all application_documents
  const { data: legacyDocs, error: fetchError } = await supabase
    .from('application_documents')
    .select(`
      id,
      application_id,
      document_type,
      file_key,
      file_name,
      file_size,
      content_type,
      status,
      rejection_reason,
      uploaded_at,
      verified_at,
      verified_by,
      created_at,
      updated_at,
      applications (
        student_id
      )
    `);

  if (fetchError) {
    console.error('Error fetching legacy documents:', fetchError);
    return;
  }

  if (!legacyDocs || legacyDocs.length === 0) {
    console.log('No legacy documents found. Migration complete.');
    return;
  }

  console.log(`Found ${legacyDocs.length} legacy documents to migrate.`);

  // 2. Map and insert into documents table
  let successCount = 0;
  let errorCount = 0;

  for (const doc of legacyDocs) {
    // Check if it already exists in the new table (by id to avoid duplicates if we run multiple times)
    const { data: existing } = await supabase
      .from('documents')
      .select('id')
      .eq('id', doc.id)
      .maybeSingle();

    if (existing) {
      console.log(`Document ${doc.id} already migrated. Skipping.`);
      continue;
    }

    const studentId = (doc.applications as any)?.student_id;
    
    if (!studentId) {
      console.warn(`Document ${doc.id} has no associated student_id. Skipping.`);
      errorCount++;
      continue;
    }

    const newDoc = {
      id: doc.id,
      student_id: studentId,
      application_id: doc.application_id,
      type: doc.document_type,
      file_key: doc.file_key,
      file_path: doc.file_key, // Add file_path mapped to file_key
      file_name: doc.file_name,
      file_size: doc.file_size,
      mime_type: doc.content_type,
      status: doc.status || 'pending',
      rejection_reason: doc.rejection_reason,
      uploaded_at: doc.uploaded_at,
      uploaded_by: null, // We don't have this in legacy reliably
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    };

    const { error: insertError } = await supabase
      .from('documents')
      .insert(newDoc);

    if (insertError) {
      console.error(`Error migrating document ${doc.id}:`, insertError);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log('Migration Summary:');
  console.log(`- Successfully migrated: ${successCount}`);
  console.log(`- Failed/Skipped: ${errorCount}`);
  console.log('Migration finished.');
}

migrateDocuments().catch(console.error);
