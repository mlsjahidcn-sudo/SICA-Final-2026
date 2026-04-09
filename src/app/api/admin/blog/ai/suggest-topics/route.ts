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

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);
    const supabase = getSupabaseClient();

    // Get existing posts to avoid duplicates
    const { data: existingPosts } = await supabase
      .from('blog_posts')
      .select('title_en')
      .limit(20);

    const existingTitles = existingPosts?.map(p => p.title_en).join('\n') || '';

    const systemPrompt = `You are a content strategist for Study in China Academy, a study abroad consultancy helping international students study in China. Suggest 10 trending, relevant blog post topics that our audience will find valuable. 

Topics should cover areas like:
- Application process and tips
- Choosing universities and programs
- Student life in China
- Visa and immigration
- Scholarships and funding
- Chinese language learning
- Cultural adaptation
- Career opportunities after graduation

Return the topics as a JSON array of strings only, no other text.`;

    const userPrompt = `Suggest 10 blog post topics. Avoid these existing topics:\n${existingTitles}`;

    const response = await llmClient.invoke(
      [{ role: 'system' as const, content: systemPrompt }, { role: 'user' as const, content: userPrompt }],
      { model: 'doubao-seed-2-0-lite-260215', temperature: 0.9 }
    );

    // Try to parse JSON from response
    let topics;
    try {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      topics = jsonMatch ? JSON.parse(jsonMatch[0]) : [response.content.trim()];
    } catch {
      topics = [response.content.trim()];
    }

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('Error in topic suggestions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
