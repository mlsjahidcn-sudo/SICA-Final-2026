/**
 * Shared Document Types Configuration
 * 
 * This file defines all document types used across the student portal
 * to ensure consistency between upload, checklist, and display components.
 */

export interface DocumentTypeConfig {
  en: string
  zh: string
  description: string
  mimeTypes: string[]
  isRequired?: boolean
}

/**
 * Unified document types for all applications
 */
export const DOCUMENT_TYPES: Record<string, DocumentTypeConfig> = {
  // Identity Documents
  passport_copy: {
    en: 'Passport Copy',
    zh: '护照复印件',
    description: 'Valid passport copy (first page with photo)',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  passport_photo: {
    en: 'Passport-size Photo',
    zh: '证件照',
    description: 'Recent passport-size photo meeting Chinese visa requirements',
    mimeTypes: ['image/jpeg', 'image/png'],
  },

  // Academic Documents - High School
  high_school_diploma: {
    en: 'High School Diploma (Notarized)',
    zh: '高中毕业证（公证）',
    description: 'High school graduation certificate with notarization',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  high_school_transcript: {
    en: 'High School Transcript (Notarized)',
    zh: '高中成绩单（公证）',
    description: 'Academic transcript from high school with notarization',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },

  // Academic Documents - Bachelor
  bachelor_diploma: {
    en: 'Bachelor Diploma (Notarized)',
    zh: '学士学位证（公证）',
    description: 'Bachelor degree certificate with notarization',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  bachelor_transcript: {
    en: 'Bachelor Transcript (Notarized)',
    zh: '本科成绩单（公证）',
    description: 'Academic transcript from bachelor studies with notarization',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },

  // Academic Documents - Master
  master_diploma: {
    en: 'Master Diploma (Notarized)',
    zh: '硕士学位证（公证）',
    description: 'Master degree certificate with notarization',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  master_transcript: {
    en: 'Master Transcript (Notarized)',
    zh: '硕士成绩单（公证）',
    description: 'Academic transcript from master studies with notarization',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },

  // Language Proficiency
  hsk_certificate: {
    en: 'HSK Certificate',
    zh: 'HSK证书',
    description: 'Chinese proficiency test (HSK) certificate',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  ielts_toefl_report: {
    en: 'IELTS/TOEFL Score Report',
    zh: '雅思/托福成绩单',
    description: 'English proficiency test score report',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  language_certificate: {
    en: 'Language Certificate',
    zh: '语言证书',
    description: 'HSK, IELTS, TOEFL or other language test certificate',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },

  // Application Documents
  cv_resume: {
    en: 'CV/Resume',
    zh: '简历',
    description: 'Curriculum vitae or resume',
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  study_plan: {
    en: 'Study Plan',
    zh: '学习计划',
    description: 'Detailed study plan for your program',
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  personal_statement_doc: {
    en: 'Personal Statement',
    zh: '个人陈述',
    description: 'Statement of purpose / motivation letter',
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },

  // Recommendation Letters
  recommendation_letter_1: {
    en: 'Recommendation Letter 1',
    zh: '推荐信1',
    description: 'First academic recommendation letter',
    mimeTypes: ['application/pdf'],
  },
  recommendation_letter_2: {
    en: 'Recommendation Letter 2',
    zh: '推荐信2',
    description: 'Second academic recommendation letter',
    mimeTypes: ['application/pdf'],
  },
  recommendation: {
    en: 'Recommendation Letter',
    zh: '推荐信',
    description: 'Academic recommendation letter(s)',
    mimeTypes: ['application/pdf'],
  },

  // Research Documents
  research_proposal: {
    en: 'Research Proposal',
    zh: '研究计划',
    description: 'Detailed research proposal for PhD studies',
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },

  // Financial Documents
  financial_proof: {
    en: 'Financial Proof',
    zh: '财力证明',
    description: 'Bank statement showing financial capability',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  bank_statement: {
    en: 'Bank Statement',
    zh: '银行证明',
    description: 'Bank statement for financial guarantee',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  sponsor_letter: {
    en: 'Sponsor Letter',
    zh: '资助信',
    description: 'Financial sponsor declaration letter',
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },

  // Health & Legal
  health_exam: {
    en: 'Health Examination Form',
    zh: '体检表',
    description: 'Foreigner Physical Examination Form',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  medical_exam: {
    en: 'Medical Exam Report',
    zh: '体检报告',
    description: 'Medical examination report',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  non_criminal_record: {
    en: 'Non-criminal Record',
    zh: '无犯罪记录',
    description: 'Police clearance certificate',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  police_clearance: {
    en: 'Police Clearance',
    zh: '无犯罪记录',
    description: 'Police clearance certificate',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },

  // Other
  other: {
    en: 'Other Document',
    zh: '其他文档',
    description: 'Additional supporting document',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
}

/**
 * Required documents by degree level
 * These are the mandatory documents for each degree type
 */
export const REQUIRED_DOCUMENTS_BY_DEGREE: Record<string, string[]> = {
  Bachelor: [
    'passport_copy',
    'high_school_diploma',
    'high_school_transcript',
    'hsk_certificate',
    'ielts_toefl_report',
    'passport_photo',
    'health_exam',
    'non_criminal_record',
    'financial_proof',
  ],
  Master: [
    'passport_copy',
    'bachelor_diploma',
    'bachelor_transcript',
    'hsk_certificate',
    'ielts_toefl_report',
    'passport_photo',
    'cv_resume',
    'study_plan',
    'recommendation_letter_1',
    'recommendation_letter_2',
    'health_exam',
    'non_criminal_record',
    'financial_proof',
  ],
  PhD: [
    'passport_copy',
    'master_diploma',
    'master_transcript',
    'bachelor_diploma',
    'bachelor_transcript',
    'hsk_certificate',
    'ielts_toefl_report',
    'passport_photo',
    'cv_resume',
    'study_plan',
    'recommendation_letter_1',
    'recommendation_letter_2',
    'research_proposal',
    'health_exam',
    'non_criminal_record',
    'financial_proof',
  ],
}

/**
 * Get document type label
 */
export function getDocumentTypeLabel(type: string, language: 'en' | 'zh' = 'en'): string {
  const config = DOCUMENT_TYPES[type]
  if (!config) return type
  return language === 'en' ? config.en : config.zh
}

/**
 * Get document type description
 */
export function getDocumentTypeDescription(type: string): string {
  const config = DOCUMENT_TYPES[type]
  return config?.description || ''
}

/**
 * Get allowed MIME types for a document type
 */
export function getAllowedMimeTypes(type: string): string[] {
  const config = DOCUMENT_TYPES[type]
  return config?.mimeTypes || ['application/pdf', 'image/jpeg', 'image/png']
}

/**
 * Validate if a MIME type is allowed for a document type
 */
export function isMimeTypeAllowed(documentType: string, mimeType: string): boolean {
  const allowedTypes = getAllowedMimeTypes(documentType)
  return allowedTypes.includes(mimeType)
}

/**
 * Get all document types as an array for select dropdowns
 */
export function getDocumentTypeOptions(): Array<{ value: string; label: string; description: string }> {
  return Object.entries(DOCUMENT_TYPES).map(([key, config]) => ({
    value: key,
    label: config.en,
    description: config.description,
  }))
}

/**
 * Legacy type mappings for backward compatibility
 * Maps old document type keys to new unified keys
 */
export const LEGACY_TYPE_MAPPING: Record<string, string> = {
  // Old upload API types -> new unified types
  passport: 'passport_copy',
  diploma: 'bachelor_diploma', // Default to bachelor, context-dependent
  transcript: 'bachelor_transcript', // Default to bachelor, context-dependent
  photo: 'passport_photo',
  cv: 'cv_resume',
  // Keep these as-is since they match
  language_certificate: 'language_certificate',
  recommendation: 'recommendation',
  study_plan: 'study_plan',
  financial_proof: 'financial_proof',
  medical_exam: 'medical_exam',
  police_clearance: 'police_clearance',
  other: 'other',
}

/**
 * Convert legacy document type to new unified type
 */
export function normalizeDocumentType(type: string): string {
  return LEGACY_TYPE_MAPPING[type] || type
}

/**
 * Reverse mapping: new unified types -> legacy types
 * Used for backward compatibility with frontend
 */
export const REVERSE_TYPE_MAPPING: Record<string, string> = {
  'passport_copy': 'passport',
  'passport_photo': 'photo',
  'high_school_diploma': 'diploma',
  'high_school_transcript': 'transcript',
  'bachelor_diploma': 'diploma',
  'bachelor_transcript': 'transcript',
  'master_diploma': 'diploma',
  'master_transcript': 'transcript',
  'cv_resume': 'cv',
  // Keep these as-is since they match
  'language_certificate': 'language_certificate',
  'recommendation_letter_1': 'recommendation',
  'recommendation_letter_2': 'recommendation',
  'recommendation': 'recommendation',
  'study_plan': 'study_plan',
  'personal_statement_doc': 'personal_statement',
  'financial_proof': 'financial_proof',
  'bank_statement': 'financial_proof',
  'sponsor_letter': 'financial_proof',
  'health_exam': 'medical_exam',
  'medical_exam': 'medical_exam',
  'non_criminal_record': 'police_clearance',
  'police_clearance': 'police_clearance',
  'hsk_certificate': 'language_certificate',
  'ielts_toefl_report': 'language_certificate',
  'research_proposal': 'study_plan',
  'other': 'other',
}

/**
 * Convert new unified document type to legacy type for display
 */
export function denormalizeDocumentType(type: string): string {
  return REVERSE_TYPE_MAPPING[type] || type
}
