import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';
import { 
  DOCUMENT_TYPES, 
  REQUIRED_DOCUMENTS_BY_DEGREE,
  getDocumentTypeLabel,
  getDocumentTypeDescription
} from '@/lib/document-types';

// GET /api/student/applications/[id]/documents/checklist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Get student record
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!studentRecord) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Get application with program info
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        programs (
          id,
          name,
          degree_level
        )
      `)
      .eq('id', id)
      .eq('student_id', studentRecord.id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Handle Supabase response - programs might be an array or object
    const programData = Array.isArray(application.programs) 
      ? application.programs[0] 
      : application.programs;

    // Get uploaded documents
    const { data: uploadedDocs } = await supabase
      .from('application_documents')
      .select('id, document_type, status, file_name, created_at, rejection_reason')
      .eq('application_id', id);

    // Determine required documents based on degree level (use degree_level, fallback to Bachelor)
    const degreeLevel = programData?.degree_level || 'Bachelor';
    const requiredTypes = REQUIRED_DOCUMENTS_BY_DEGREE[degreeLevel] || REQUIRED_DOCUMENTS_BY_DEGREE.Bachelor;

    // Build checklist
    const uploadedMap = new Map(
      (uploadedDocs || []).map(doc => [doc.document_type, doc])
    );

    const checklist = requiredTypes.map(docType => {
      const uploaded = uploadedMap.get(docType);
      const label = DOCUMENT_TYPES[docType] || { 
        en: docType, 
        zh: docType, 
        description: '' 
      };

      return {
        document_type: docType,
        label_en: getDocumentTypeLabel(docType, 'en'),
        label_zh: getDocumentTypeLabel(docType, 'zh'),
        description: getDocumentTypeDescription(docType),
        is_required: true,
        is_uploaded: !!uploaded,
        status: uploaded?.status || 'not_uploaded',
        file_name: uploaded?.file_name || null,
        uploaded_at: uploaded?.created_at || null,
        document_id: uploaded?.id || null,
      };
    });

    // Add any extra uploaded documents not in required list
    const extraDocs = (uploadedDocs || []).filter(
      doc => !requiredTypes.includes(doc.document_type)
    );

    const extraChecklist = extraDocs.map(doc => {
      const label = DOCUMENT_TYPES[doc.document_type] || { 
        en: doc.document_type, 
        zh: doc.document_type, 
        description: '' 
      };

      return {
        document_type: doc.document_type,
        label_en: getDocumentTypeLabel(doc.document_type, 'en'),
        label_zh: getDocumentTypeLabel(doc.document_type, 'zh'),
        description: getDocumentTypeDescription(doc.document_type),
        is_required: false,
        is_uploaded: true,
        status: doc.status || 'pending',
        file_name: doc.file_name,
        uploaded_at: doc.created_at,
        document_id: doc.id,
      };
    });

    // Calculate completion
    const totalRequired = checklist.length;
    const uploadedRequired = checklist.filter(item => item.is_uploaded).length;
    const verifiedRequired = checklist.filter(
      item => item.status === 'verified'
    ).length;
    const completionPercentage = totalRequired > 0 
      ? Math.round((uploadedRequired / totalRequired) * 100) 
      : 0;

    // Check if ready for submission
    const canSubmit = uploadedRequired === totalRequired && 
                      application.status === 'draft';

    return NextResponse.json({
      application_id: id,
      degree_level: degreeLevel,
      program_name: programData?.name,
      checklist: [...checklist, ...extraChecklist],
      summary: {
        total_required: totalRequired,
        uploaded_count: uploadedRequired,
        verified_count: verifiedRequired,
        missing_count: totalRequired - uploadedRequired,
        completion_percentage: completionPercentage,
        can_submit: canSubmit,
        missing_types: checklist
          .filter(item => !item.is_uploaded)
          .map(item => item.document_type),
      },
    });

  } catch (error) {
    console.error('Error in documents checklist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
