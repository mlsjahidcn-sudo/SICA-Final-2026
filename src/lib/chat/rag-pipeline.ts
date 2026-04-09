import { getSupabaseClient } from '@/storage/database/supabase-client';
import { EmbeddingClient, HeaderUtils } from 'coze-coding-dev-sdk';

interface RAGResult {
  content: string;
  title: string;
  source_type: string;
  source_id: string;
  score: number;
  metadata: Record<string, unknown>;
}

interface RAGFilters {
  degree_level?: string;
  category?: string;
  source_type?: string;
  city?: string;
  scholarship_only?: boolean;
}

/**
 * RAG Pipeline: Embed query → Retrieve relevant chunks → Format for LLM injection
 */
export async function retrieveRelevantContext(
  query: string,
  filters: RAGFilters = {},
  topK: number = 5,
  forwardHeaders?: Record<string, string>
): Promise<RAGResult[]> {
  try {
    const customHeaders = forwardHeaders
      ? HeaderUtils.extractForwardHeaders(forwardHeaders)
      : undefined;
    const embeddingClient = customHeaders
      ? new EmbeddingClient(undefined, customHeaders)
      : new EmbeddingClient();

    // 1. Embed the query
    const queryEmbedding = await embeddingClient.embedText(query, { dimensions: 1024 });

    // 2. Use Supabase RPC for vector similarity search
    const supabase = getSupabaseClient();

    const { data: results, error } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: queryEmbedding,
      match_count: topK * 2,
      filter_source_type: filters.source_type || null,
    });

    if (error) {
      console.error('RAG retrieval error:', error);
      return await fallbackTextSearch(query, filters, topK);
    }

    // 3. Apply filters
    let filtered = (results || []).map((r: Record<string, unknown>) => ({
      content: r.content as string,
      title: r.title as string,
      source_type: r.source_type as string,
      source_id: r.source_id as string,
      score: r.similarity as number,
      metadata: (r.metadata || {}) as Record<string, unknown>,
    }));

    if (filters.degree_level) {
      filtered = filtered.filter((r: RAGResult) =>
        r.metadata.degree_level?.toString().toLowerCase() === filters.degree_level?.toLowerCase() ||
        r.content.toLowerCase().includes(filters.degree_level?.toLowerCase() || '')
      );
    }

    if (filters.category) {
      filtered = filtered.filter((r: RAGResult) =>
        r.metadata.category?.toString().toLowerCase().includes(filters.category?.toLowerCase() || '') ||
        r.content.toLowerCase().includes(filters.category?.toLowerCase() || '')
      );
    }

    if (filters.scholarship_only) {
      filtered = filtered.filter((r: RAGResult) =>
        r.metadata.scholarship_available === true ||
        r.content.toLowerCase().includes('scholarship')
      );
    }

    return filtered.slice(0, topK);
  } catch (error) {
    console.error('RAG pipeline error:', error);
    return await fallbackTextSearch(query, filters, topK);
  }
}

/**
 * Fallback text search when vector search is unavailable
 */
async function fallbackTextSearch(
  query: string,
  filters: RAGFilters,
  topK: number
): Promise<RAGResult[]> {
  const supabase = getSupabaseClient();
  const results: RAGResult[] = [];

  try {
    // Search programs
    let programQuery = supabase
      .from('programs')
      .select('id, name, degree_level, category, sub_category, language, duration_years, tuition_fee_per_year, currency, scholarship_available, description, description_en, universities(id, name_en, city, province)')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,category.ilike.%${query}%,sub_category.ilike.%${query}%,description_en.ilike.%${query}%`)
      .limit(topK);

    if (filters.degree_level) {
      programQuery = programQuery.eq('degree_level', filters.degree_level);
    }

    const { data: programs } = await programQuery;

    for (const prog of programs || []) {
      const uni = Array.isArray(prog.universities) ? prog.universities[0] : prog.universities as Record<string, unknown> | null;
      results.push({
        content: `${prog.name} at ${uni?.name_en || 'N/A'}. Degree: ${prog.degree_level}. Language: ${prog.language}. Tuition: ${prog.tuition_fee_per_year ? Number(prog.tuition_fee_per_year).toLocaleString() + ' ' + (prog.currency || 'CNY') + '/yr' : 'N/A'}. Scholarship: ${prog.scholarship_available ? 'Yes' : 'No'}. ${prog.description_en || prog.description || ''}`,
        title: `${prog.name} at ${uni?.name_en || 'Unknown'}`,
        source_type: 'program',
        source_id: prog.id,
        score: 0.5,
        metadata: {
          program_name: prog.name,
          university_name: uni?.name_en,
          degree_level: prog.degree_level,
          category: prog.category,
          scholarship_available: prog.scholarship_available,
        },
      });
    }

    // Search universities
    const { data: universities } = await supabase
      .from('universities')
      .select('id, name_en, name_cn, city, province, ranking_national, scholarship_available')
      .eq('is_active', true)
      .or(`name_en.ilike.%${query}%,name_cn.ilike.%${query}%,city.ilike.%${query}%,province.ilike.%${query}%`)
      .limit(Math.max(0, topK - results.length));

    for (const uni of universities || []) {
      results.push({
        content: `${uni.name_en} (${uni.name_cn || ''}). Location: ${uni.city}, ${uni.province}. Ranking: #${uni.ranking_national || 'N/A'}. Scholarship: ${uni.scholarship_available ? 'Yes' : 'No'}.`,
        title: uni.name_en,
        source_type: 'university',
        source_id: uni.id,
        score: 0.4,
        metadata: {
          name_en: uni.name_en,
          city: uni.city,
          ranking_national: uni.ranking_national,
          scholarship_available: uni.scholarship_available,
        },
      });
    }
  } catch (error) {
    console.error('Fallback text search error:', error);
  }

  return results.slice(0, topK);
}

/**
 * Format RAG results into LLM-injectable context
 */
export function formatRAGContext(results: RAGResult[]): string {
  if (results.length === 0) return '';

  const formatted = results.map((r, i) => {
    return `[${i + 1}] ${r.title}\n${r.content}`;
  }).join('\n\n');

  return `## Relevant Information (retrieved from database)\n${formatted}\n\nWhen referencing this information, cite the source like [1], [2] etc. If the retrieved info doesn't fully answer the question, say so honestly and suggest the user check the platform for the latest details.`;
}

/**
 * Extract program/university IDs from RAG results for lead tracking
 */
export function extractLeadPreferences(results: RAGResult[]): {
  program_ids: string[];
  university_ids: string[];
} {
  const program_ids: string[] = [];
  const university_ids: string[] = [];

  for (const r of results) {
    if (r.source_type === 'program' && r.source_id) {
      program_ids.push(r.source_id);
    }
    if (r.source_type === 'university' && r.source_id) {
      university_ids.push(r.source_id);
    }
  }

  return { program_ids, university_ids };
}
