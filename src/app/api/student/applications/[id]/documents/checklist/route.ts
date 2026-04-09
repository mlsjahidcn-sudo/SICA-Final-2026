import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// Required document types for different degree levels
const REQUIRED_DOCUMENTS_BY_DEGREE: Record<string, string[]> = {
  Bachelor: [
    'passport_copy',
    'high_school_diploma',
    'high_school_transcript',
    'hsk_certificate',
    'ielts_toefl_report',
    'passport_photo',
    'health_exam',
    'non_criminal_record',
    'financial_proof',
  ],
  Master: [
    'passport_copy',
    'bachelor_diploma',
    'bachelor_transcript',
    'hsk_certificate',
    'ielts_toefl_report',
    'passport_photo',
    'cv_resume',
    'study_plan',
    'recommendation_letter_1',
    'recommendation_letter_2',
    'health_exam',
    'non_criminal_record',
    'financial_proof',
  ],
  PhD: [
    'passport_copy',
    'master_diploma',
    'master_transcript',
    'bachelor_diploma',
    'bachelor_transcript',
    'hsk_certificate',
    'ielts_toefl_report',
    'passport_photo',
    'cv_resume',
    'study_plan',
    'recommendation_letter_1',
    'recommendation_letter_2',
    'research_proposal',
    'health_exam',
    'non_criminal_record',
    'financial_proof',
  ],
};

// Document type labels for display
export const DOCUMENT_TYPE_LABELS: Record<string, { en: string; zh: string; description: string }> = {
  passport_copy: { en: 'Passport Copy', zh: '护照复印件', description: 'Valid passport copy (first page)' },
  high_school_diploma: { en: 'High School Diploma (Notarized)', zh: '高中毕业证（公证）', description: 'High school graduation certificate with notarization' },
  high_school_transcript: { en: 'High School Transcript (Notarized)', zh: '高中成绩单（公证）', description: 'Academic transcript from high school with notarization' },
  bachelor_diploma: { en: 'Bachelor Diploma (Notarized)', zh: '学士学位证（公证）', description: 'Bachelor degree certificate with notarization' },
  bachelor_transcript: { en: 'Bachelor Transcript (Notarized)', zh: '本科成绩单（公证）', description: 'Academic transcript from bachelor studies with notarization' },
  master_diploma: { en: 'Master Diploma (Notarized)', zh: '硕士学位证（公证）', description: 'Master degree certificate with notarization' },
  master_transcript: { en: 'Master Transcript (Notarized)', zh: '硕士成绩单（公证）', description: 'Academic transcript from master studies with notarization' },
  hsk_certificate: { en: 'HSK Certificate', zh: 'HSK证书', description: 'Chinese proficiency test (HSK) certificate' },
  ielts_toefl_report: { en: 'IELTS/TOEFL Score Report', zh: '雅思/托福成绩单', description: 'English proficiency test score report' },
  language_certificate: { en: 'Language Certificate', zh: '语言证书', description: 'HSK, IELTS, TOEFL or other language test result' },
  passport_photo: { en: 'Passport-size Photos', zh: '证件照', description: 'Recent passport-size photos meeting Chinese visa requirements' },
  cv_resume: { en: 'CV/Resume', zh: '简历', description: 'Curriculum vitae or resume' },
  study_plan: { en: 'Study Plan', zh: '学习计划', description: 'Detailed study plan' },
  personal_statement_doc: { en: 'Personal Statement', zh: '个人陈述', description: 'Statement of purpose / motivation letter' },
  recommendation_letter_1: { en: 'Recommendation Letter 1', zh: '推荐信1', description: 'First academic recommendation letter' },
  recommendation_letter_2: { en: 'Recommendation Letter 2', zh: '推荐信2', description: 'Second academic recommendation letter' },
  recommendation: { en: 'Recommendation Letter', zh: '推荐信', description: 'Academic recommendation letter(s)' },
  research_proposal: { en: 'Research Proposal', zh: '研究计划', description: 'Detailed research proposal for PhD studies' },
  financial_proof: { en: 'Financial Proof', zh: '财力证明', description: 'Bank statement showing financial capability' },
  bank_statement: { en: 'Bank Statement', zh: '银行证明', description: 'Bank statement for financial guarantee' },
  sponsor_letter: { en: 'Sponsor Letter', zh: '资助信', description: 'Financial sponsor declaration letter' },
  health_exam: { en: 'Health Examination Form', zh: '体检表', description: 'Foreigner Physical Examination Form' },
  non_criminal_record: { en: 'Non-criminal Record', zh: '无犯罪记录', description: 'Police clearance certificate' },
  medical_exam: { en: 'Medical Exam Report', zh: '体检报告', description: 'Medical examination report' },
  police_clearance: { en: 'Police Clearance', zh: '无犯罪记录', description: 'Police clearance certificate' },
  other: { en: 'Other Document', zh: '其他文档', description: 'Additional supporting document' },
};

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
          name_en,
          degree_type
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
      .select('id, document_type, status, file_name, uploaded_at, verification_status')
      .eq('application_id', id);

    // Determine required documents based on degree type
    const degreeType = programData?.degree_type || 'Bachelor';
    const requiredTypes = REQUIRED_DOCUMENTS_BY_DEGREE[degreeType] || REQUIRED_DOCUMENTS_BY_DEGREE.Bachelor;

    // Build checklist
    const uploadedMap = new Map(
      (uploadedDocs || []).map(doc => [doc.document_type, doc])
    );

    const checklist = requiredTypes.map(docType => {
      const uploaded = uploadedMap.get(docType);
      const label = DOCUMENT_TYPE_LABELS[docType] || { 
        en: docType, 
        zh: docType, 
        description: '' 
      };

      return {
        document_type: docType,
        label_en: label.en,
        label_zh: label.zh,
        description: label.description,
        is_required: true,
        is_uploaded: !!uploaded,
        status: uploaded?.status || uploaded?.verification_status || 'not_uploaded',
        file_name: uploaded?.file_name || null,
        uploaded_at: uploaded?.uploaded_at || null,
        document_id: uploaded?.id || null,
      };
    });

    // Add any extra uploaded documents not in required list
    const extraDocs = (uploadedDocs || []).filter(
      doc => !requiredTypes.includes(doc.document_type)
    );

    const extraChecklist = extraDocs.map(doc => {
      const label = DOCUMENT_TYPE_LABELS[doc.document_type] || { 
        en: doc.document_type, 
        zh: doc.document_type, 
        description: '' 
      };

      return {
        document_type: doc.document_type,
        label_en: label.en,
        label_zh: label.zh,
        description: label.description,
        is_required: false,
        is_uploaded: true,
        status: doc.status || doc.verification_status || 'pending',
        file_name: doc.file_name,
        uploaded_at: doc.uploaded_at,
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
      degree_type: degreeType,
      program_name: programData?.name_en,
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
