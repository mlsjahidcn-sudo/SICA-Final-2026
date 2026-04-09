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
- Required documents: passport, diplomas, transcripts, language certificates, photos, recommendation letters, study plans, financial proofs`;

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

    // RAG: Retrieve relevant context from knowledge base
    let ragContext = '';
    try {
      const ragResults = await retrieveRelevantContext(message, {}, 5);
      ragContext = formatRAGContext(ragResults);
    } catch (error) {
      console.error('RAG retrieval failed (non-blocking):', error);
    }

    // Also do a live DB query for program suggestions when the query mentions specific fields
    let liveProgramContext = '';
    try {
      const { data: programs } = await supabase
        .from('programs')
        .select('id, name, degree_level, category, sub_category, language, duration_years, tuition_fee_per_year, currency, scholarship_available, description_en, universities(id, name_en, city)')
        .eq('is_active', true)
        .or(`name.ilike.%${message.slice(0, 50)}%,category.ilike.%${message.slice(0, 50)}%,sub_category.ilike.%${message.slice(0, 50)}%,description_en.ilike.%${message.slice(0, 50)}%`)
        .limit(5);

      if (programs && programs.length > 0) {
        liveProgramContext = '\n\n## Live Database Matches\n' +
          programs.map((p: Record<string, unknown>) => {
            const uni = Array.isArray(p.universities) ? p.universities[0] : p.universities as Record<string, unknown> | null;
            return `- **${p.name as string}** at ${uni?.name_en as string || 'N/A'} (${uni?.city as string || ''}). ${p.degree_level as string}, ${p.language as string}, Tuition: ${p.tuition_fee_per_year ? Number(p.tuition_fee_per_year).toLocaleString() + ' ' + (p.currency as string || 'CNY') + '/yr' : 'Contact us'}. Scholarship: ${(p.scholarship_available as boolean) ? 'Yes' : 'No'}.`;
          }).join('\n');
      }
    } catch (error) {
      console.error('Live program query failed (non-blocking):', error);
    }

    // Build user context
    const userContext = userId
      ? `\n## User Context\nAuthenticated user. Role: ${userRole || 'student'}.`
      : '\n## User Context\nAnonymous visitor.';

    // Build final system prompt
    const fullSystemPrompt = SYSTEM_PROMPT + '\n' + userContext +
      (ragContext ? '\n\n' + ragContext : '') +
      (liveProgramContext ? '\n' + liveProgramContext : '');

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
