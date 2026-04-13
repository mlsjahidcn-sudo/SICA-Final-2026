import { getSupabaseClient } from "@/storage/database/supabase-client";
import { invokeLLM, ChatMessage } from "@/lib/llm";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getAssessmentReportReadyTemplate } from "@/lib/email";

interface AssessmentData {
  id: string;
  tracking_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  whatsapp_number: string | null;
  country: string;
  date_of_birth: string | null;
  current_education_level: string | null;
  target_degree: string | null;
  target_major: string | null;
  gpa: string | null;
  preferred_universities: string | null;
  english_proficiency: string | null;
  english_score: string | null;
  budget_range: string | null;
  additional_notes: string | null;
  documents: Array<{
    document_type: string;
    file_name: string;
  }>;
}

// CSC-related scholarship types to exclude
const CSC_SCHOLARSHIP_TYPES = [
  'csc_type_a',
  'csc_type_b',
  'belt_and_road',
  'silk_road',
  'confucius',
  'mofcom'
];

interface UniversityData {
  id: string;
  name_en: string;
  name_cn: string;
  city: string;
  province: string;
  scholarship_available: boolean;
  scholarship_percentage: number | null;
  ranking_national: number | null;
  ranking_world: number | null;
}

interface ProgramData {
  id: string;
  name: string;
  degree_level: string;
  language: string;
  tuition_fee_per_year: number | null;
  currency: string | null;
  university_id: string;
  university_name: string;
}

interface ScholarshipData {
  id: string;
  name: string;
  type: string;
  coverage: string | null;
  amount: number | null;
  currency: string | null;
  eligibility_criteria: string | null;
  university_id: string | null;
  university_name: string | null;
}

/**
 * Fetch universities with scholarship opportunities
 */
async function fetchUniversitiesWithScholarships(supabase: ReturnType<typeof getSupabaseClient>): Promise<UniversityData[]> {
  const { data, error } = await supabase
    .from('universities')
    .select('id, name_en, name_cn, city, province, scholarship_available, scholarship_percentage, ranking_national, ranking_world')
    .eq('scholarship_available', true)
    .eq('is_active', true)
    .order('ranking_national', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error fetching universities:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch programs matching applicant's target degree
 */
async function fetchProgramsByDegree(
  supabase: ReturnType<typeof getSupabaseClient>,
  targetDegree: string | null
): Promise<ProgramData[]> {
  if (!targetDegree) {
    // Return general programs if no target degree specified
    const { data, error } = await supabase
      .from('programs')
      .select(`
        id,
        name,
        degree_level,
        language,
        tuition_fee_per_year,
        currency,
        university_id,
        universities!inner(name_en)
      `)
      .eq('is_active', true)
      .limit(15);

    if (error) {
      console.error('Error fetching programs:', error);
      return [];
    }

    return (data || []).map(p => ({
      ...p,
      university_name: Array.isArray(p.universities) ? (p.universities[0] as { name_en: string })?.name_en || '' : (p.universities as { name_en: string } | null)?.name_en || ''
    }));
  }

  // Map target degree to degree_level
  const degreeMap: Record<string, string[]> = {
    'Bachelor': ['Bachelor', 'Undergraduate', 'Bachelor\'s'],
    'Master': ['Master', 'Graduate', 'Master\'s', 'Masters'],
    'PhD': ['PhD', 'Doctorate', 'Doctoral'],
    'Doctor': ['PhD', 'Doctorate', 'Doctoral'],
  };

  const targetDegrees = degreeMap[targetDegree] || [targetDegree];

  const { data, error } = await supabase
    .from('programs')
    .select(`
      id,
      name,
      degree_level,
      language,
      tuition_fee_per_year,
      currency,
      university_id,
      universities!inner(name_en)
    `)
    .eq('is_active', true)
    .in('degree_level', targetDegrees)
    .limit(15);

  if (error) {
    console.error('Error fetching programs by degree:', error);
    return [];
  }

  return (data || []).map(p => ({
    ...p,
    university_name: Array.isArray(p.universities) ? (p.universities[0] as { name_en: string })?.name_en || '' : (p.universities as { name_en: string } | null)?.name_en || ''
  }));
}

/**
 * Fetch non-CSC scholarships
 */
async function fetchNonCSCScholarships(supabase: ReturnType<typeof getSupabaseClient>): Promise<ScholarshipData[]> {
  const { data, error } = await supabase
    .from('scholarships')
    .select(`
      id,
      name,
      type,
      coverage,
      amount,
      currency,
      eligibility_criteria,
      university_id,
      universities(name_en)
    `)
    .eq('is_active', true)
    .not('type', 'in', `(${CSC_SCHOLARSHIP_TYPES.map(t => `"${t}"`).join(',')})`)
    .limit(15);

  if (error) {
    console.error('Error fetching scholarships:', error);
    return [];
  }

  return (data || []).map(s => ({
    ...s,
    university_name: s.universities ? (Array.isArray(s.universities) ? (s.universities[0] as { name_en: string })?.name_en : (s.universities as { name_en: string }).name_en) : null
  }));
}

function buildReportPrompt(
  data: AssessmentData,
  universities: UniversityData[],
  programs: ProgramData[],
  scholarships: ScholarshipData[]
): string {
  // Build universities section
  const universitiesSection = universities.length > 0
    ? universities.map(u => 
        `- ${u.name_en} (${u.name_cn}) - ${u.city}, ${u.province}\n  ` +
        `  Scholarship Available: ${u.scholarship_available ? 'Yes' : 'No'}\n  ` +
        `  ${u.scholarship_percentage ? `Scholarship Coverage: Up to ${u.scholarship_percentage}%` : ''}\n  ` +
        `  ${u.ranking_national ? `National Ranking: #${u.ranking_national}` : ''}\n  ` +
        `  ${u.ranking_world ? `World Ranking: #${u.ranking_world}` : ''}`
      ).join('\n')
    : 'No university data available';

  // Build programs section
  const programsSection = programs.length > 0
    ? programs.map(p => 
        `- ${p.name}\n  ` +
        `  University: ${p.university_name}\n  ` +
        `  Degree Level: ${p.degree_level}\n  ` +
        `  Language: ${p.language}\n  ` +
        `  ${p.tuition_fee_per_year ? `Tuition: ${p.currency || 'CNY'} ${p.tuition_fee_per_year}/year` : 'Tuition: Contact university'}`
      ).join('\n')
    : 'No program data available';

  // Build scholarships section (excluding CSC)
  const scholarshipsSection = scholarships.length > 0
    ? scholarships.map(s => 
        `- ${s.name}\n  ` +
        `  ${s.university_name ? `University: ${s.university_name}` : 'Multiple Universities'}\n  ` +
        `  Type: ${s.type}\n  ` +
        `  ${s.coverage ? `Coverage: ${s.coverage}` : ''}\n  ` +
        `  ${s.amount ? `Amount: ${s.currency || 'CNY'} ${s.amount}` : ''}\n  ` +
        `  ${s.eligibility_criteria ? `Eligibility: ${s.eligibility_criteria}` : ''}`
      ).join('\n')
    : 'No scholarship data available';

  return `You are an expert education consultant for Study In China Academy (SICA), specializing in helping international students study in China. Generate a comprehensive evaluation report for the following applicant.

## Applicant Information

**Personal Details:**
- Name: ${data.full_name}
- Country: ${data.country}
- Email: ${data.email}
${data.phone ? `- Phone: ${data.phone}` : ""}
${data.whatsapp_number ? `- WhatsApp: ${data.whatsapp_number}` : ""}
${data.date_of_birth ? `- Date of Birth: ${data.date_of_birth}` : ""}

**Academic Background:**
- Current Education Level: ${data.current_education_level || "Not specified"}
- Target Degree: ${data.target_degree || "Not specified"}
- Target Major: ${data.target_major || "Not specified"}
- GPA: ${data.gpa || "Not specified"}
${data.preferred_universities ? `- Preferred Universities: ${data.preferred_universities}` : ""}

**Language Proficiency:**
- English Proficiency: ${data.english_proficiency || "Not specified"}
${data.english_score ? `- English Test Score: ${data.english_score}` : ""}

**Preferences:**
- Budget Range: ${data.budget_range || "Not specified"}

**Additional Notes:**
${data.additional_notes || "None provided"}

**Uploaded Documents:**
${data.documents && data.documents.length > 0 ? data.documents.map((d) => `- ${d.document_type}: ${d.file_name}`).join("\n") : "No documents uploaded"}

---

## Available Data from Our Database

### Universities with Scholarship Opportunities:
${universitiesSection}

### Relevant Programs:
${programsSection}

### Scholarship Opportunities (Non-CSC):
${scholarshipsSection}

---

## Generate a Report with the Following Sections:

### 1. Executive Summary (2-3 sentences)
Provide a brief overview of the applicant's profile and their suitability for studying in China.

### 2. Academic Profile Assessment
- Evaluate their current academic qualifications
- Identify strengths and areas for improvement
- Assess their readiness for the desired program level

### 3. Language Proficiency Analysis
- Evaluate their English proficiency level
- Recommend language preparation if needed
- Suggest suitable programs based on language abilities

### 4. Program Recommendations
Based on their profile AND the available programs data above, recommend 3-5 specific programs. For each program:
- University name (use actual data from our database above)
- Program name (use actual program names from our database)
- Why it fits the applicant
- Language of instruction
- Estimated tuition (use actual tuition data if available)
- Scholarship opportunities at that university

**IMPORTANT**: Recommend actual programs from the provided data, not generic suggestions.

### 5. Scholarship Eligibility Assessment
- Identify scholarship opportunities from the available scholarships data above (excludes CSC scholarships)
- Assess eligibility for university, provincial, city, and corporate scholarships
- Provide specific scholarship names and coverage details from our database
- Provide recommendations for improving scholarship chances

**IMPORTANT**: Do NOT recommend CSC (Chinese Government Scholarship) or related types (Belt and Road, Silk Road, Confucius Institute, MOFCOM). Focus on university, provincial, city, and corporate scholarships from our database.

### 6. Admission Requirements Checklist
List all required documents and preparations needed for application:
- Required documents
- Language test requirements
- Application deadlines
- Other prerequisites

### 7. Timeline & Next Steps
Provide a recommended timeline with:
- Application preparation period
- Application submission windows
- Visa processing time
- Pre-departure preparations

### 8. Estimated Costs
Provide a realistic cost breakdown including:
- Tuition fees range (use actual tuition data from recommended programs)
- Living expenses estimate
- Health insurance
- Other potential costs

### 9. Recommendations & Tips
Provide 5 practical tips for successful application and studying in China.

---

**Format the report in clean Markdown with clear headings, bullet points, and professional tone. Make it personalized and actionable. Use actual data from our database for recommendations.**`;
}

// POST - Generate AI report for an assessment
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    // Get assessment details
    const { data: assessment, error: fetchError } = await supabase
      .from("assessment_applications")
      .select(
        `
        *,
        documents:assessment_documents(document_type, file_name)
      `
      )
      .eq("id", id)
      .single();

    if (fetchError || !assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Check if report already exists
    const { data: existingReport } = await supabase
      .from("assessment_reports")
      .select("*")
      .eq("application_id", id)
      .single();

    if (existingReport) {
      return NextResponse.json({
        success: true,
        report: existingReport,
        message: "Report already exists",
      });
    }

    // Generate AI report
    // Fetch real data from database
    const [universities, programs, scholarships] = await Promise.all([
      fetchUniversitiesWithScholarships(supabase),
      fetchProgramsByDegree(supabase, assessment.target_degree),
      fetchNonCSCScholarships(supabase)
    ]);

    const prompt = buildReportPrompt(
      assessment as AssessmentData,
      universities,
      programs,
      scholarships
    );
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are an expert education consultant specializing in helping international students study in China. Generate detailed, personalized, and actionable evaluation reports based on actual database data provided.",
      },
      { role: "user", content: prompt },
    ];

    const reportContent = await invokeLLM(messages, { temperature: 0.7 });

    // Prepare structured data for JSONB fields
    const recommendedUniversities = universities.slice(0, 5).map(u => ({
      id: u.id,
      name: u.name_en,
      city: u.city,
      scholarship_available: u.scholarship_available,
      scholarship_percentage: u.scholarship_percentage,
      ranking_national: u.ranking_national
    }));

    const recommendedPrograms = programs.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      degree_level: p.degree_level,
      university: p.university_name,
      tuition: p.tuition_fee_per_year,
      currency: p.currency
    }));

    const scholarshipOpportunities = scholarships.slice(0, 5).map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      university: s.university_name,
      coverage: s.coverage,
      amount: s.amount,
      currency: s.currency
    }));

    // Save report to database with structured data
    const { data: report, error: reportError } = await supabase
      .from("assessment_reports")
      .insert({
        application_id: id,
        report_content: reportContent,
        recommended_universities: recommendedUniversities,
        recommended_programs: recommendedPrograms,
        scholarship_opportunities: scholarshipOpportunities,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (reportError) {
      console.error("Error saving report:", reportError);
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
    }

    // Update assessment status to report_ready
    const { error: updateError } = await supabase
      .from("assessment_applications")
      .update({ status: "report_ready", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating assessment status:", updateError);
    }

    // Add status history entry
    await supabase.from("assessment_status_history").insert({
      application_id: id,
      old_status: assessment.status,
      new_status: "report_ready",
      notes: "AI report generated and ready for review",
    });

    // Send report ready email notification
    const emailTemplate = getAssessmentReportReadyTemplate({
      studentName: assessment.full_name,
      studentEmail: assessment.email,
      trackingCode: assessment.tracking_code,
    });

    const emailResult = await sendEmail(emailTemplate);
    if (!emailResult.success) {
      console.error("Failed to send report ready email:", emailResult.error);
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
