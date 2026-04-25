// Marker patterns for university and program recommendations
// Simple format: [UNI:id] or [PROG:id]
export const MARKERS = {
  UNIVERSITY: /\[UNI:([a-f0-9-]+)\]/gi,  // [UNI:uuid]
  PROGRAM: /\[PROG:([a-f0-9-]+)\]/gi,    // [PROG:uuid]
} as const;

export interface ParsedContent {
  text: string;
  universityIds: string[];
  programIds: string[];
}

/**
 * Parse AI response content for markers and extract IDs
 * Returns cleaned text and lists of university/program IDs to fetch
 */
export function parseChatContent(content: string): ParsedContent {
  const universityIds: string[] = [];
  const programIds: string[] = [];

  // Parse university markers [UNI:id]
  let text = content.replace(MARKERS.UNIVERSITY, (match, id) => {
    if (!universityIds.includes(id)) {
      universityIds.push(id);
    }
    return `{{UNI:${universityIds.indexOf(id)}}}`;
  });

  // Parse program markers [PROG:id]
  text = text.replace(MARKERS.PROGRAM, (match, id) => {
    if (!programIds.includes(id)) {
      programIds.push(id);
    }
    return `{{PROG:${programIds.indexOf(id)}}}`;
  });

  // Clean up any leftover malformed markers (hide them from user)
  text = text.replace(/\[UNI:[^\]]*\]/gi, '');
  text = text.replace(/\[PROG:[^\]]*\]/gi, '');
  text = text.replace(/```json:university[\s\S]*?```/gi, '');
  text = text.replace(/```json:program[\s\S]*?```/gi, '');

  return {
    text,
    universityIds,
    programIds,
  };
}

/**
 * Split text by card placeholders for rendering
 */
export function splitByCardPlaceholders(text: string): Array<{ 
  type: 'text' | 'uni-card' | 'prog-card'; 
  content: string; 
  index?: number 
}> {
  const parts: Array<{ type: 'text' | 'uni-card' | 'prog-card'; content: string; index?: number }> = [];
  
  // Match both types of card placeholders
  const regex = /\{\{(UNI|PROG):(\d+)\}\}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index).trim();
      if (textContent) {
        parts.push({ type: 'text', content: textContent });
      }
    }

    // Add the card placeholder
    const [fullMatch, cardType, indexStr] = match;
    const index = parseInt(indexStr, 10);
    
    if (cardType === 'UNI') {
      parts.push({ type: 'uni-card', content: '', index });
    } else if (cardType === 'PROG') {
      parts.push({ type: 'prog-card', content: '', index });
    }

    lastIndex = match.index + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }
  }

  return parts;
}

/**
 * Generate system prompt instructions for structured responses
 */
export function getStructuredResponseInstructions(): string {
  return `
## Recommending Universities and Programs

When recommending specific universities or programs from our database, use these simple markers:

**For Universities:**
- Format: [UNI:university-id]
- Example: I recommend [UNI:abc123-def456] for engineering.

**For Programs:**
- Format: [PROG:program-id]  
- Example: Check out [PROG:xyz789-abc123] for computer science.

**Important:**
- Only use markers when you KNOW the actual ID from context
- Never make up IDs
- Use one marker per recommendation
- Always provide context around recommendations

**Example:**
"Based on your interest in engineering, I'd recommend:

1. [UNI:550e8400-e29b-41d4-a716-446655440000] - Known for excellent engineering programs

2. [UNI:6ba7b810-9dad-11d1-80b4-00c04fd430c8] - Top-ranked with strong research facilities"

Keep your responses helpful and informative with proper markdown formatting.
`;
}

/**
 * Quick action suggestions based on context
 */
export function getQuickActions(context: 'scholarship' | 'program' | 'university' | 'application' | 'general'): Array<{ label: string; query: string }> {
  const actions = {
    scholarship: [
      { label: 'CSC Scholarship', query: 'Tell me about the Chinese Government Scholarship (CSC)' },
      { label: 'Eligibility', query: 'What are the eligibility requirements for scholarships?' },
      { label: 'Apply for Scholarship', query: 'How do I apply for a scholarship?' },
    ],
    program: [
      { label: 'Programs by Major', query: 'What programs are available for computer science?' },
      { label: 'English Programs', query: 'Which programs are taught in English?' },
      { label: 'Tuition Fees', query: 'What are the tuition fees for international students?' },
    ],
    university: [
      { label: 'Top Universities', query: 'What are the top 10 universities in China?' },
      { label: 'By Location', query: 'Which universities are in Beijing or Shanghai?' },
      { label: 'Compare', query: 'How do I choose between universities?' },
    ],
    application: [
      { label: 'Requirements', query: 'What documents do I need to apply?' },
      { label: 'Deadlines', query: 'When are the application deadlines?' },
      { label: 'Track Status', query: 'How can I check my application status?' },
    ],
    general: [
      { label: 'Scholarships', query: 'What scholarship options are available?' },
      { label: 'Apply Now', query: 'How do I apply to a Chinese university?' },
      { label: 'Programs', query: 'What types of programs are available?' },
    ],
  };

  return actions[context] || actions.general;
}

/**
 * Detect context from message content
 */
export function detectContext(message: string): 'scholarship' | 'program' | 'university' | 'application' | 'general' {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('scholarship') || lowerMessage.includes('financial aid') || lowerMessage.includes('csc') || lowerMessage.includes('funding')) {
    return 'scholarship';
  }
  if (lowerMessage.includes('program') || lowerMessage.includes('course') || lowerMessage.includes('major') || lowerMessage.includes('degree')) {
    return 'program';
  }
  if (lowerMessage.includes('university') || lowerMessage.includes('college') || lowerMessage.includes('school') || lowerMessage.includes('tsinghua') || lowerMessage.includes('peking')) {
    return 'university';
  }
  if (lowerMessage.includes('apply') || lowerMessage.includes('application') || lowerMessage.includes('deadline') || lowerMessage.includes('document') || lowerMessage.includes('requirement')) {
    return 'application';
  }
  
  return 'general';
}

/**
 * Generate suggested follow-up questions based on assistant response and context
 */
export function getFollowUpQuestions(response: string, context: string): string[] {
  const followUpQuestions: Record<string, string[]> = {
    scholarship: [
      'What are the deadlines?',
      'How to apply?',
      'What are the requirements?',
      'Is it renewable?',
    ],
    program: [
      'What are the entry requirements?',
      'How long is the program?',
      'What is the tuition?',
      'Is it taught in English?',
    ],
    university: [
      'What programs do they offer?',
      'What is the application process?',
      'What scholarships are available?',
      'Where is it located?',
    ],
    application: [
      'What documents do I need?',
      'When is the deadline?',
      'How long does it take?',
      'Can I track my application?',
    ],
    general: [
      'Tell me about scholarships',
      'How do I apply?',
      'What universities are there?',
      'Show me programs',
    ],
  };
  
  // Get base questions for the context
  const baseQuestions = followUpQuestions[context as keyof typeof followUpQuestions] || followUpQuestions.general;
  
  // Shuffle and return 3 unique questions
  const shuffled = [...baseQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}
