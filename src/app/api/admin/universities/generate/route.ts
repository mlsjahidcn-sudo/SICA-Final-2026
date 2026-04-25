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
  "country": "China",
  "latitude": 39.9042,
  "longitude": 116.4074,
  "type": ["985", "211"] - Array of classifications. Can include multiple: "985", "211", "Double First-Class", "Provincial", "Private". For example: ["985", "211"] or ["Double First-Class"] or ["Provincial"],
  "category": "One of: Comprehensive, Science & Technology, Medical, Agricultural, Normal (Teacher Training), Finance & Economics, Language, Arts, Law, Sports, Pharmaceutical, Aerospace, Maritime, Petroleum, Forestry",
  "tier": "One of: Tier 1, Tier 2, Tier 3, Tier 4, Tier 5 (based on reputation and rankings)",
  "founded_year": 4-digit year number (or null if unknown),
  "website": "Official website URL (must be real if known, or null)",
  "ranking_national": National ranking number (1-300, based on actual rankings if known, or reasonable estimate),
  "ranking_international": QS/THE world ranking number (or null if not ranked in top 500),
  "student_count": Total student count (approximate, typical for the university type),
  "international_student_count": International student count (approximate),
  "faculty_count": Faculty count (approximate),
  "teaching_languages": ["English", "Chinese"],
  "scholarship_available": true/false,
  "scholarship_percentage": Typical scholarship coverage percentage (e.g., 50 for 50% coverage),
  "scholarship_info": "Detailed English description of scholarship opportunities for international students",
  "scholarship_info_cn": "Detailed Chinese description of scholarship opportunities",
  "logo_url": "URL to university logo (use official website or Wikipedia if known, or null)",
  "cover_image_url": "URL to campus image (use Wikipedia Commons if available, or null)",
  "tuition_min": Minimum annual tuition in CNY (for international students)",
  "tuition_max": Maximum annual tuition in CNY",
  "tuition_currency": "CNY",
  "contact_email": "Admissions office email (or null)",
  "contact_phone": "Admissions office phone (or null)",
  "application_deadline": "Application deadline as text string (e.g., 'June 30', 'Rolling admissions', 'March 15 for fall semester', or null)",
  "intake_months": ["September", "March"],
  "csca_required": true/false,
  "has_application_fee": true/false,
  "acceptance_flexibility": "Flexible / Moderate / Strict",
  "meta_title": "SEO-optimized title (format: 'Study at [University Name] | Study In China 2025 | SICA')",
  "meta_description": "SEO-optimized meta description (150-160 characters), compelling for search engines, include university name, location, and key features",
  "meta_keywords": ["keyword1", "keyword2", ...]
}

Important guidelines:
- Use REAL data if you know the university - be accurate about rankings, founding year, location, etc.
- For Chinese universities you don't recognize, make reasonable estimates based on similar universities
- Names must be accurate - double-check Chinese character names
- Rankings should be realistic estimates based on university reputation
- Descriptions should be informative and professional (at least 300 words/characters)
- Include the university's actual website if known
- For coordinates, use the city center coordinates as approximation if exact campus location unknown
- Scholarship info should describe CSC, provincial, and university-specific scholarships available
- Tuition should be realistic ranges for international students in CNY
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

    // Ensure teaching_languages is an array
    if (typeof generatedData.teaching_languages === 'string') {
      generatedData.teaching_languages = generatedData.teaching_languages.split(',').map((l: string) => l.trim());
    }

    // Ensure intake_months is an array
    if (typeof generatedData.intake_months === 'string') {
      generatedData.intake_months = generatedData.intake_months.split(',').map((m: string) => m.trim());
    }

    // Normalize type field (now an array)
    if (generatedData.type) {
      const typeMap: Record<string, string> = {
        '985': '985',
        '211': '211',
        'double_first_class': 'Double First-Class',
        'double first-class': 'Double First-Class',
        'double first class': 'Double First-Class',
        'public': 'Provincial',
        'private': 'Provincial',
        'provincial': 'Provincial',
      }
      
      // If AI returns an array, map each type
      if (Array.isArray(generatedData.type)) {
        generatedData.type = generatedData.type
          .map((t: string) => typeMap[t.toLowerCase().replace(/[-\s]/g, '_')] || t)
          .filter(Boolean)
      } else if (typeof generatedData.type === 'string') {
        // If AI returns a single string, check for multiple types in the string
        const typeStr = generatedData.type.toLowerCase()
        const types: string[] = []
        
        // Check for each type in the string
        if (typeStr.includes('985')) types.push('985')
        if (typeStr.includes('211')) types.push('211')
        if (typeStr.includes('double') && typeStr.includes('first')) types.push('Double First-Class')
        if (typeStr.includes('provincial') || typeStr.includes('public')) types.push('Provincial')
        if (typeStr.includes('private')) types.push('Provincial')
        
        // If no types found, use the mapped single type
        if (types.length === 0) {
          const mappedType = typeMap[typeStr.replace(/[-\s]/g, '_')]
          if (mappedType) types.push(mappedType)
        }
        
        generatedData.type = types.length > 0 ? types : ['Provincial']
      }
    } else {
      // Default to Provincial if no type provided
      generatedData.type = ['Provincial']
    }

    // Normalize tier field
    if (generatedData.tier) {
      const tierMatch = generatedData.tier.match(/tier\s*(\d)/i);
      if (tierMatch) {
        generatedData.tier = `Tier ${tierMatch[1]}`;
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

    // Ensure country is set
    if (!generatedData.country) {
      generatedData.country = 'China';
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
