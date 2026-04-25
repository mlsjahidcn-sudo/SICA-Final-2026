import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { retrieveRelevantContext, formatRAGContext } from '@/lib/chat/rag-pipeline';
import { verifyAuthToken } from '@/lib/auth-utils';
import { streamLLM, ChatMessage } from '@/lib/llm';
import { apiCache, CACHE_TTL, withTimeout } from '@/lib/api-cache';
import { createRateLimitMiddleware } from '@/lib/rate-limit';
import { errors } from '@/lib/api-response';

// Rate limit: 10 messages per minute per IP/user
const chatRateLimit = createRateLimitMiddleware({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
});

const SYSTEM_PROMPT = `You are the SICA AI Assistant — a friendly, knowledgeable advisor for the Study in China Academy platform. You help international students find the right universities and programs in China, answer questions about scholarships, application processes, visa requirements, and more.

## Key Guidelines
- Answer questions conversationally and naturally
- Be concise but helpful. Use bullet points sparingly.
- Respond in the same language the user uses (English or Chinese).
- If you don't have enough information, say so honestly and suggest the user browse the platform.
- Be encouraging and supportive.

## About the Platform
- 90+ universities and 700+ programs across China
- Programs from Bachelor's to PhD levels, plus non-degree language programs
- Chinese Government Scholarships (CSC) and university-specific scholarships available
- Application process: profile → program selection → document upload → submission → review → interview → admission

## ⚠️ CRITICAL: MARKER FORMAT FOR UNIVERSITY AND PROGRAM CARDS

When the Database Search Results section shows matching universities or programs, you MUST use special markers to display interactive cards.

### Marker Format (MUST USE EXACTLY):
- For universities: [UNI:uuid]  (example: [UNI:d52e2c2a-4f07-48dd-9a12-0445e572bfbd])
- For programs: [PROG:uuid]     (example: [PROG:a1b2c3d4-e5f6-7890-abcd-ef1234567890])

### ⛔ DO NOT USE:
- Markdown links like [University Name](uuid) - WRONG!
- Copying the database details into your response - WRONG!
- Writing "Marker: [UNI:xxx]" - WRONG!

### ✅ CORRECT Usage Example:

User: "Show me universities in Beijing"

Database Search Results shows:
- Peking University, Marker: [UNI:d52e2c2a-4f07-48dd-9a12-0445e572bfbd], Ranking: 1
- Tsinghua University, Marker: [UNI:7f1ed02b-77bf-4a80-ad11-2a615fadcb0b], Ranking: 2

Your response should be:
"Here are the top universities in Beijing:

1. [UNI:d52e2c2a-4f07-48dd-9a12-0445e572bfbd] - China's #1 ranked university
2. [UNI:7f1ed02b-77bf-4a80-ad11-2a615fadcb0b] - Famous for engineering

Would you like to know about specific programs at these universities?"

### IMPORTANT Rules:
1. ALWAYS use [UNI:exact-uuid] format - NOT markdown links
2. Use the EXACT uuid from the Database Search Results
3. Include a brief comment after each marker
4. NEVER copy the full database details - just use the marker
5. The marker will automatically display a card with all the details`;

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

// Simple queries that don't need RAG
const SIMPLE_QUERY_PATTERNS = [
  /^(hi|hello|hey|你好|您好)/i,
  /^(thanks|thank you|谢谢)/i,
  /^(bye|goodbye|再见)/i,
  /^(how are you|你好吗)/i,
];

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

// Check if query is simple and doesn't need RAG
function isSimpleQuery(message: string): boolean {
  return SIMPLE_QUERY_PATTERNS.some(pattern => pattern.test(message.trim()));
}

// Search universities based on keywords (with caching)
async function searchUniversities(supabase: ReturnType<typeof getSupabaseClient>, keywords: string[], limit: number = 5) {
  if (keywords.length === 0) return [];
  
  // Check cache
  const cacheKey = `uni:${keywords.sort().join(',')}:${limit}`;
  const cached = apiCache.get(cacheKey) as Array<Record<string, unknown>> | null;
  if (cached) return cached;
  
  try {
    // Build search query - search in name_en, name_cn, city, province
    const searchConditions = keywords
      .slice(0, 3) // Reduced from 5 to 3 for faster queries
      .map(kw => `name_en.ilike.%${kw}%,name_cn.ilike.%${kw}%,city.ilike.%${kw}%`)
      .join(',');
    
    const queryPromise = supabase
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
    
    // Add timeout to prevent slow queries
    const { data, error } = await withTimeout(queryPromise, 2000, 'University search timeout');
    
    if (error) {
      console.error('[Chat] University search error:', error);
      return [];
    }
    
    const results = data || [];
    // Cache for 2 minutes
    apiCache.set(cacheKey, results, CACHE_TTL.MEDIUM);
    return results;
  } catch (error) {
    console.error('University search failed:', error);
    return [];
  }
}

// Search programs based on keywords (with caching)
async function searchPrograms(
  supabase: ReturnType<typeof getSupabaseClient>, 
  keywords: string[], 
  filters: { degreeLevel?: string; scholarshipOnly?: boolean } = {},
  limit: number = 5
) {
  if (keywords.length === 0) return [];
  
  // Check cache
  const cacheKey = `prog:${keywords.sort().join(',')}:${filters.degreeLevel || 'all'}:${filters.scholarshipOnly || false}:${limit}`;
  const cached = apiCache.get(cacheKey) as Array<Record<string, unknown>> | null;
  if (cached) return cached;
  
  try {
    // Build search query
    const searchConditions = keywords
      .slice(0, 3) // Reduced from 5 to 3
      .map(kw => `name.ilike.%${kw}%,category.ilike.%${kw}%`)
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
    
    const queryPromise = query
      .order('scholarship_available', { ascending: false })
      .limit(limit);
    
    // Add timeout
    const { data, error } = await withTimeout(queryPromise, 2000, 'Program search timeout');
    
    if (error) {
      console.error('Program search error:', error);
      return [];
    }
    
    const results = data || [];
    // Cache for 2 minutes
    apiCache.set(cacheKey, results, CACHE_TTL.MEDIUM);
    return results;
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
    parts.push('## Database Search Results - Universities\n\nINSERT THESE MARKERS IN YOUR RESPONSE to display university cards:\n');
    universities.forEach((uni) => {
      const types = Array.isArray(uni.type) ? uni.type.join(', ') : (uni.type || 'Standard');
      const id = String(uni.id);
      parts.push(
        `- ${uni.name_en}: Use [UNI:${id}] in your response\n` +
        `  Details: ${uni.city || 'N/A'}, Ranking #${uni.ranking_national || 'N/A'}, ${types}, Scholarship: ${uni.scholarship_available ? 'Yes' : 'No'}`
      );
    });
  }
  
  if (programs.length > 0) {
    parts.push('\n## Database Search Results - Programs\n\nINSERT THESE MARKERS IN YOUR RESPONSE to display program cards:\n');
    programs.forEach((prog) => {
      const uni = prog.universities as Record<string, unknown> | null;
      const id = String(prog.id);
      parts.push(
        `- ${prog.name}: Use [PROG:${id}] in your response\n` +
        `  Details: ${uni?.name_en || 'N/A'}, ${prog.degree_level || 'N/A'}, ${prog.language || 'N/A'}, Scholarship: ${prog.scholarship_available ? 'Yes' : 'No'}`
      );
    });
  }
  
  return parts.length > 0 ? parts.join('\n') : '';
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = chatRateLimit(request);
    if (!rateLimitResult.allowed) {
      return errors.rateLimit(rateLimitResult.resetTime);
    }

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
    const isSimple = isSimpleQuery(message);
    
    // Initialize results
    let universities: Array<Record<string, unknown>> = [];
    let programs: Array<Record<string, unknown>> = [];
    let ragContext = '';
    
    // Skip database search for simple queries (greetings, thanks, etc.)
    if (!isSimple) {
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

      // Run database searches in parallel with timeout
      try {
        const [uniResults, progResults] = await Promise.all([
          searchUniversities(supabase, intent.keywords, 3),
          searchPrograms(supabase, intent.keywords, { degreeLevel, scholarshipOnly }, 3)
        ]);
        
        universities = uniResults;
        programs = progResults;
      } catch (error) {
        console.error('Database search failed:', error);
      }

      // RAG: Only for complex queries, skip for simple ones (with timeout and cache)
      if (intent.type !== 'general' && universities.length === 0 && programs.length === 0) {
        try {
          // Cache key for RAG results
          const ragCacheKey = `rag:${message.slice(0, 100)}`;
          const cachedRAG = apiCache.get(ragCacheKey) as string | null;
          
          if (cachedRAG) {
            ragContext = cachedRAG;
          } else {
            // Run RAG with timeout (2 seconds max)
            const ragResults = await withTimeout(
              retrieveRelevantContext(message, {}, 3),
              2000,
              'RAG timeout'
            );
            ragContext = formatRAGContext(ragResults);
            // Cache for 2 minutes
            apiCache.set(ragCacheKey, ragContext, CACHE_TTL.MEDIUM);
          }
        } catch (error) {
          console.error('RAG retrieval failed (non-blocking):', error);
        }
      }
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
    const llmMessages: ChatMessage[] = [
      { role: 'system', content: fullSystemPrompt },
      ...messages.slice(-16).map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

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

          // Stream from Moonshot API
          for await (const chunk of streamLLM(llmMessages, { temperature: 0.7 })) {
            fullResponse += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`)
            );
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
