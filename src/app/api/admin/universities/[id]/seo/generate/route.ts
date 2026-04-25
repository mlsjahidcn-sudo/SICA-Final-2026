import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { invokeLLM, ChatMessage } from '@/lib/llm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    // Use anon key client for auth verification
    const supabaseAuth = getSupabaseClient(token);
    
    // Verify user token
    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Use service role key client for database operations (bypasses RLS)
    const supabase = getSupabaseClient();
    
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get university data
    const { data: university, error: fetchError } = await supabase
      .from('universities')
      .select('id, name_en, name_cn, province, city, type, category, description, ranking_national, ranking_world')
      .eq('id', id)
      .single();

    if (fetchError || !university) {
      return NextResponse.json(
        { error: 'University not found' },
        { status: 404 }
      );
    }

    const currentYear = new Date().getFullYear();

    const systemPrompt = `You are an SEO expert specializing in educational content and Chinese universities. Generate SEO-optimized content for a university profile page.

Return your response ONLY as a valid JSON object with the following structure, no extra text:
{
  "meta_title": "SEO-optimized title (50-60 characters, format: 'Study at [University Name] | Study In China ${currentYear} | SICA')",
  "meta_description": "Compelling meta description (150-160 characters) that includes: university name, location, key features, and 'Study in China'. Make it engaging for prospective international students.",
  "meta_keywords": "keyword1, keyword2, keyword3, ... (8-12 relevant SEO keywords, comma-separated string)",
  "tags": "tag1, tag2, tag3, ... (5-8 relevant tags for categorization, comma-separated string)"
}

Guidelines:
- meta_title: Include university name, "Study in China", and year
- meta_description: Make it compelling for search engines and students, include key selling points
- meta_keywords: Include: university name, city name, "study in China", "Chinese university", "international students", scholarship-related terms, degree types
- tags: Focus on: university type (985/211), location, specialization areas, program types

Return ONLY the JSON, no other text or markdown.`;

    // Build context from university data
    const universityContext = `
University Name: ${university.name_en}
Chinese Name: ${university.name_cn || 'N/A'}
Location: ${university.city}, ${university.province}
Type: ${university.type && university.type.length > 0 ? university.type.join(', ') : 'N/A'}
Category: ${university.category || 'N/A'}
National Ranking: ${university.ranking_national || 'N/A'}
World Ranking: ${university.ranking_world || 'N/A'}
Description: ${university.description || 'No description available'}
    `.trim();

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `Generate SEO content for this university:\n\n${universityContext}` 
      },
    ];

    const response = await invokeLLM(messages, { temperature: 0.5 });

    // Parse the JSON response
    let seoData;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        seoData = JSON.parse(jsonMatch[0]);
      } else {
        seoData = JSON.parse(response);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response', rawResponse: response },
        { status: 500 }
      );
    }

    // Ensure meta_keywords and tags are strings
    if (Array.isArray(seoData.meta_keywords)) {
      seoData.meta_keywords = seoData.meta_keywords.join(', ');
    }
    if (Array.isArray(seoData.tags)) {
      seoData.tags = seoData.tags.join(', ');
    }

    // Generate default meta_title if not provided
    if (!seoData.meta_title) {
      seoData.meta_title = `Study at ${university.name_en} | Study In China ${currentYear} | SICA`;
    }

    return NextResponse.json({ seo: seoData });
  } catch (error) {
    console.error('Error generating SEO:', error);
    return NextResponse.json(
      { error: 'Failed to generate SEO content' },
      { status: 500 }
    );
  }
}
