import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth-utils';
import { streamLLM, ChatMessage } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await request.json();
    const {
      prompt,
      type = 'content', // 'title', 'excerpt', 'content', 'outline', 'seo_title', 'seo_description', 'tags', 'full_content'
      existingContent = '',
      topic = '',
    } = body;

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'title':
        systemPrompt = 'You are a professional blog title writer for a study abroad consultancy focused on studying in China. Write catchy, SEO-friendly titles that are 50-60 characters long.';
        userPrompt = `Generate 5 catchy blog titles about: ${topic || prompt}`;
        break;
      case 'excerpt':
        systemPrompt = 'You are a professional blog excerpt writer. Write compelling, 150-160 character meta descriptions that summarize the blog post and encourage clicks.';
        userPrompt = `Write an excerpt for a blog post about: ${topic || prompt}\n\nContent: ${existingContent}`;
        break;
      case 'outline':
        systemPrompt = 'You are a professional blog outline creator for a study abroad consultancy. Create detailed, structured outlines with clear sections and subsections.';
        userPrompt = `Create a detailed blog outline about: ${topic || prompt}`;
        break;
      case 'seo_title':
        systemPrompt = 'You are an SEO expert. Write SEO-optimized titles (under 60 characters) that include relevant keywords about studying in China.';
        userPrompt = `Generate an SEO title for a blog post about: ${topic || prompt}\n\nContent: ${existingContent}`;
        break;
      case 'seo_description':
        systemPrompt = 'You are an SEO expert. Write compelling meta descriptions (150-160 characters) that include relevant keywords and encourage click-throughs.';
        userPrompt = `Generate a meta description for a blog post about: ${topic || prompt}\n\nContent: ${existingContent}`;
        break;
      case 'tags':
        systemPrompt = 'You are a keyword research expert. Suggest 5-10 relevant tags/keywords for a blog post about studying in China. Focus on long-tail keywords with good search intent.';
        userPrompt = `Suggest relevant tags for a blog post about: ${topic || prompt}\n\nContent: ${existingContent}`;
        break;
      case 'full_content':
        systemPrompt = `You are a professional content writer and SEO expert for Study in China Academy, a study abroad consultancy helping international students study in China. 

CRITICAL INSTRUCTIONS:
- OUTPUT ONLY A SINGLE VALID JSON OBJECT. NO OTHER TEXT, NO EXPLANATIONS, NO MARKDOWN CODE FENCES.
- The JSON must start with { and end with }
- Do not include any text before the { or after the }
- Do not wrap the JSON in triple backticks (markdown code fences)

When given a topic, generate a complete blog post package in JSON format with the following structure:
{
  "title_en": "Catchy SEO-optimized English title (50-60 chars)",
  "title_cn": "Chinese translation of title",
  "slug": "seo-friendly-url-slug",
  "excerpt_en": "Compelling English meta description (150-160 chars)",
  "excerpt_cn": "Chinese translation of excerpt",
  "content_en": "High-quality, informative English blog post (at least 1000 words, Markdown format with ## headings)",
  "content_cn": "Chinese translation of the content",
  "seo_title": "SEO-optimized title tag (under 60 chars)",
  "seo_description": "Meta description (150-160 chars)",
  "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10"],
  "faqs": [
    {"question": "Question 1?", "answer": "Answer 1"},
    {"question": "Question 2?", "answer": "Answer 2"},
    {"question": "Question 3?", "answer": "Answer 3"},
    {"question": "Question 4?", "answer": "Answer 4"},
    {"question": "Question 5?", "answer": "Answer 5"}
  ]
}

Requirements:
- Write in a friendly, authoritative tone
- Include practical information
- Use Markdown for content_en with ## headings
- Ensure content_en is at least 1000 words
- Generate 5-8 relevant FAQs
- Include 8-12 relevant SEO keywords
- All content should be about studying in China
- AGAIN: OUTPUT ONLY THE JSON OBJECT, NO OTHER TEXT`;
        userPrompt = `Generate a complete blog post package about: ${topic || prompt}`;
        break;
      case 'content':
      default:
        systemPrompt = 'You are a professional content writer for Study in China Academy, a study abroad consultancy helping international students study in China. Write high-quality, informative, engaging blog posts in English. Include relevant headings (##, ###), use a friendly and authoritative tone, and provide practical information. The content should be at least 800 words long. Format using Markdown.';
        userPrompt = prompt || `Write a comprehensive blog post about: ${topic}`;
        break;
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    // Use streaming response
    const encoder = new TextEncoder();
    let fullContent = '';
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream from Moonshot API
          for await (const chunk of streamLLM(messages, { 
            temperature: type === 'full_content' ? 0.3 : 0.7 
          })) {
            fullContent += chunk;
            
            if (type === 'full_content') {
              // For full_content, send progress updates
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'progress', 
                content: chunk
              })}\n\n`));
            } else {
              // For other types, send content chunks
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
            }
          }
          
          // For full_content, try to parse the final JSON and send it
          if (type === 'full_content') {
            try {
              // Strip any markdown code fences
              let cleanContent = fullContent.trim();
              // Remove ```json and ``` at start/end
              cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/```\s*$/, '');
              // Remove any other ``` fences
              cleanContent = cleanContent.replace(/```[\s\S]*?```/g, '');
              
              // Find the first { and last } to get the JSON object
              const firstBrace = cleanContent.indexOf('{');
              const lastBrace = cleanContent.lastIndexOf('}');
              
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const jsonStr = cleanContent.slice(firstBrace, lastBrace + 1);
                const parsed = JSON.parse(jsonStr);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'complete', 
                  data: parsed 
                })}\n\n`));
              } else {
                throw new Error('No valid JSON object found');
              }
            } catch (e) {
              console.error('Error parsing full_content JSON:', e, 'Full content:', fullContent);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'error', 
                error: 'Failed to parse generated content. Please try again.' 
              })}\n\n`));
            }
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in AI generate API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
