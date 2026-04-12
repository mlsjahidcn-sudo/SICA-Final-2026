import { NextRequest, NextResponse } from 'next/server';
import { invokeLLM, ChatMessage } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const { name_en, name_cn } = await request.json();

    if (!name_en) {
      return NextResponse.json(
        { error: 'English university name is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert in Chinese higher education, SEO optimization, and university data. When given a university name (in English or Chinese), you will generate comprehensive, accurate information about that university in both English and Chinese.

Return your response ONLY as a valid JSON object with the following structure, no extra text:
{
  "name_en": "English university name (official name)",
  "name_cn": "Chinese university name (official Chinese name, use proper characters)",
  "short_name": "Common abbreviation (e.g., THU for Tsinghua, PKU for Peking)",
  "description_en": "Comprehensive English description (at least 300 words) covering: history, academic reputation, campus, notable achievements, international programs",
  "description_cn": "Comprehensive Chinese description (at least 300 characters) covering the same topics",
  "facilities_en": "English description of campus facilities: libraries, labs, sports facilities, dining, medical center",
  "facilities_cn": "Chinese description of campus facilities",
  "accommodation_info_en": "English description of on-campus housing options for international students",
  "accommodation_info_cn": "Chinese description of accommodation options",
  "address_en": "Full address in English",
  "address_cn": "Full address in Chinese characters",
  "province": "Province name in English (e.g., Beijing, Shanghai, Guangdong, Jiangsu)",
  "city": "City name in English (e.g., Beijing, Shanghai, Guangzhou, Nanjing)",
  "type": "One of: 985, 211, Double First-Class, Provincial, Private",
  "category": "One of: Comprehensive, Science & Technology, Medical, Agricultural, Normal (Teacher Training), Finance & Economics, Language, Arts, Law, Sports, Pharmaceutical, Aerospace, Maritime, Petroleum, Forestry",
  "founded_year": 4-digit year number (or null if unknown),
  "website": "Official website URL (must be real if known, or null)",
  "ranking_national": National ranking number (1-300, based on actual rankings if known, or reasonable estimate),
  "ranking_international": QS/THE world ranking number (or null if not ranked in top 500),
  "student_count": Total student count (approximate, typical for the university type),
  "international_student_count": International student count (approximate),
  "teaching_languages": ["English", "Chinese"] - array of languages used for instruction,
  "scholarship_available": true/false - whether the university typically offers scholarships to international students,
  "scholarship_percentage": Typical scholarship coverage percentage (e.g., 50 for 50% coverage),
  "logo_url": "URL to university logo (use official website or Wikipedia if known, or null)",
  "cover_image_url": "URL to campus image (use Wikipedia Commons if available, or null)",
  "meta_title": "SEO-optimized title (format: 'Study at [University Name] | Study In China 2025 | SICA')",
  "meta_description": "SEO-optimized meta description (150-160 characters), compelling for search engines, include university name, location, and key features",
  "meta_keywords": ["keyword1", "keyword2", ...] - array of 8-12 relevant SEO keywords
}

Important guidelines:
- Use REAL data if you know the university - be accurate about rankings, founding year, location, etc.
- For Chinese universities you don't recognize, make reasonable estimates based on similar universities
- Names must be accurate - double-check Chinese character names
- Rankings should be realistic estimates based on university reputation
- Descriptions should be informative and professional
- Include the university's actual website if known
- meta_description should be engaging and include "Study in China"
- meta_keywords should include: university name, location, "study in China", "international students", "Chinese university", degree types offered, etc.
- Return ONLY the JSON, no other text or markdown`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `Generate comprehensive university information for: ${name_en}${name_cn ? ` (${name_cn})` : ''}. 

Important: Provide accurate, real information if this is a well-known university. Include realistic rankings, student numbers, and the official website.` 
      },
    ];

    const response = await invokeLLM(messages, { temperature: 0.3 });

    // Parse the JSON response
    let generatedData;
    try {
      // Try to extract JSON from response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedData = JSON.parse(jsonMatch[0]);
      } else {
        generatedData = JSON.parse(response);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse AI response', rawResponse: response },
        { status: 500 }
      );
    }

    // Generate meta_title with the specified format if not provided
    const currentYear = new Date().getFullYear();
    const universityName = generatedData.name_en || name_en || 'University';
    
    if (!generatedData.meta_title) {
      generatedData.meta_title = `Study at ${universityName} | Study In China ${currentYear} | SICA`;
    }

    // Ensure meta_keywords is an array
    if (typeof generatedData.meta_keywords === 'string') {
      generatedData.meta_keywords = generatedData.meta_keywords.split(',').map((k: string) => k.trim());
    }

    // Normalize type field
    if (generatedData.type) {
      const typeLower = generatedData.type.toLowerCase().replace(/[-\s]/g, ' ');
      if (typeLower.includes('985')) {
        generatedData.type = '985';
      } else if (typeLower.includes('211')) {
        generatedData.type = '211';
      } else if (typeLower.includes('double') || typeLower.includes('first class')) {
        generatedData.type = 'Double First-Class';
      } else if (typeLower.includes('provincial') || typeLower.includes('public')) {
        generatedData.type = 'Provincial';
      } else if (typeLower.includes('private')) {
        generatedData.type = 'Private';
      }
    }

    // Validate and clean URLs
    if (generatedData.website && !generatedData.website.startsWith('http')) {
      generatedData.website = `https://${generatedData.website}`;
    }
    if (generatedData.logo_url && !generatedData.logo_url.startsWith('http')) {
      generatedData.logo_url = null;
    }
    if (generatedData.cover_image_url && !generatedData.cover_image_url.startsWith('http')) {
      generatedData.cover_image_url = null;
    }

    return NextResponse.json({ university: generatedData });
  } catch (error) {
    console.error('Error generating university:', error);
    return NextResponse.json(
      { error: 'Failed to generate university information' },
      { status: 500 }
    );
  }
}
