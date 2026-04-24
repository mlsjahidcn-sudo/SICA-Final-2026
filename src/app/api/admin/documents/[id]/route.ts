import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';

/**
 * DELETE /api/admin/documents/[id]
 * 
 * Delete a document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrResponse = await verifyAdmin(request);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const documentId = (await params).id;
    const supabase = getSupabaseClient();

    // Fetch document details first to get the file_path/file_key
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, file_key')
      .eq('id', documentId)
      .maybeSingle();

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // If there is a file_key, try to delete the file from storage
    if (document.file_key) {
      // Assuming storage bucket is 'documents' based on other implementations
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_key]);
        
      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage fails
      }
    }

    // Delete the document record from the database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Error deleting document record:', deleteError);
      return NextResponse.json({ error: 'Failed to delete document record' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error in document DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
