import { getSupabaseClient } from '@/storage/database/supabase-client';
import { EmbeddingClient, HeaderUtils } from 'coze-coding-dev-sdk';

interface KnowledgeChunk {
  source_type: 'university' | 'program' | 'faq' | 'guide';
  source_id: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

/**
 * Seed knowledge chunks from universities and programs tables.
 * Called via /api/chat/knowledge/seed endpoint.
 */
export async function seedKnowledge(
  forwardHeaders?: Record<string, string>
): Promise<{ seeded: number }> {
  const supabase = getSupabaseClient();
  const customHeaders = forwardHeaders
    ? HeaderUtils.extractForwardHeaders(forwardHeaders)
    : undefined;
  const embeddingClient = customHeaders
    ? new EmbeddingClient(undefined, customHeaders)
    : new EmbeddingClient();

  const chunks: KnowledgeChunk[] = [];

  // 1. Seed universities
  const { data: universities } = await supabase
    .from('universities')
    .select('id, name_en, name_cn, province, city, type, category, ranking_national, ranking_world, scholarship_available, accommodation_available, description, website_url, tuition_min, tuition_max, tuition_currency')
    .eq('is_active', true);

  for (const uni of universities || []) {
    chunks.push({
      source_type: 'university',
      source_id: uni.id,
      title: `${uni.name_en} (${uni.name_cn || ''})`,
      content: [
        `${uni.name_en}${uni.name_cn ? ` (${uni.name_cn})` : ''}`,
        `Location: ${uni.city || 'N/A'}, ${uni.province || 'N/A'}`,
        `Type: ${uni.type || 'N/A'} | Category: ${uni.category || 'N/A'}`,
        `Ranking: National #${uni.ranking_national || 'N/A'}, World #${uni.ranking_world || 'N/A'}`,
        `Scholarship: ${uni.scholarship_available ? 'Available' : 'Not available'}`,
        `Accommodation: ${uni.accommodation_available ? 'Available' : 'Not available'}`,
        `Tuition: ${uni.tuition_min && uni.tuition_max ? `${Number(uni.tuition_min).toLocaleString()}-${Number(uni.tuition_max).toLocaleString()} ${uni.tuition_currency || 'CNY'}/yr` : 'Contact for details'}`,
        uni.description ? `About: ${uni.description}` : '',
        uni.website_url ? `Website: ${uni.website_url}` : '',
      ].filter(Boolean).join('\n'),
      metadata: {
        name_en: uni.name_en,
        city: uni.city,
        province: uni.province,
        type: uni.type,
        category: uni.category,
        ranking_national: uni.ranking_national,
        scholarship_available: uni.scholarship_available,
      },
    });
  }

  // 2. Seed programs
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name, degree_level, category, sub_category, language, duration_years, tuition_fee_per_year, currency, scholarship_available, description, description_en, universities(id, name_en, city)')
    .eq('is_active', true);

  for (const prog of programs || []) {
    const uni = Array.isArray(prog.universities) ? prog.universities[0] : prog.universities as Record<string, unknown> | null;
    chunks.push({
      source_type: 'program',
      source_id: prog.id,
      title: `${prog.name} at ${uni?.name_en || 'N/A'}`,
      content: [
        `Program: ${prog.name}`,
        `University: ${uni?.name_en || 'N/A'} (${uni?.city || 'N/A'})`,
        `Degree: ${prog.degree_level || 'N/A'}`,
        `Category: ${prog.category || 'N/A'}${prog.sub_category ? ` > ${prog.sub_category}` : ''}`,
        `Language: ${prog.language || 'N/A'}`,
        `Duration: ${prog.duration_years ? `${prog.duration_years} years` : 'N/A'}`,
        `Tuition: ${prog.tuition_fee_per_year ? `${Number(prog.tuition_fee_per_year).toLocaleString()} ${prog.currency || 'CNY'}/yr` : 'Contact for details'}`,
        `Scholarship: ${prog.scholarship_available ? 'Available' : 'Not available'}`,
        prog.description_en ? `Description: ${prog.description_en}` : (prog.description ? `Description: ${prog.description}` : ''),
      ].filter(Boolean).join('\n'),
      metadata: {
        program_name: prog.name,
        university_name: uni?.name_en,
        degree_level: prog.degree_level,
        category: prog.category,
        language: prog.language,
        scholarship_available: prog.scholarship_available,
      },
    });
  }

  // 3. Seed FAQ and guide entries
  const faqChunks: KnowledgeChunk[] = [
    {
      source_type: 'faq',
      source_id: 'faq-csc',
      title: 'Chinese Government Scholarship (CSC)',
      content: 'The Chinese Government Scholarship (CSC) is a full scholarship provided by the Chinese Ministry of Education. It covers tuition, accommodation, living allowance (2,500-3,500 CNY/month), and medical insurance. Application period is typically January-April. Apply through the CSC online system or your home country embassy. Required documents: CSC application form, passport, highest diploma, transcripts, study plan, recommendation letters, language certificate, medical exam form.',
      metadata: { category: 'scholarship', degree_level: 'all' },
    },
    {
      source_type: 'faq',
      source_id: 'faq-application',
      title: 'Application Process',
      content: 'The application process for studying in China typically involves: 1) Choose your program and university, 2) Prepare required documents (passport, diplomas, transcripts, language certificates, recommendation letters, study plan, financial proof, medical exam), 3) Submit application through SICA platform or directly to the university, 4) Wait for review (2-8 weeks), 5) Receive admission letter and JW201/JW202 visa form, 6) Apply for student visa (X1/X2) at the Chinese embassy. Start the process 6-12 months before the intended start date.',
      metadata: { category: 'application', degree_level: 'all' },
    },
    {
      source_type: 'faq',
      source_id: 'faq-documents',
      title: 'Required Documents',
      content: 'Common required documents for studying in China: Valid passport (6+ months validity), Highest diploma/degree certificate (notarized), Academic transcripts (notarized), Language certificate (HSK for Chinese programs, IELTS/TOEFL for English programs), Two recommendation letters from professors or employers, Study plan or personal statement (800+ words), Passport-size photos, Foreigner Physical Examination Form, Financial proof (bank statement showing 20,000+ USD equivalent), Police clearance certificate. Some programs may require additional documents like portfolio or interview.',
      metadata: { category: 'documents', degree_level: 'all' },
    },
    {
      source_type: 'faq',
      source_id: 'faq-visa',
      title: 'Student Visa Guide',
      content: 'China offers two types of student visas: X1 visa (for programs over 180 days) and X2 visa (for programs under 180 days). To apply you need: admission notice, JW201 or JW202 form, valid passport, physical examination record, and photos. Apply at the Chinese embassy/consulate in your country. Processing time is typically 1-4 weeks. After arrival, X1 visa holders must apply for a residence permit within 30 days at the local Public Security Bureau.',
      metadata: { category: 'visa', degree_level: 'all' },
    },
    {
      source_type: 'guide',
      source_id: 'guide-english-programs',
      title: 'English-Taught Programs in China',
      content: 'Many Chinese universities offer English-taught programs, especially at the Master\'s and PhD levels. Popular fields include Business (MBA/MBM), Engineering, Computer Science, Medicine (MBBS), International Relations, and Economics. Top universities for English programs: Tsinghua, Peking, Fudan, Shanghai Jiao Tong, Zhejiang University. Most English programs require IELTS 6.0-6.5 or TOEFL 80-90. Tuition for English programs is typically higher than Chinese-taught programs, ranging from 20,000-60,000 CNY/year.',
      metadata: { category: 'programs', degree_level: 'all', language: 'english' },
    },
  ];

  chunks.push(...faqChunks);

  // 4. Generate embeddings and insert into chat_knowledge_chunks
  let seeded = 0;
  const BATCH_SIZE = 10;

  // Clear existing chunks
  await supabase.from('chat_knowledge_chunks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map(c => c.content);

    try {
      const embeddings = await embeddingClient.embedTexts(texts, { dimensions: 1024 });

      const rows = batch.map((chunk, idx) => ({
        source_type: chunk.source_type,
        source_id: chunk.source_id,
        title: chunk.title,
        content: chunk.content,
        metadata: chunk.metadata,
        embedding: JSON.stringify(embeddings[idx]),
      }));

      const { error } = await supabase.from('chat_knowledge_chunks').insert(rows);

      if (error) {
        console.error(`Failed to insert batch starting at ${i}:`, error);
      } else {
        seeded += batch.length;
      }
    } catch (error) {
      console.error(`Failed to embed batch starting at ${i}:`, error);
    }
  }

  return { seeded };
}
