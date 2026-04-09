import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { name_en, name_cn } = await request.json();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    if (!name_en) {
      return NextResponse.json(
        { error: 'English university name is required' },
        { status: 400 }
      );
    }

    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const systemPrompt = `You are an expert in Chinese higher education and SEO optimization. When given a university name (in English or Chinese), you will generate comprehensive information about that university in both English and Chinese, including SEO-optimized meta content.

Return your response ONLY as a valid JSON object with the following structure, no extra text:
{
  "name_en": "English university name",
  "name_cn": "Chinese university name (if known, otherwise leave empty)",
  "description_en": "Comprehensive English description (at least 300 words)",
  "description_cn": "Comprehensive Chinese description (at least 300 characters)",
  "facilities_en": "English description of campus facilities",
  "facilities_cn": "Chinese description of campus facilities",
  "accommodation_info_en": "English description of accommodation options",
  "accommodation_info_cn": "Chinese description of accommodation options",
  "address_en": "Full address in English",
  "address_cn": "Full address in Chinese",
  "province": "Province name in English (e.g., Beijing, Shanghai, Guangdong)",
  "city": "City name in English (e.g., Beijing, Shanghai, Guangzhou)",
  "type": "One of: 985, 211, double_first_class, public, private",
  "category": "One of: comprehensive, medical, technical, language, business, agriculture, normal, arts, science",
  "founded_year": 4-digit number (or null if unknown),
  "website": "Official website URL (or null if unknown)",
  "meta_description": "SEO-optimized meta description (150-160 characters), compelling for search engines, focusing on studying at this university in China",
  "meta_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"] - array of 5-10 relevant SEO keywords about the university, studying in China, etc.
}

Important guidelines:
- If you don't know specific information, use reasonable estimates or leave as null
- Ensure descriptions are detailed and informative
- Use proper Chinese characters for Chinese fields
- meta_description should be engaging and include the university name and "Study in China"
- meta_keywords should include relevant terms like university name, location, type, "study in China", "international students", etc.
- Return ONLY the JSON, no other text`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { 
        role: "user" as const, 
        content: `Generate university information for: ${name_en}${name_cn ? ` (${name_cn})` : ''}` 
      },
    ];

    const response = await client.invoke(messages, { 
      model: "doubao-seed-2-0-lite-260215", 
      temperature: 0.7 
    });

    // Parse the JSON response
    let generatedData;
    try {
      // Try to extract JSON from response (in case there's extra text)
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedData = JSON.parse(jsonMatch[0]);
      } else {
        generatedData = JSON.parse(response.content);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response', rawResponse: response.content },
        { status: 500 }
      );
    }

    // Generate meta_title with the specified format
    const currentYear = new Date().getFullYear();
    const universityName = generatedData.name_en || name_en || 'University';
    const metaTitle = `Study at ${universityName} | Study In China ${currentYear} | SICA`;
    
    // Add meta_title to the response
    const enhancedData = {
      ...generatedData,
      meta_title: metaTitle,
    };

    return NextResponse.json({ university: enhancedData });
  } catch (error) {
    console.error('Error generating university:', error);
    return NextResponse.json(
      { error: 'Failed to generate university information' },
      { status: 500 }
    );
  }
}
