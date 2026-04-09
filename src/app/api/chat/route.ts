import { NextRequest } from 'next/server';
import { LLMClient, Config, KnowledgeClient, HeaderUtils } from 'coze-coding-dev-sdk';
import { getStructuredResponseInstructions } from '@/lib/chat-utils';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = getSupabaseClient();

// Chinese to English city/province mapping for better search
const CITY_MAPPING: Record<string, string> = {
  '北京': 'Beijing',
  '上海': 'Shanghai',
  '广州': 'Guangzhou',
  '深圳': 'Shenzhen',
  '杭州': 'Hangzhou',
  '成都': 'Chengdu',
  '武汉': 'Wuhan',
  '南京': 'Nanjing',
  '西安': "Xi'an",
  '天津': 'Tianjin',
  '重庆': 'Chongqing',
  '苏州': 'Suzhou',
  '青岛': 'Qingdao',
  '大连': 'Dalian',
  '厦门': 'Xiamen',
  '宁波': 'Ningbo',
  '长沙': 'Changsha',
  '哈尔滨': 'Harbin',
  '沈阳': 'Shenyang',
  '济南': 'Jinan',
  '浙江': 'Zhejiang',
  '江苏': 'Jiangsu',
  '广东': 'Guangdong',
  '四川': 'Sichuan',
  '湖北': 'Hubei',
  '山东': 'Shandong',
};

// Helper to expand search query with Chinese-English mappings
function expandSearchQuery(query: string): string[] {
  const terms = [query];
  
  // Check if query contains Chinese city/province names
  for (const [cn, en] of Object.entries(CITY_MAPPING)) {
    if (query.includes(cn)) {
      terms.push(en);
    }
    if (query.toLowerCase().includes(en.toLowerCase())) {
      terms.push(cn);
    }
  }
  
  return terms;
}

// System prompt for SICA AI Assistant
const SYSTEM_PROMPT = `You are SICA AI Assistant, a helpful chatbot for the Study In China Academy platform (SICA).

## Your Role
You help international students explore Chinese universities, understand programs, navigate scholarship opportunities, and guide them through the application process.

## Your Capabilities
1. **University Information**: Provide details about Chinese universities (rankings, locations, programs, tuition, facilities)
2. **Program Guidance**: Help students find suitable programs based on their interests and qualifications
3. **Scholarship Advice**: Explain scholarship types (CSC, provincial, university-specific) and eligibility
4. **Application Support**: Guide students through the application process and requirements
5. **General Q&A**: Answer questions about studying in China, visa requirements, student life, etc.

## Communication Style
- Be friendly, professional, and helpful
- Provide clear, concise answers
- Use **markdown formatting** for better readability
- Keep paragraphs short (2-3 sentences max)
- Offer to help with next steps
- Ask clarifying questions when needed

## Contact Information
- WhatsApp: +86 173 2576 4171 (for human support)

${getStructuredResponseInstructions()}

## CRITICAL RULES FOR RECOMMENDATIONS

1. **ONLY recommend universities/programs that appear in the "Available Universities" or "Available Programs" sections below**
2. **When you see university data with IDs, you MUST use the [UNI:id] marker** - this creates a clickable card for the user
3. **NEVER recommend universities or programs that are NOT in the provided database context**
4. **If no relevant data is found in the database, say so politely and offer to help find alternatives**

### Example Response with Cards:
When asked about universities in Hangzhou and you see this data:
[1] ID: abc-123
    Name: Zhejiang Normal University
    Location: Hangzhou, Zhejiang
    
Your response should be:
"Here are universities in Hangzhou available in our platform:

[UNI:abc-123]

This university offers excellent programs and is located in Hangzhou."

### WRONG (Do NOT do this):
"Here are universities in Hangzhou:
1. Zhejiang University - top ranked
2. Hangzhou Dianzi University"
(No markers used = no cards shown = bad user experience)

When answering questions, use any relevant context from the knowledge base to provide accurate and helpful information.`;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  useKnowledgeBase?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, useKnowledgeBase = true } = body;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract headers for forwarding
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // Initialize clients
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);
    const knowledgeClient = new KnowledgeClient(config, customHeaders);

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    
    // Search database for relevant universities and programs
    let databaseContext = '';
    if (lastUserMessage) {
      try {
        // Expand search query with Chinese-English mappings
        const searchTerms = expandSearchQuery(lastUserMessage.content);
        
        // Build OR conditions for all search terms
        const universityConditions = searchTerms.map(term => 
          `name_en.ilike.%${term}%,name_cn.ilike.%${term}%,city.ilike.%${term}%,province.ilike.%${term}%`
        ).join(',');
        
        const programConditions = searchTerms.map(term =>
          `name_en.ilike.%${term}%,name_cn.ilike.%${term}%,major.ilike.%${term}%`
        ).join(',');

        // Search universities
        const { data: universities } = await supabase
          .from('universities')
          .select('id, name_en, name_cn, city, province, ranking_national, type, student_count, logo_url')
          .or(universityConditions)
          .order('ranking_national', { ascending: true })
          .limit(5);

        // Search programs
        const { data: programs } = await supabase
          .from('programs')
          .select('id, name_en, name_cn, degree_type, major, teaching_language, duration_months, tuition_per_year, tuition_currency, scholarship_available, university_id, universities(name_en)')
          .or(programConditions)
          .limit(5);

        if (universities && universities.length > 0) {
          databaseContext += '\n\n## Available Universities (from database):\n';
          databaseContext += '**IMPORTANT: Use [UNI:id] markers when mentioning these universities!**\n\n';
          universities.forEach((uni, i) => {
            databaseContext += `[${i + 1}] ID: ${uni.id}\n`;
            databaseContext += `    Name: ${uni.name_en}${uni.name_cn ? ` (${uni.name_cn})` : ''}\n`;
            databaseContext += `    Location: ${uni.city}, ${uni.province}\n`;
            if (uni.ranking_national) databaseContext += `    Ranking: #${uni.ranking_national} in China\n`;
            if (uni.type) databaseContext += `    Type: ${uni.type}\n`;
            databaseContext += `    **MUST USE: [UNI:${uni.id}]**\n\n`;
          });
        }

        if (programs && programs.length > 0) {
          databaseContext += '\n## Available Programs (from database):\n';
          databaseContext += '**IMPORTANT: Use [PROG:id] markers when mentioning these programs!**\n\n';
          programs.forEach((prog, i) => {
            const uniData = prog.universities as unknown as Array<{ name_en: string }> | null;
            const uniName = uniData?.[0]?.name_en;
            databaseContext += `[${i + 1}] ID: ${prog.id}\n`;
            databaseContext += `    Name: ${prog.name_en}${prog.name_cn ? ` (${prog.name_cn})` : ''}\n`;
            if (uniName) databaseContext += `    University: ${uniName}\n`;
            if (prog.degree_type) databaseContext += `    Degree: ${prog.degree_type}\n`;
            if (prog.major) databaseContext += `    Major: ${prog.major}\n`;
            if (prog.teaching_language) databaseContext += `    Language: ${prog.teaching_language}\n`;
            if (prog.tuition_per_year) databaseContext += `    Tuition: ${prog.tuition_currency || 'CNY'} ${prog.tuition_per_year.toLocaleString()}/year\n`;
            if (prog.scholarship_available) databaseContext += `    Scholarship: Available\n`;
            databaseContext += `    **MUST USE: [PROG:${prog.id}]**\n\n`;
          });
        }
      } catch (error) {
        console.error('Database search error:', error);
        // Continue without database context
      }
    }
    
    // RAG: Search knowledge base for relevant context
    let knowledgeContext = '';
    if (useKnowledgeBase && lastUserMessage) {
      try {
        const searchResponse = await knowledgeClient.search(
          lastUserMessage.content,
          undefined, // Search all datasets
          3, // top 3 results
          0.5 // minimum score threshold
        );

        if (searchResponse.code === 0 && searchResponse.chunks.length > 0) {
          knowledgeContext = '\n\n## Relevant Knowledge Base Information:\n' +
            searchResponse.chunks.map((chunk, i) => 
              `[${i + 1}] ${chunk.content}`
            ).join('\n\n');
        }
      } catch (error) {
        console.error('Knowledge search error:', error);
        // Continue without knowledge context
      }
    }

    // Build messages for LLM
    const llmMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT + databaseContext + knowledgeContext },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ];

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const llmStream = llmClient.stream(llmMessages, {
            model: 'doubao-seed-2-0-lite-260215', // Balanced model for chat
            temperature: 0.7,
          });

          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              // Send SSE event
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
              );
            }
          }

          // Send done event
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
