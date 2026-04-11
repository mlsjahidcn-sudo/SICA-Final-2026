import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { LLMClient } from 'coze-coding-dev-sdk';
import { retrieveRelevantContext, formatRAGContext } from '@/lib/chat/rag-pipeline';
import { verifyAuthToken } from '@/lib/auth-utils';

const SYSTEM_PROMPT = `You are the SICA AI Assistant — a friendly, knowledgeable advisor for the Study in China Academy platform. You help international students find the right universities and programs in China, answer questions about scholarships, application processes, visa requirements, and more.

## Key Guidelines
- Answer questions directly using the database information provided below.
- When recommending programs or universities, include: university name, program name, tuition, scholarship availability, language of instruction, and duration.
- If you find matching programs from the database results, present them clearly with bullet points.
- Be concise but thorough. Use bullet points for lists.
- Respond in the same language the user uses (English or Chinese).
- If you don't have enough information, say so honestly and suggest the user browse the platform for the latest details.
- Be encouraging and supportive.

## About the Platform
- 90+ universities and 700+ programs across China
- Programs from Bachelor's to PhD levels, plus non-degree language programs
- Chinese Government Scholarships (CSC) and university-specific scholarships available
- Application process: profile → program selection → document upload → submission → review → interview → admission
- Required documents: passport, diplomas, transcripts, language certificates, photos, recommendation letters, study plans, financial proofs

## Recommending Universities and Programs

When you recommend specific universities or programs from the database context, you MUST use special markers to display interactive cards:

**For Universities:**
- Format: [UNI:uuid]
- Example: I recommend [UNI:abc123-def456-789] which is excellent for engineering.

**For Programs:**
- Format: [PROG:uuid]
- Example: Check out [PROG:xyz789-abc123-def] for computer science.

**Important Rules:**
1. ONLY use markers when the Database Search Results section provides an ID
2. ALWAYS use the exact ID provided in the search results
3. Use ONE marker per recommendation, do NOT repeat the same marker
4. Provide helpful context around each recommendation
5. Do NOT make up IDs - only use IDs from the provided database context

**Example Response:**
"Based on your interest in studying in Beijing, I'd recommend:

1. [UNI:550e8400-e29b-41d4-a716-446655440000] - Tsinghua University, ranked #1 nationally with excellent engineering programs.

2. [UNI:6ba7b810-9dad-11d1-80b4-00c04fd430c8] - Peking University, known for humanities and sciences.

For computer science programs specifically:
- [PROG:123e4567-e89b-12d3-a456-426614174000] - BSc Computer Science at Tsinghua, taught in English with scholarship options."`;

// Intent detection keywords
const INTENT_KEYWORDS = {
  university: [
    'university', 'universities', 'college', 'colleges', 'school', 'schools',
    '大学', '学院', '高校', 'campus', 'campuses'
  ],
  program: [
    'program', 'programs', 'course', 'courses', 'degree', 'major', 'majors',
    '项目', '专业', '课程', '学位', 'bachelor', 'master', 'phd', 'doctorate',
    'mba', 'engineering', 'business', 'medicine', 'computer', 'language'
  ],
  scholarship: [
    'scholarship', 'scholarships', 'financial aid', 'funding', 'grant',
    '奖学金', '资助', 'csc', 'chinese government scholarship'
  ],
  location: [
    'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'chengdu', 'hangzhou',
    '北京', '上海', '广州', '深圳', '成都', '杭州', 'in china', 'city', 'cities',
    'province', 'location', 'where'
  ]
};

// Extract search keywords from user message
function extractKeywords(message: string): string[] {
  // Remove common stop words and extract meaningful keywords
  const stopWords = new Set(['i', 'want', 'need', 'looking', 'for', 'the', 'a', 'an', 'is', 'are', 'what', 'which', 'how', 'can', 'you', 'me', 'tell', 'about', 'show', 'find', 'list', 'give']);
  
  const words = message.toLowerCase()
    .replace(/[?!.,;:'"]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  return [...new Set(words)];
}

// Detect user intent
function detectIntent(message: string): { type: 'university' | 'program' | 'scholarship' | 'general'; keywords: string[] } {
  const lowerMessage = message.toLowerCase();
  const keywords = extractKeywords(message);
  
  // Check for university intent
  if (INTENT_KEYWORDS.university.some(kw => lowerMessage.includes(kw))) {
    return { type: 'university', keywords };
  }
  
  // Check for program intent
  if (INTENT_KEYWORDS.program.some(kw => lowerMessage.includes(kw))) {
    return { type: 'program', keywords };
  }
  
  // Check for scholarship intent
  if (INTENT_KEYWORDS.scholarship.some(kw => lowerMessage.includes(kw))) {
    return { type: 'scholarship', keywords };
  }
  
  return { type: 'general', keywords };
}

// Search universities based on keywords
async function searchUniversities(supabase: ReturnType<typeof getSupabaseClient>, keywords: string[], limit: number = 5) {
  if (keywords.length === 0) return [];
  
  try {
    // Build search query - search in name_en, name_cn, city, province
    const searchConditions = keywords
      .slice(0, 5)
      .map(kw => `name_en.ilike.%${kw}%,name_cn.ilike.%${kw}%,city.ilike.%${kw}%,province.ilike.%${kw}%`)
      .join(',');
    
    const { data, error } = await supabase
      .from('universities')
      .select(`
        id,
        name_en,
        name_cn,
        city,
        province,
        ranking_national,
        type,
        scholarship_available,
        tuition_min,
        tuition_max,
        tuition_currency
      `)
      .eq('is_active', true)
      .or(searchConditions)
      .order('ranking_national', { ascending: true, nullsFirst: false })
      .limit(limit);
    
    if (error) {
      console.error('University search error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('University search failed:', error);
    return [];
  }
}

// Search programs based on keywords
async function searchPrograms(
  supabase: ReturnType<typeof getSupabaseClient>, 
  keywords: string[], 
  filters: { degreeLevel?: string; scholarshipOnly?: boolean } = {},
  limit: number = 5
) {
  if (keywords.length === 0) return [];
  
  try {
    // Build search query
    const searchConditions = keywords
      .slice(0, 5)
      .map(kw => `name.ilike.%${kw}%,category.ilike.%${kw}%,sub_category.ilike.%${kw}%`)
      .join(',');
    
    let query = supabase
      .from('programs')
      .select(`
        id,
        name,
        category,
        sub_category,
        degree_level,
        language,
        duration_years,
        tuition_fee_per_year,
        currency,
        scholarship_available,
        universities(
          id,
          name_en,
          city
        )
      `)
      .eq('is_active', true)
      .or(searchConditions);
    
    // Apply filters
    if (filters.degreeLevel) {
      query = query.eq('degree_level', filters.degreeLevel);
    }
    if (filters.scholarshipOnly) {
      query = query.eq('scholarship_available', true);
    }
    
    const { data, error } = await query
      .order('scholarship_available', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Program search error:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Program search failed:', error);
    return [];
  }
}

// Format database results for LLM context with IDs
function formatDatabaseContext(
  universities: Array<Record<string, unknown>>,
  programs: Array<Record<string, unknown>>
): string {
  const parts: string[] = [];
  
  if (universities.length > 0) {
    parts.push('## Matching Universities (use [UNI:id] to recommend):');
    universities.forEach((uni) => {
      const types = Array.isArray(uni.type) ? uni.type.join(', ') : (uni.type || 'Standard');
      parts.push(
        `- **${uni.name_en}** [ID: ${uni.id}]` +
        `\n  - Chinese: ${uni.name_cn || 'N/A'}` +
        `\n  - Location: ${uni.city || 'N/A'}, ${uni.province || 'N/A'}` +
        `\n  - National Ranking: ${uni.ranking_national || 'N/A'}` +
        `\n  - Type: ${types}` +
        `\n  - Scholarship Available: ${uni.scholarship_available ? 'Yes' : 'No'}` +
        `\n  - Tuition Range: ${uni.tuition_min ? `${uni.tuition_min} - ${uni.tuition_max} ${uni.tuition_currency || 'CNY'}` : 'Contact us'}`
      );
    });
  }
  
  if (programs.length > 0) {
    parts.push('\n## Matching Programs (use [PROG:id] to recommend):');
    programs.forEach((prog) => {
      const uni = prog.universities as Record<string, unknown> | null;
      parts.push(
        `- **${prog.name}** [ID: ${prog.id}]` +
        `\n  - University: ${uni?.name_en || 'N/A'} (${uni?.city || 'N/A'})` +
        `\n  - Degree: ${prog.degree_level || 'N/A'}` +
        `\n  - Category: ${prog.category || 'N/A'}${prog.sub_category ? ` / ${prog.sub_category}` : ''}` +
        `\n  - Language: ${prog.language || 'N/A'}` +
        `\n  - Duration: ${prog.duration_years ? `${prog.duration_years} years` : 'N/A'}` +
        `\n  - Tuition: ${prog.tuition_fee_per_year ? `${prog.tuition_fee_per_year} ${prog.currency || 'CNY'}/year` : 'Contact us'}` +
        `\n  - Scholarship: ${prog.scholarship_available ? 'Yes ✓' : 'No'}`
      );
    });
  }
  
  return parts.length > 0 ? parts.join('\n') : '';
}

export async function POST(request: NextRequest) {
  try {
    // Auth is optional — public access allowed
    let userId: string | null = null;
    let userRole: string | null = null;
    try {
      const user = await verifyAuthToken(request);
      if (user) {
        userId = user.id;
        userRole = user.role;
      }
    } catch {
      // Not authenticated — fine for public access
    }

    const body = await request.json();
    const { message, session_id } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getSupabaseClient();
    let sessionId = session_id;
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    // For authenticated users, persist sessions
    if (userId) {
      if (!sessionId) {
        const { data: newSession, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: userId,
            title: message.slice(0, 60) + (message.length > 60 ? '...' : ''),
          })
          .select('id')
          .single();

        if (sessionError || !newSession) {
          console.error('Error creating chat session:', sessionError);
          return new Response(JSON.stringify({ error: 'Failed to create session' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        sessionId = newSession.id;
      }

      // Save user message
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        role: 'user',
        content: message,
      });

      // Fetch conversation history
      const { data: history } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(20);

      messages.push(
        ...(history || []).map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        }))
      );
    } else {
      // Anonymous user: use messages from request body
      messages.push(...(body.history || []));
      messages.push({ role: 'user', content: message });
    }

    // Detect user intent and extract keywords
    const intent = detectIntent(message);
    
    // Search database based on intent
    let universities: Array<Record<string, unknown>> = [];
    let programs: Array<Record<string, unknown>> = [];
    
    // Check for scholarship filter
    const scholarshipOnly = message.toLowerCase().includes('scholarship');
    
    // Check for degree level
    const lowerMessage = message.toLowerCase();
    let degreeLevel: string | undefined;
    if (lowerMessage.includes('bachelor') || lowerMessage.includes('undergraduate') || lowerMessage.includes('本科')) {
      degreeLevel = 'Bachelor';
    } else if (lowerMessage.includes('master') || lowerMessage.includes('graduate') || lowerMessage.includes('硕士')) {
      degreeLevel = 'Master';
    } else if (lowerMessage.includes('phd') || lowerMessage.includes('doctorate') || lowerMessage.includes('博士')) {
      degreeLevel = 'PhD';
    }

    // Run searches in parallel
    const [uniResults, progResults] = await Promise.all([
      searchUniversities(supabase, intent.keywords, 5),
      searchPrograms(supabase, intent.keywords, { degreeLevel, scholarshipOnly }, 5)
    ]);
    
    universities = uniResults;
    programs = progResults;

    // RAG: Retrieve relevant context from knowledge base
    let ragContext = '';
    try {
      const ragResults = await retrieveRelevantContext(message, {}, 5);
      ragContext = formatRAGContext(ragResults);
    } catch (error) {
      console.error('RAG retrieval failed (non-blocking):', error);
    }

    // Format database results with IDs
    const databaseContext = formatDatabaseContext(universities, programs);

    // Build user context
    const userContext = userId
      ? `\n## User Context\nAuthenticated user. Role: ${userRole || 'student'}.`
      : '\n## User Context\nAnonymous visitor.';

    // Build final system prompt
    const fullSystemPrompt = SYSTEM_PROMPT + '\n' + userContext +
      (databaseContext ? '\n\n## Database Search Results\n' + databaseContext : '') +
      (ragContext ? '\n\n' + ragContext : '');

    // Prepare LLM messages
    const llmMessages = [
      { role: 'system' as const, content: fullSystemPrompt },
      ...messages.slice(-16),
    ];

    // Initialize LLM client
    const client = new LLMClient();

    // Create SSE stream
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (sessionId) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'session', session_id: sessionId })}\n\n`)
            );
          }

          const llmStream = client.stream(llmMessages, {
            model: 'doubao-seed-2-0-lite-260215',
            temperature: 0.7,
          });

          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              fullResponse += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'content', content: text })}\n\n`)
              );
            }
          }

          // Save assistant response for authenticated users
          if (userId && sessionId) {
            await supabase.from('chat_messages').insert({
              session_id: sessionId,
              role: 'assistant',
              content: fullResponse,
            });
            await supabase
              .from('chat_sessions')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', sessionId);
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', session_id: sessionId })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Stream interrupted' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
