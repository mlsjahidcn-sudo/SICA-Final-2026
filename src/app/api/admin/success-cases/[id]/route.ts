import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';

const STORAGE_BUCKET = 'success-cases';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * GET /api/admin/success-cases/[id]
 * Admin endpoint to fetch a single success case by ID (any status)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const { id } = await params;

    const { data: caseItem, error } = await supabase
      .from('success_cases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Success case not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching success case:', error);
      return NextResponse.json(
        { error: 'Failed to fetch success case' },
        { status: 500 }
      );
    }

    // Convert storage paths to public URLs
    const transformedCase = { ...caseItem };
    
    if (caseItem.admission_notice_url) {
      const { data: urlData } = supabase.storage
        .from('success-cases')
        .getPublicUrl(caseItem.admission_notice_url);
      transformedCase.admission_notice_url = urlData?.publicUrl || null;
    }
    
    if (caseItem.student_photo_url) {
      const { data: urlData } = supabase.storage
        .from('success-cases')
        .getPublicUrl(caseItem.student_photo_url);
      transformedCase.student_photo_url = urlData?.publicUrl || null;
    }
    
    if (caseItem.jw202_url) {
      const { data: urlData } = supabase.storage
        .from('success-cases')
        .getPublicUrl(caseItem.jw202_url);
      transformedCase.jw202_url = urlData?.publicUrl || null;
    }

    return NextResponse.json({ success_case: transformedCase });
  } catch (error) {
    console.error('Error in admin/success-cases/[id] GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/success-cases/[id]
 * Admin endpoint to update a success case with optional file uploads
 * 
 * Body (multipart/form-data):
 * All fields from POST are optional for update
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const { id } = await params;
    const formData = await request.formData();

    // Check if case exists
    const { data: existingCase, error: fetchError } = await supabase
      .from('success_cases')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingCase) {
      return NextResponse.json(
        { error: 'Success case not found' },
        { status: 404 }
      );
    }

    // Build update object with text fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const textFields = [
      'student_name_en', 'student_name_cn',
      'university_name_en', 'university_name_cn',
      'program_name_en', 'program_name_cn',
      'description_en', 'description_cn',
      'status', 'intake'
    ];

    textFields.forEach(field => {
      const value = formData.get(field);
      if (value !== null) {
        updateData[field] = value;
      }
    });

    // Handle boolean and number fields
    if (formData.get('is_featured') !== null) {
      updateData.is_featured = formData.get('is_featured') === 'true';
    }

    if (formData.get('display_order') !== null) {
      updateData.display_order = parseInt(formData.get('display_order') as string) || 0;
    }

    if (formData.get('admission_year') !== null) {
      updateData.admission_year = parseInt(formData.get('admission_year') as string) || null;
    }

    // Handle file uploads
    const uploadFile = async (
      file: File,
      fieldName: string,
      oldFilePath: string | null
    ): Promise<string | null> => {
      if (!file || file.size === 0) return oldFilePath;

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File ${fieldName} exceeds 10MB limit`);
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type for ${fieldName}. Allowed: JPG, PNG, WebP, PDF`);
      }

      // Delete old file if exists
      if (oldFilePath) {
        try {
          await supabase.storage.from(STORAGE_BUCKET).remove([oldFilePath]);
        } catch {
          // Ignore deletion errors
        }
      }

      // Upload new file
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${id}/${fieldName}_${timestamp}_${sanitizedName}`;

      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error(`Error uploading ${fieldName}:`, uploadError);
        throw new Error(`Failed to upload ${fieldName}`);
      }

      return filePath;
    };

    try {
      // Upload student photo
      const studentPhoto = formData.get('student_photo') as File;
      if (studentPhoto && studentPhoto.size > 0) {
        updateData.student_photo_url = await uploadFile(
          studentPhoto,
          'photo',
          existingCase.student_photo_url
        );
      }

      // Upload admission notice
      const admissionNotice = formData.get('admission_notice') as File;
      if (admissionNotice && admissionNotice.size > 0) {
        updateData.admission_notice_url = await uploadFile(
          admissionNotice,
          'admission_notice',
          existingCase.admission_notice_url
        );
      }

      // Upload JW202
      const jw202 = formData.get('jw202') as File;
      if (jw202 && jw202.size > 0) {
        updateData.jw202_url = await uploadFile(
          jw202,
          'jw202',
          existingCase.jw202_url
        );
      }

      // Update the case
      const { data: updatedCase, error: updateError } = await supabase
        .from('success_cases')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating success case:', updateError);
        return NextResponse.json(
          { error: 'Failed to update success case' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success_case: updatedCase,
        message: 'Success case updated successfully',
      });
    } catch (uploadError) {
      console.error('Error uploading files:', uploadError);
      return NextResponse.json(
        { error: uploadError instanceof Error ? uploadError.message : 'Failed to upload files' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in admin/success-cases/[id] PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/success-cases/[id]
 * Admin endpoint to delete a success case and its files
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const { id } = await params;

    // Get the case to retrieve file paths
    const { data: caseItem, error: fetchError } = await supabase
      .from('success_cases')
      .select('student_photo_url, admission_notice_url, jw202_url')
      .eq('id', id)
      .single();

    if (fetchError || !caseItem) {
      return NextResponse.json(
        { error: 'Success case not found' },
        { status: 404 }
      );
    }

    // Delete files from storage
    const filesToDelete = [
      caseItem.student_photo_url,
      caseItem.admission_notice_url,
      caseItem.jw202_url,
    ].filter(Boolean) as string[];

    if (filesToDelete.length > 0) {
      try {
        await supabase.storage.from(STORAGE_BUCKET).remove(filesToDelete);
      } catch (storageError) {
        console.error('Error deleting files from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete the case from database
    const { error: deleteError } = await supabase
      .from('success_cases')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting success case:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete success case' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Success case deleted successfully',
    });
  } catch (error) {
    console.error('Error in admin/success-cases/[id] DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
