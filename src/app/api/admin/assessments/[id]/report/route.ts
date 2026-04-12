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

function buildReportPrompt(data: AssessmentData): string {
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
Based on their profile, recommend 3-5 suitable programs in China. For each program:
- University name
- Program name
- Why it fits the applicant
- Language of instruction
- Estimated tuition range
- Scholarship opportunities

### 5. Scholarship Eligibility Assessment
- Assess their eligibility for Chinese government scholarships (CGS)
- Identify other scholarship opportunities
- Provide recommendations for improving scholarship chances

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
- Tuition fees range
- Living expenses estimate
- Health insurance
- Other potential costs

### 9. Recommendations & Tips
Provide 5 practical tips for successful application and studying in China.

---

**Format the report in clean Markdown with clear headings, bullet points, and professional tone. Make it personalized and actionable.**`;
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
    const prompt = buildReportPrompt(assessment as AssessmentData);
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are an expert education consultant specializing in helping international students study in China. Generate detailed, personalized, and actionable evaluation reports.",
      },
      { role: "user", content: prompt },
    ];

    const reportContent = await invokeLLM(messages, { temperature: 0.7 });

    // Save report to database (store content directly, no file upload needed)
    const { data: report, error: reportError } = await supabase
      .from("assessment_reports")
      .insert({
        application_id: id,
        report_content: reportContent,
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
