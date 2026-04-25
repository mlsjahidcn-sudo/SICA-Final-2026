import { getSupabaseClient } from "@/storage/database/supabase-client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const tracking_code = searchParams.get("tracking_code");
    const email = searchParams.get("email");

    if (!tracking_code || !email) {
      return NextResponse.json(
        { error: "Tracking code and email are required" },
        { status: 400 }
      );
    }

    // Find the assessment application
    const { data: application, error } = await supabase
      .from("assessment_applications")
      .select(
        `
        *,
        documents:assessment_documents(*)
      `
      )
      .eq("tracking_code", tracking_code)
      .eq("email", email)
      .single();

    if (error || !application) {
      return NextResponse.json(
        { error: "Application not found. Please check your tracking code and email." },
        { status: 404 }
      );
    }

    // Get status history
    const { data: statusHistory } = await supabase
      .from("assessment_status_history")
      .select("*")
      .eq("assessment_id", application.id)
      .order("created_at", { ascending: true });

    // Get report if available
    let report = null;
    if (application.status === "completed") {
      const { data: reportData } = await supabase
        .from("assessment_reports")
        .select("*")
        .eq("assessment_id", application.id)
        .single();
      report = reportData;
    }

    return NextResponse.json({
      success: true,
      application: {
        ...application,
        submitted_at: application.created_at,
        status_history: (statusHistory || []).map((h: Record<string, unknown>) => ({
          ...h,
          old_status: h.old_status || null,
          new_status: h.new_status || h.status || null,
        })),
        report: report
          ? {
              ...report,
              report_content: (report as Record<string, unknown>).content || null,
              generated_at: (report as Record<string, unknown>).created_at || null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error tracking assessment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
