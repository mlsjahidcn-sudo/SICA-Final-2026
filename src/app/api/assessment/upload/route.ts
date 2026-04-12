import { getSupabaseClient } from "@/storage/database/supabase-client";
import { NextRequest, NextResponse } from "next/server";

const STORAGE_BUCKET = "documents";

// Allowed document types and their MIME types
const ALLOWED_DOCUMENT_TYPES: Record<string, { label: string; mimeTypes: string[] }> = {
  passport: { label: "Passport", mimeTypes: ["application/pdf", "image/jpeg", "image/png"] },
  diploma: { label: "Diploma", mimeTypes: ["application/pdf", "image/jpeg", "image/png"] },
  transcript: { label: "Academic Transcript", mimeTypes: ["application/pdf", "image/jpeg", "image/png"] },
  language_certificate: { label: "Language Certificate", mimeTypes: ["application/pdf", "image/jpeg", "image/png"] },
  photo: { label: "Passport Photo", mimeTypes: ["image/jpeg", "image/png"] },
  recommendation: { label: "Recommendation Letter", mimeTypes: ["application/pdf"] },
  cv: { label: "CV/Resume", mimeTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
  study_plan: { label: "Study Plan", mimeTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
  financial_proof: { label: "Financial Proof", mimeTypes: ["application/pdf", "image/jpeg", "image/png"] },
  other: { label: "Other Document", mimeTypes: ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const formData = await request.formData();

    const assessment_id = formData.get("assessment_id") as string;
    const document_type = formData.get("document_type") as string;
    const file = formData.get("file") as File;

    console.log("Assessment document upload - assessment_id:", assessment_id, "document_type:", document_type, "file:", file ? `${file.name} (${file.size} bytes, ${file.type})` : "missing");

    if (!assessment_id || !document_type || !file) {
      return NextResponse.json(
        { error: "Missing required fields: assessment_id, document_type, and file" },
        { status: 400 }
      );
    }

    // Validate document type
    if (!ALLOWED_DOCUMENT_TYPES[document_type]) {
      return NextResponse.json(
        { error: "Invalid document type", allowed_types: Object.keys(ALLOWED_DOCUMENT_TYPES) },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedMimeTypes = ALLOWED_DOCUMENT_TYPES[document_type].mimeTypes;
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type for ${ALLOWED_DOCUMENT_TYPES[document_type].label}. Allowed: ${allowedMimeTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
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

    // Check if document already exists for this type (to replace it)
    // Note: The database table uses 'application_id' as the foreign key column
    const { data: existingDoc } = await supabase
      .from("assessment_documents")
      .select("id, file_key")
      .eq("application_id", assessment_id)
      .eq("document_type", document_type)
      .maybeSingle();

    // If replacing, delete old file from storage
    if (existingDoc?.file_key) {
      try {
        await supabase.storage.from(STORAGE_BUCKET).remove([existingDoc.file_key]);
      } catch {
        // Ignore deletion errors
      }
    }

    // Generate file path in Supabase Storage
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `assessments/${assessment_id}/${document_type}_${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading to Supabase Storage:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file", details: uploadError.message },
        { status: 500 }
      );
    }

    // Generate signed URL for preview
    let previewUrl = "";
    const { data: signedUrlData } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 86400); // 24 hours

    if (signedUrlData?.signedUrl) {
      previewUrl = signedUrlData.signedUrl;
    } else {
      const { data: urlData } = supabase
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);
      previewUrl = urlData?.publicUrl || "";
    }

    // Create or update document record
    // Note: The database table uses 'application_id' as the foreign key column
    // Actual table columns: id, application_id, document_type, file_name, file_url, file_key, file_size, mime_type, created_at, uploaded_at
    const docRecord = {
      application_id: assessment_id, // Map assessment_id to application_id for DB
      document_type,
      file_name: file.name,
      file_key: filePath,
      file_url: previewUrl,
      file_size: file.size,
      mime_type: file.type,
      uploaded_at: new Date().toISOString(),
    };

    let result;
    if (existingDoc?.id) {
      // Update existing record
      const { data, error } = await supabase
        .from("assessment_documents")
        .update(docRecord)
        .eq("id", existingDoc.id)
        .select()
        .single();
      result = { data, error };
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from("assessment_documents")
        .insert(docRecord)
        .select()
        .single();
      result = { data, error };
    }

    if (result.error) {
      console.error("Error creating document record:", result.error);
      // Try to clean up uploaded file
      try {
        await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      } catch {
        // Ignore cleanup errors
      }
      return NextResponse.json(
        { error: "Failed to save document record", details: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: {
        ...result.data,
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
    // Note: The database table uses 'application_id' as the foreign key column
    const { data: documents, error } = await supabase
      .from("assessment_documents")
      .select("*")
      .eq("application_id", assessment_id)
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
      (documents || []).map(async (doc) => {
        if (doc.file_key) {
          const { data: signedUrlData } = await supabase
            .storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(doc.file_key, 86400);

          if (signedUrlData?.signedUrl) {
            return { ...doc, preview_url: signedUrlData.signedUrl };
          }
        }
        return { ...doc, preview_url: doc.file_url };
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
