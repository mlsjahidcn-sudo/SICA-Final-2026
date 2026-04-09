import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { verifyAuthToken } from '@/lib/auth-utils';

const SYSTEM_PROMPT = `You are the SICA AI Assistant — a knowledgeable, friendly, and professional advisor for the Study in China Academy platform. You help students, partners, and administrators with questions about studying in China.

## Your Role
- Help students find suitable universities and programs in China
- Guide students through the application process and document requirements
- Assist partners with referral and application management
- Help administrators with platform data and insights
- Provide accurate information about Chinese universities, programs, scholarships, and visa processes

## Key Guidelines
1. Be concise but thorough. Use bullet points for lists.
2. When mentioning specific universities or programs, provide names clearly.
3. If you're unsure about specific data (tuition, deadlines), acknowledge it and suggest the user check the platform for the latest information.
4. Always be encouraging and supportive, especially for students who may feel overwhelmed.
5. Respond in the same language the user uses (English or Chinese).
6. For application status inquiries, direct users to check their dashboard.
7. Never share personal/sensitive data about other users.

## Platform Information
- Students can browse 90+ universities and 700+ programs across China
- Programs range from Bachelor's to PhD levels
- Many programs offer Chinese Government Scholarships (CSC) and university-specific scholarships
- The application process involves: profile creation → program selection → document upload → submission → review → interview → admission decision
- Required documents typically include: passport, diplomas, transcripts, language certificates, photos, recommendation letters, study plans, and financial proofs

## Common Questions You Can Help With
- University recommendations based on field of study, location, budget
- Program comparisons (tuition, duration, language of instruction)
- Scholarship opportunities and eligibility
- Application document checklists
- Visa and accommodation information
- Timeline and deadline guidance`;

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuthToken(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
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

    // Get or create chat session
    let sessionId = session_id;
    if (!sessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
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

    // Fetch conversation history (last 20 messages for context)
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Fetch user context for personalized responses
    const userContext = await buildUserContext(supabase, user.id, user.role);

    // Build messages for LLM
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT + '\n\n' + userContext },
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    // Initialize LLM client
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const client = new LLMClient(config, customHeaders);

    // Create SSE stream
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send session_id first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'session', session_id: sessionId })}\n\n`)
          );

          const llmStream = client.stream(messages, {
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

          // Save assistant response to database
          await supabase.from('chat_messages').insert({
            session_id: sessionId,
            role: 'assistant',
            content: fullResponse,
          });

          // Update session timestamp
          await supabase
            .from('chat_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', sessionId);

          // Send done signal
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', session_id: sessionId })}\n\n`)
          );

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', error: 'Stream interrupted' })}\n\n`
            )
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

async function buildUserContext(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  role: string
): Promise<string> {
  const parts: string[] = [];

  try {
    if (role === 'student') {
      // Get student's active applications count
      const { count: appCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('students.user_id', userId);

      if (appCount !== null) {
        parts.push(`The student has ${appCount} application(s).`);
      }
    } else if (role === 'partner') {
      const { count: referralCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true });

      if (referralCount !== null) {
        parts.push(`The platform has ${referralCount} total application(s).`);
      }
    }
  } catch {
    // Context building failure shouldn't block chat
  }

  if (parts.length > 0) {
    return `\n## Current User Context\nUser role: ${role}\n${parts.join('\n')}`;
  }

  return `\n## Current User Context\nUser role: ${role}`;
}
