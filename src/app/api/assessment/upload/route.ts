import { getSupabaseClient } from "@/storage/database/supabase-client";
import { S3Storage } from "coze-coding-dev-sdk";
import { NextRequest, NextResponse } from "next/server";

// Initialize S3 Storage
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const formData = await request.formData();

    const assessment_id = formData.get("assessment_id") as string;
    const document_type = formData.get("document_type") as string;
    const file = formData.get("file") as File;

    if (!assessment_id || !document_type || !file) {
      return NextResponse.json(
        { error: "Missing required fields: assessment_id, document_type, and file" },
        { status: 400 }
      );
    }

    // Verify the assessment exists
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessment_applications")
      .select("id, status")
      .eq("id", assessment_id)
      .single();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: "Assessment application not found" },
        { status: 404 }
      );
    }

    // Check if documents can still be uploaded (pending or document_request status)
    if (!["pending", "document_request"].includes(assessment.status)) {
      return NextResponse.json(
        { error: "Cannot upload documents for this application status" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Generate safe filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `assessments/${assessment_id}/${document_type}/${timestamp}_${safeName}`;

    // Upload to S3
    const fileKey = await storage.uploadFile({
      fileContent: fileBuffer,
      fileName,
      contentType: file.type,
    });

    // Create document record
    const { data: document, error: docError } = await supabase
      .from("assessment_documents")
      .insert({
        assessment_id,
        document_type,
        file_name: file.name,
        file_key: fileKey,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (docError) {
      console.error("Error creating document record:", docError);
      return NextResponse.json(
        { error: "Failed to save document record" },
        { status: 500 }
      );
    }

    // Generate signed URL for preview
    const previewUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 86400, // 24 hours
    });

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        preview_url: previewUrl,
      },
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve documents for an assessment
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const assessment_id = searchParams.get("assessment_id");

    if (!assessment_id) {
      return NextResponse.json(
        { error: "Assessment ID is required" },
        { status: 400 }
      );
    }

    // Get all documents for the assessment
    const { data: documents, error } = await supabase
      .from("assessment_documents")
      .select("*")
      .eq("assessment_id", assessment_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    // Generate signed URLs for each document
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc: { file_key: string }) => {
        const previewUrl = await storage.generatePresignedUrl({
          key: doc.file_key,
          expireTime: 86400,
        });
        return {
          ...doc,
          preview_url: previewUrl,
        };
      })
    );

    return NextResponse.json({
      success: true,
      documents: documentsWithUrls,
    });
  } catch (error) {
    console.error("Error in document GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
