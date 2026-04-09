import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);

    const body = await request.json();
    const { topic, content = '' } = body;

    // Fetch existing published blog posts for internal linking
    const { data: existingPosts } = await supabase
      .from('blog_posts')
      .select('id, title_en, slug, excerpt_en')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(20);

    const postsForPrompt = (existingPosts || []).map(post => ({
      title: post.title_en,
      slug: post.slug,
      excerpt: post.excerpt_en,
    }));

    const systemPrompt = `You are an internal linking expert for a study abroad blog. Given a new blog post topic/content and a list of existing blog posts, suggest 3-5 relevant internal links.

For each suggested link, provide:
- post_slug: The slug of the existing post
- anchor_text: A natural, relevant anchor text to use
- reason: Why this link is relevant

Return the suggestions in JSON format:
{
  "suggestions": [
    {
      "post_slug": "slug-of-existing-post",
      "anchor_text": "natural anchor text",
      "reason": "why this link is relevant"
    }
  ]
}

Available posts for linking:
${JSON.stringify(postsForPrompt, null, 2)}`;

    const userPrompt = `Suggest internal links for a new blog post about: ${topic}\n\nPost content preview: ${content}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    // Use streaming to get the full response
    let fullContent = '';
    for await (const chunk of llmClient.stream(messages, {
      model: 'doubao-seed-2-0-lite-260215',
      temperature: 0.3,
    })) {
      if (chunk.content) {
        fullContent += chunk.content.toString();
      }
    }

    let suggestions = [];
    try {
      // Try to parse the JSON from the response
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        suggestions = parsed.suggestions || [];
      }
    } catch (e) {
      console.error('Error parsing link suggestions:', e);
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error in link suggestions API:', error);
    return NextResponse.json({ error: 'Internal server error', suggestions: [] }, { status: 500 });
  }
}
