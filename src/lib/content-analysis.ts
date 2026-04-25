/**
 * Content Analysis Utilities for SEO Optimization
 * Provides readability analysis, keyword density checking, and SEO scoring
 */

export interface ReadabilityResult {
  score: number;
  grade: string;
  description: string;
  color: 'green' | 'yellow' | 'red';
}

export interface KeywordDensity {
  keyword: string;
  count: number;
  density: number;
  status: 'good' | 'low' | 'high';
}

export interface ContentStats {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageSentenceLength: number;
  averageWordLength: number;
  readingTime: number;
}

export interface SEOScore {
  overall: number;
  title: { score: number; maxScore: number; issues: string[] };
  content: { score: number; maxScore: number; issues: string[] };
  keywords: { score: number; maxScore: number; issues: string[] };
  readability: { score: number; maxScore: number; issues: string[] };
  structure: { score: number; maxScore: number; issues: string[] };
  meta: { score: number; maxScore: number; issues: string[] };
}

/**
 * Calculate Flesch Reading Ease score
 * Score 90-100: Very Easy (5th grade)
 * Score 80-89: Easy (6th grade)
 * Score 70-79: Fairly Easy (7th grade)
 * Score 60-69: Standard (8th-9th grade)
 * Score 50-59: Fairly Difficult (10th-12th grade)
 * Score 30-49: Difficult (College)
 * Score 0-29: Very Difficult (Graduate)
 */
export function calculateReadability(text: string): ReadabilityResult {
  if (!text || text.trim().length === 0) {
    return { score: 0, grade: 'N/A', description: 'No content to analyze', color: 'red' };
  }

  const stats = getContentStats(text);
  
  // Flesch Reading Ease formula
  const syllableCount = countSyllables(text);
  const avgSentenceLength = stats.wordCount / Math.max(1, stats.sentenceCount);
  const avgSyllablesPerWord = syllableCount / Math.max(1, stats.wordCount);
  
  const score = Math.round(
    206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
  );
  
  const clampedScore = Math.max(0, Math.min(100, score));
  
  let grade: string;
  let description: string;
  let color: 'green' | 'yellow' | 'red';
  
  if (clampedScore >= 80) {
    grade = 'Easy';
    description = 'Readable by most audiences (5th-6th grade level)';
    color = 'green';
  } else if (clampedScore >= 60) {
    grade = 'Standard';
    description = 'Readable by average adults (8th-9th grade level)';
    color = 'green';
  } else if (clampedScore >= 50) {
    grade = 'Fairly Difficult';
    description = 'Readable by high school students (10th-12th grade)';
    color = 'yellow';
  } else if (clampedScore >= 30) {
    grade = 'Difficult';
    description = 'Readable by college students';
    color = 'yellow';
  } else {
    grade = 'Very Difficult';
    description = 'Readable by graduate level readers';
    color = 'red';
  }
  
  return { score: clampedScore, grade, description, color };
}

/**
 * Count syllables in text (approximation)
 */
function countSyllables(text: string): number {
  const words = text.toLowerCase().match(/\b[a-z]+\b/gi) || [];
  let count = 0;
  
  for (const word of words) {
    // Simple syllable counting heuristic
    let wordSyllables = 0;
    const vowels = 'aeiouy';
    let prevWasVowel = false;
    
    for (const char of word) {
      const isVowel = vowels.includes(char);
      if (isVowel && !prevWasVowel) {
        wordSyllables++;
      }
      prevWasVowel = isVowel;
    }
    
    // Adjust for silent 'e' at end
    if (word.endsWith('e') && wordSyllables > 1) {
      wordSyllables--;
    }
    
    // Every word has at least one syllable
    count += Math.max(1, wordSyllables);
  }
  
  return count;
}

/**
 * Get content statistics
 */
export function getContentStats(text: string): ContentStats {
  if (!text) {
    return {
      wordCount: 0,
      characterCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      averageSentenceLength: 0,
      averageWordLength: 0,
      readingTime: 0,
    };
  }

  const plainText = text.replace(/<[^>]*>/g, ' '); // Remove HTML tags
  const words = plainText.match(/\b\w+\b/g) || [];
  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = plainText.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  const wordCount = words.length;
  const characterCount = plainText.length;
  const sentenceCount = sentences.length;
  const paragraphCount = Math.max(1, paragraphs.length);
  
  const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
  const totalSentenceLength = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0);
  
  return {
    wordCount,
    characterCount,
    sentenceCount,
    paragraphCount,
    averageSentenceLength: sentenceCount > 0 ? Math.round(totalSentenceLength / sentenceCount) : 0,
    averageWordLength: wordCount > 0 ? Math.round(totalWordLength / wordCount * 10) / 10 : 0,
    readingTime: Math.max(1, Math.ceil(wordCount / 200)), // 200 words per minute average
  };
}

/**
 * Calculate keyword density
 * Optimal density is typically 1-2%
 */
export function calculateKeywordDensity(
  content: string,
  keywords: string[]
): KeywordDensity[] {
  if (!content || keywords.length === 0) {
    return [];
  }

  const plainText = content.toLowerCase().replace(/<[^>]*>/g, ' ');
  const words = plainText.match(/\b\w+\b/g) || [];
  const totalWords = words.length;
  
  return keywords.map(keyword => {
    const normalizedKeyword = keyword.toLowerCase().trim();
    const keywordWords = normalizedKeyword.split(/\s+/);
    
    let count = 0;
    
    if (keywordWords.length === 1) {
      // Single keyword
      count = words.filter(w => w === normalizedKeyword).length;
    } else {
      // Multi-word keyword (phrase)
      const textStr = words.join(' ');
      const regex = new RegExp(normalizedKeyword.replace(/\s+/g, '\\s+'), 'gi');
      const matches = textStr.match(regex);
      count = matches ? matches.length : 0;
    }
    
    const density = totalWords > 0 ? (count / totalWords) * 100 : 0;
    
    let status: 'good' | 'low' | 'high';
    if (density < 0.5) {
      status = 'low';
    } else if (density > 3) {
      status = 'high';
    } else {
      status = 'good';
    }
    
    return {
      keyword,
      count,
      density: Math.round(density * 100) / 100,
      status,
    };
  });
}

/**
 * Calculate overall SEO score
 */
export function calculateSEOScore(data: {
  title: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  excerpt?: string;
}): SEOScore {
  const result: SEOScore = {
    overall: 0,
    title: { score: 0, maxScore: 15, issues: [] },
    content: { score: 0, maxScore: 25, issues: [] },
    keywords: { score: 0, maxScore: 20, issues: [] },
    readability: { score: 0, maxScore: 15, issues: [] },
    structure: { score: 0, maxScore: 15, issues: [] },
    meta: { score: 0, maxScore: 10, issues: [] },
  };
  
  // Title Analysis (15 points)
  if (data.title) {
    if (data.title.length >= 30 && data.title.length <= 60) {
      result.title.score = 15;
    } else if (data.title.length >= 20 && data.title.length < 30) {
      result.title.score = 10;
      result.title.issues.push('Title is a bit short. Aim for 30-60 characters.');
    } else if (data.title.length > 60 && data.title.length <= 70) {
      result.title.score = 10;
      result.title.issues.push('Title is a bit long. Keep it under 60 characters for best display.');
    } else if (data.title.length > 70) {
      result.title.score = 5;
      result.title.issues.push('Title is too long. Keep it under 70 characters.');
    } else {
      result.title.score = 5;
      result.title.issues.push('Title is too short. Aim for 30-60 characters.');
    }
  } else {
    result.title.issues.push('Missing title.');
  }
  
  // Content Analysis (25 points)
  const stats = getContentStats(data.content);
  if (stats.wordCount >= 1000) {
    result.content.score = 25;
  } else if (stats.wordCount >= 600) {
    result.content.score = 20;
    result.content.issues.push('Content length is good but could be longer (600-1000 words).');
  } else if (stats.wordCount >= 300) {
    result.content.score = 12;
    result.content.issues.push('Content is short. Aim for at least 600 words for better SEO.');
  } else {
    result.content.score = 5;
    result.content.issues.push('Content is too short. Aim for at least 600 words.');
  }
  
  // Keyword Analysis (20 points)
  if (data.seoKeywords) {
    const keywords = data.seoKeywords.split(',').map(k => k.trim()).filter(Boolean);
    const densities = calculateKeywordDensity(data.content, keywords);
    
    const goodKeywords = densities.filter(d => d.status === 'good').length;
    const lowKeywords = densities.filter(d => d.status === 'low').length;
    const highKeywords = densities.filter(d => d.status === 'high').length;
    
    if (keywords.length === 0) {
      result.keywords.issues.push('No keywords specified.');
      result.keywords.score = 0;
    } else if (goodKeywords === keywords.length) {
      result.keywords.score = 20;
    } else if (goodKeywords > 0 && highKeywords === 0) {
      result.keywords.score = 15;
      if (lowKeywords > 0) {
        result.keywords.issues.push('Some keywords have low density. Consider using them more naturally.');
      }
    } else if (highKeywords > 0) {
      result.keywords.score = 10;
      result.keywords.issues.push('Some keywords are overused. This may look like keyword stuffing.');
    } else {
      result.keywords.score = 10;
      result.keywords.issues.push('Keywords could be better optimized.');
    }
    
    // Check if keywords appear in title
    const titleLower = data.title.toLowerCase();
    const hasKeywordInTitle = keywords.some(k => titleLower.includes(k.toLowerCase()));
    if (!hasKeywordInTitle && keywords.length > 0) {
      result.keywords.issues.push('Consider including your main keyword in the title.');
    }
  } else {
    result.keywords.issues.push('No keywords specified.');
  }
  
  // Readability Analysis (15 points)
  const readability = calculateReadability(data.content);
  if (readability.score >= 60) {
    result.readability.score = 15;
  } else if (readability.score >= 50) {
    result.readability.score = 12;
    result.readability.issues.push('Content could be easier to read. Use shorter sentences.');
  } else if (readability.score >= 30) {
    result.readability.score = 8;
    result.readability.issues.push('Content is difficult to read. Consider simplifying language.');
  } else {
    result.readability.score = 5;
    result.readability.issues.push('Content is very difficult to read. Rewrite for general audience.');
  }
  
  // Structure Analysis (15 points)
  const headings = (data.content.match(/<h[2-6][^>]*>/gi) || []).length;
  const hasParagraphs = stats.paragraphCount >= 3;
  const hasLists = /<[ou]l[^>]*>/i.test(data.content);
  
  let structureScore = 0;
  if (headings >= 3) {
    structureScore += 8;
  } else if (headings >= 1) {
    structureScore += 5;
    result.structure.issues.push('Add more subheadings to organize content.');
  } else {
    result.structure.issues.push('Missing subheadings. Use H2/H3 to structure content.');
  }
  
  if (hasParagraphs) {
    structureScore += 4;
  } else {
    result.structure.issues.push('Content needs more paragraph breaks.');
  }
  
  if (hasLists) {
    structureScore += 3;
  } else {
    result.structure.issues.push('Consider using bullet points or numbered lists.');
  }
  
  result.structure.score = structureScore;
  
  // Meta Analysis (10 points)
  if (data.seoTitle) {
    if (data.seoTitle.length >= 30 && data.seoTitle.length <= 60) {
      result.meta.score += 5;
    } else {
      result.meta.score += 3;
      result.meta.issues.push('SEO title length should be 30-60 characters.');
    }
  } else {
    result.meta.issues.push('Missing SEO title.');
  }
  
  if (data.seoDescription) {
    if (data.seoDescription.length >= 120 && data.seoDescription.length <= 160) {
      result.meta.score += 5;
    } else if (data.seoDescription.length < 120) {
      result.meta.score += 3;
      result.meta.issues.push('SEO description is too short. Aim for 120-160 characters.');
    } else {
      result.meta.score += 3;
      result.meta.issues.push('SEO description is too long. Keep it under 160 characters.');
    }
  } else {
    result.meta.issues.push('Missing SEO description.');
  }
  
  // Calculate overall score
  result.overall = Math.round(
    ((result.title.score + result.content.score + result.keywords.score +
      result.readability.score + result.structure.score + result.meta.score) /
      (result.title.maxScore + result.content.maxScore + result.keywords.maxScore +
        result.readability.maxScore + result.structure.maxScore + result.meta.maxScore)) * 100
  );
  
  return result;
}

/**
 * Get content length recommendation
 */
export function getContentRecommendation(wordCount: number): {
  status: 'excellent' | 'good' | 'fair' | 'poor';
  message: string;
  minWords: number;
} {
  if (wordCount >= 1500) {
    return {
      status: 'excellent',
      message: 'Excellent! Long-form content tends to rank better.',
      minWords: 1000,
    };
  } else if (wordCount >= 1000) {
    return {
      status: 'good',
      message: 'Good length! Content meets SEO best practices.',
      minWords: 1000,
    };
  } else if (wordCount >= 600) {
    return {
      status: 'fair',
      message: 'Content is acceptable but could be longer for better rankings.',
      minWords: 1000,
    };
  } else {
    return {
      status: 'poor',
      message: 'Content is too short. Aim for at least 600-1000 words.',
      minWords: 1000,
    };
  }
}
