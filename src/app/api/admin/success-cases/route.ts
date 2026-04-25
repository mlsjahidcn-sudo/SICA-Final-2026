import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';

const STORAGE_BUCKET = 'success-cases';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * GET /api/admin/success-cases
 * Admin endpoint to fetch all success cases (including drafts and archived)
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - status: Filter by status (draft, published, archived, all)
 * - search: Search by student name or university
 */
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('success_cases')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`student_name_en.ilike.%${search}%,student_name_cn.ilike.%${search}%,university_name_en.ilike.%${search}%,university_name_cn.ilike.%${search}%`);
    }

    const { data: cases, error, count } = await query;

    if (error) {
      console.error('Error fetching success cases:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch success cases',
          details: error.message,
          code: error.code 
        },
        { status: 500 }
      );
    }

    // Calculate stats
    const { data: stats } = await supabase
      .from('success_cases')
      .select('status');
    
    const statsData = {
      total: stats?.length || 0,
      draft: stats?.filter(c => c.status === 'draft').length || 0,
      published: stats?.filter(c => c.status === 'published').length || 0,
      archived: stats?.filter(c => c.status === 'archived').length || 0,
    };

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);

    // Convert storage paths to public URLs
    const casesWithUrls = (cases || []).map(caseItem => {
      const transformed = { ...caseItem };
      
      // Convert admission_notice_url
      if (caseItem.admission_notice_url) {
        const { data: urlData } = supabase.storage
          .from('success-cases')
          .getPublicUrl(caseItem.admission_notice_url);
        transformed.admission_notice_url = urlData?.publicUrl || null;
      }
      
      // Convert student_photo_url
      if (caseItem.student_photo_url) {
        const { data: urlData } = supabase.storage
          .from('success-cases')
          .getPublicUrl(caseItem.student_photo_url);
        transformed.student_photo_url = urlData?.publicUrl || null;
      }
      
      // Convert jw202_url
      if (caseItem.jw202_url) {
        const { data: urlData } = supabase.storage
          .from('success-cases')
          .getPublicUrl(caseItem.jw202_url);
        transformed.jw202_url = urlData?.publicUrl || null;
      }
      
      return transformed;
    });

    return NextResponse.json({
      success_cases: casesWithUrls,
      stats: statsData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error in admin/success-cases GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/success-cases
 * Admin endpoint to create a new success case with file uploads
 * 
 * Body (multipart/form-data):
 * - student_name_en (required)
 * - student_name_cn
 * - university_name_en
 * - university_name_cn
 * - program_name_en
 * - program_name_cn
 * - description_en
 * - description_cn
 * - status (default: draft)
 * - is_featured (default: false)
 * - display_order (default: 0)
 * - admission_year
 * - intake
 * - student_photo (file)
 * - admission_notice (file)
 * - jw202 (file)
 */
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const formData = await request.formData();

    // Extract text fields
    const student_name_en = formData.get('student_name_en') as string;
    const student_name_cn = formData.get('student_name_cn') as string;
    const university_name_en = formData.get('university_name_en') as string;
    const university_name_cn = formData.get('university_name_cn') as string;
    const program_name_en = formData.get('program_name_en') as string;
    const program_name_cn = formData.get('program_name_cn') as string;
    const description_en = formData.get('description_en') as string;
    const description_cn = formData.get('description_cn') as string;
    const status = (formData.get('status') as string) || 'draft';
    const is_featured = formData.get('is_featured') === 'true';
    const display_order = parseInt(formData.get('display_order') as string) || 0;
    const admission_year = formData.get('admission_year') ? parseInt(formData.get('admission_year') as string) : null;
    const intake = formData.get('intake') as string;

    // Validate required fields
    if (!student_name_en) {
      return NextResponse.json(
        { error: 'Student name (English) is required' },
        { status: 400 }
      );
    }

    // Create the case first to get an ID
    const { data: newCase, error: createError } = await supabase
      .from('success_cases')
      .insert({
        student_name_en,
        student_name_cn,
        university_name_en,
        university_name_cn,
        program_name_en,
        program_name_cn,
        description_en,
        description_cn,
        status,
        is_featured,
        display_order,
        admission_year,
        intake,
      })
      .select()
      .single();

    if (createError || !newCase) {
      console.error('Error creating success case:', createError);
      return NextResponse.json(
        { error: 'Failed to create success case' },
        { status: 500 }
      );
    }

    const caseId = newCase.id;
    const uploadedFiles: string[] = [];

    // Handle file uploads
    const uploadFile = async (
      file: File,
      fieldName: string,
      caseId: string
    ): Promise<string | null> => {
      if (!file || file.size === 0) return null;

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File ${fieldName} exceeds 10MB limit`);
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type for ${fieldName}. Allowed: JPG, PNG, WebP, PDF`);
      }

      // Generate file path
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${caseId}/${fieldName}_${timestamp}_${sanitizedName}`;

      // Upload to Supabase Storage
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

      uploadedFiles.push(filePath);
      return filePath;
    };

    try {
      // Upload student photo
      const studentPhoto = formData.get('student_photo') as File;
      const student_photo_url = studentPhoto ? await uploadFile(studentPhoto, 'photo', caseId) : null;

      // Upload admission notice
      const admissionNotice = formData.get('admission_notice') as File;
      const admission_notice_url = admissionNotice ? await uploadFile(admissionNotice, 'admission_notice', caseId) : null;

      // Upload JW202
      const jw202 = formData.get('jw202') as File;
      const jw202_url = jw202 ? await uploadFile(jw202, 'jw202', caseId) : null;

      // Update the case with file URLs
      const { error: updateError } = await supabase
        .from('success_cases')
        .update({
          student_photo_url,
          admission_notice_url,
          jw202_url,
        })
        .eq('id', caseId);

      if (updateError) {
        console.error('Error updating case with file URLs:', updateError);
        // Try to clean up uploaded files
        if (uploadedFiles.length > 0) {
          await supabase.storage.from(STORAGE_BUCKET).remove(uploadedFiles);
        }
        return NextResponse.json(
          { error: 'Failed to update case with file URLs' },
          { status: 500 }
        );
      }

      // Fetch the complete case
      const { data: completeCase, error: fetchError } = await supabase
        .from('success_cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (fetchError) {
        console.error('Error fetching complete case:', fetchError);
        return NextResponse.json(
          { error: 'Success case created but failed to fetch details' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success_case: completeCase,
        message: 'Success case created successfully',
      });
    } catch (uploadError) {
      // If file upload fails, delete the created case
      await supabase.from('success_cases').delete().eq('id', caseId);
      
      // Try to clean up any uploaded files
      if (uploadedFiles.length > 0) {
        await supabase.storage.from(STORAGE_BUCKET).remove(uploadedFiles);
      }

      throw uploadError;
    }
  } catch (error) {
    console.error('Error in admin/success-cases POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
