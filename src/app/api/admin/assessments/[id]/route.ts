import { getSupabaseClient } from "@/storage/database/supabase-client";
import { S3Storage } from "coze-coding-dev-sdk";
import { NextRequest, NextResponse } from "next/server";

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

// GET - Get assessment details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    // Get assessment with documents
    const { data: assessment, error } = await supabase
      .from("assessment_applications")
      .select(
        `
        *,
        documents:assessment_documents(*)
      `
      )
      .eq("id", id)
      .single();

    if (error || !assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Get status history
    const { data: statusHistory } = await supabase
      .from("assessment_status_history")
      .select("*")
      .eq("application_id", id)
      .order("created_at", { ascending: true });

    // Get report if exists
    const { data: report } = await supabase
      .from("assessment_reports")
      .select("*")
      .eq("application_id", id)
      .single();

    // Generate signed URLs for documents
    const documentsWithUrls = await Promise.all(
      (assessment.documents || []).map(async (doc: { file_url: string; id: string; document_type: string; file_name: string }) => {
        // file_url is already a signed URL from S3, no need to regenerate
        return { ...doc, preview_url: doc.file_url };
      })
    );

    return NextResponse.json({
      success: true,
      assessment: {
        ...assessment,
        documents: documentsWithUrls,
        status_history: statusHistory || [],
        report: report || null,
      },
    });
  } catch (error) {
    console.error("Error fetching assessment details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update assessment status
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const { status, admin_notes } = body;

    // Get current assessment
    const { data: current, error: fetchError } = await supabase
      .from("assessment_applications")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Update assessment
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

    const { error: updateError } = await supabase
      .from("assessment_applications")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("Error updating assessment:", updateError);
      return NextResponse.json({ error: "Failed to update assessment" }, { status: 500 });
    }

    // Create status history entry if status changed
    if (status && status !== current.status) {
      await supabase.from("assessment_status_history").insert({
        application_id: id,
        old_status: current.status,
        new_status: status,
        changed_by: null, // TODO: Add admin user ID when auth is available
        notes: admin_notes || `Status changed from ${current.status} to ${status}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating assessment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete assessment (soft delete by setting status to cancelled)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from("assessment_applications")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error deleting assessment:", error);
      return NextResponse.json({ error: "Failed to delete assessment" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assessment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
