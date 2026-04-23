import { getSupabaseClient } from "@/storage/database/supabase-client";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getAssessmentSubmittedTemplate } from "@/lib/email";

// Generate a unique tracking code
function generateTrackingCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SICA-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const {
      // Personal Information
      full_name,
      email,
      phone,
      whatsapp_number,
      country,
      date_of_birth,

      // Academic Information
      current_education_level,
      gpa,
      target_degree,
      target_major,
      preferred_universities,

      // Language Proficiency
      english_proficiency,
      english_score,

      // Study Plans
      budget_range,
      additional_notes,
    } = body;

    // Validate required fields
    if (!full_name || !email || !country) {
      return NextResponse.json(
        { error: "Missing required fields: full_name, email, and country are required" },
        { status: 400 }
      );
    }

    // Generate tracking code
    const tracking_code = generateTrackingCode();

    // Create assessment application
    const { data: application, error } = await supabase
      .from("assessment_applications")
      .insert({
        tracking_code,
        full_name,
        email,
        phone: phone || null,
        whatsapp_number: whatsapp_number || null,
        country,
        date_of_birth: date_of_birth || null,
        current_education_level: current_education_level || null,
        gpa: gpa || null,
        target_degree: target_degree || null,
        target_major: target_major || null,
        preferred_universities: preferred_universities || null,
        english_proficiency: english_proficiency || null,
        english_score: english_score || null,
        budget_range: budget_range || null,
        additional_notes: additional_notes || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating assessment application:", error);
      return NextResponse.json(
        { error: "Failed to submit application", details: error.message },
        { status: 500 }
      );
    }

    // Insert initial status history
    try {
      await supabase
        .from("assessment_status_history")
        .insert({
          assessment_id: application.id,
          new_status: "pending",
          status: "pending",
          notes: "Assessment application submitted",
        });
    } catch (historyError) {
      console.error("Error creating status history:", historyError);
      // Don't fail the request if status history fails
    }

    // Send confirmation email
    try {
      const emailPayload = getAssessmentSubmittedTemplate({
        studentName: full_name,
        studentEmail: email,
        trackingCode: tracking_code,
      });
      await sendEmail(emailPayload);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      tracking_code,
      application_id: application.id,
    });
  } catch (error) {
    console.error("Error in assessment apply:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
