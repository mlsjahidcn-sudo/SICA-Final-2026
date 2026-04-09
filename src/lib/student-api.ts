/**
 * Student API Client - Helper functions for authenticated API calls
 */

const TOKEN_KEY = 'sica_auth_token';

// Get auth token from localStorage
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Set auth token
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

// Clear auth token
export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

// Base fetch with auth
export async function authFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid - could redirect to login
        clearAuthToken();
      }
      return { data: null, error: data.error || 'Request failed', status: response.status };
    }

    return { data, error: null, status: response.status };
  } catch (error) {
    return { data: null, error: (error as Error).message, status: 0 };
  }
}

// Student API endpoints
export const studentApi = {
  // Dashboard
  getDashboard: () => 
    authFetch<StudentDashboard>('/api/student/dashboard'),

  // Profile
  getProfile: () => 
    authFetch<StudentProfile>('/api/student/profile'),
  
  updateProfile: (data: UpdateProfileRequest) => 
    authFetch<StudentProfile>('/api/student/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Applications
  getApplications: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return authFetch<ApplicationsResponse>(`/api/student/applications${query ? `?${query}` : ''}`);
  },

  getApplication: (id: string) => 
    authFetch<Application>(`/api/student/applications/${id}`),

  createApplication: (data: CreateApplicationRequest) => 
    authFetch<Application>('/api/student/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateApplication: (id: string, data: Partial<Application>) => 
    authFetch<Application>(`/api/student/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteApplication: (id: string) => 
    authFetch<{ success: boolean }>(`/api/student/applications/${id}`, {
      method: 'DELETE',
    }),

  submitApplication: (id: string) => 
    authFetch<{ success: boolean; application: Application }>(`/api/student/applications/${id}/submit`, {
      method: 'POST',
    }),

  // Documents
  getDocuments: (params?: { application_id?: string; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.application_id) searchParams.set('application_id', params.application_id);
    if (params?.status) searchParams.set('status', params.status);
    const query = searchParams.toString();
    return authFetch<DocumentsResponse>(`/api/student/documents${query ? `?${query}` : ''}`);
  },

  getDocument: (id: string) => 
    authFetch<Document>(`/api/student/documents/${id}`),

  deleteDocument: (id: string) => 
    authFetch<{ success: boolean }>(`/api/student/documents/${id}`, {
      method: 'DELETE',
    }),

  uploadDocument: async (applicationId: string, documentType: string, file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('application_id', applicationId);
    formData.append('document_type', documentType);
    formData.append('file', file);

    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      return { data: null, error: data.error || 'Upload failed', status: response.status };
    }
    return { data, error: null, status: response.status };
  },

  // Meetings
  getMeetings: (params?: { status?: string; upcoming?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.upcoming) searchParams.set('upcoming', 'true');
    const query = searchParams.toString();
    return authFetch<MeetingsResponse>(`/api/student/meetings${query ? `?${query}` : ''}`);
  },

  getMeeting: (id: string) => 
    authFetch<Meeting>(`/api/student/meetings/${id}`),

  // Notifications
  getNotifications: (params?: { type?: string; unread?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.unread) searchParams.set('unread', 'true');
    const query = searchParams.toString();
    return authFetch<NotificationsResponse>(`/api/student/notifications${query ? `?${query}` : ''}`);
  },

  getUnreadNotificationCount: () => 
    authFetch<UnreadCountResponse>('/api/student/notifications/unread-count'),

  markNotificationRead: (id: string) => 
    authFetch<{ success: boolean }>(`/api/student/notifications/${id}/read`, {
      method: 'POST',
    }),

  markAllNotificationsRead: () => 
    authFetch<{ success: boolean }>('/api/student/notifications/read-all', {
      method: 'POST',
    }),

  // Favorites
  getFavorites: (type?: 'university' | 'program') => {
    const searchParams = new URLSearchParams();
    if (type) searchParams.set('type', type);
    const query = searchParams.toString();
    return authFetch<FavoritesResponse>(`/api/student/favorites${query ? `?${query}` : ''}`);
  },

  addFavorite: (entityId: string, entityType: 'university' | 'program') => 
    authFetch<FavoriteResponse>('/api/student/favorites', {
      method: 'POST',
      body: JSON.stringify({ entity_id: entityId, entity_type: entityType }),
    }),

  removeFavorite: (entityId: string, entityType: 'university' | 'program') => {
    const searchParams = new URLSearchParams();
    searchParams.set('entity_id', entityId);
    searchParams.set('entity_type', entityType);
    return authFetch<{ success: boolean; message: string }>(`/api/student/favorites?${searchParams.toString()}`, {
      method: 'DELETE',
    });
  },

  // Check if entity is favorited
  checkFavorite: async (entityId: string, entityType: 'university' | 'program'): Promise<{ data?: { is_favorited: boolean }; error?: string }> => {
    const result = await authFetch<FavoritesResponse>('/api/student/favorites');
    if (result.error) {
      return { error: result.error };
    }
    const isFavorited = result.data?.favorites?.some(f => f.entity_id === entityId && f.entity_type === entityType) ?? false;
    return { data: { is_favorited: isFavorited } };
  },

  // Settings
  getSettings: () => 
    authFetch<SettingsResponse>('/api/student/settings'),

  updateSettings: (data: UpdateSettingsRequest) => 
    authFetch<SettingsResponse>('/api/student/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Type definitions
export interface StudentDashboard {
  stats: {
    total: number;
    draft: number;
    submitted: number;
    underReview: number;
    interviewScheduled: number;
    accepted: number;
    rejected: number;
  };
  upcomingMeetings: Meeting[];
  pendingDocuments: Document[];
  recentApplications: Application[];
  profileCompletion: number;
}

export interface WorkExperienceEntry {
  company: string;
  position: string;
  start_date: string;
  end_date?: string;
  description?: string;
}

export interface EducationHistoryEntry {
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  gpa?: string;
  city?: string;
  country?: string;
}

export interface FamilyMemberEntry {
  name: string;
  relationship: string;
  occupation?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface ExtracurricularActivityEntry {
  activity: string;
  role?: string;
  organization?: string;
  start_date: string;
  end_date?: string;
  description?: string;
}

export interface AwardEntry {
  title: string;
  issuing_organization?: string;
  date?: string;
  description?: string;
  certificate_url?: string;
}

export interface PublicationEntry {
  title: string;
  publisher?: string;
  publication_date?: string;
  url?: string;
  description?: string;
}

export interface ResearchExperienceEntry {
  topic: string;
  institution?: string;
  supervisor?: string;
  start_date: string;
  end_date?: string;
  description?: string;
}

export interface ScholarshipApplicationData {
  type?: string;
  name?: string;
  coverage?: string;
  status?: string;
  notes?: string;
}

export interface FinancialGuaranteeData {
  guarantor_name?: string;
  guarantor_relationship?: string;
  guarantor_occupation?: string;
  annual_income?: string;
  income_currency?: string;
  bank_statement_url?: string;
  sponsor_letter_url?: string;
}

export interface StudentProfile {
  user: {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
  };
  studentProfile?: {
    // Personal information
    nationality?: string;
    date_of_birth?: string;
    gender?: string;
    current_address?: string;
    postal_code?: string;
    permanent_address?: string;
    chinese_name?: string;
    marital_status?: string;
    religion?: string;
    // Emergency contact
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    // Passport information
    passport_number?: string;
    passport_expiry_date?: string;
    passport_issuing_country?: string;
    // Academic information (multiple entries)
    education_history?: EducationHistoryEntry[];
    work_experience?: WorkExperienceEntry[];
    // Legacy single-education fields
    highest_education?: string;
    institution_name?: string;
    field_of_study?: string;
    graduation_date?: string;
    gpa?: string;
    // Language test scores
    hsk_level?: number | string;
    hsk_score?: number | string;
    ielts_score?: string;
    toefl_score?: number | string;
    // Family information
    family_members?: FamilyMemberEntry[];
    // Additional information
    extracurricular_activities?: ExtracurricularActivityEntry[];
    awards?: AwardEntry[];
    publications?: PublicationEntry[];
    research_experience?: ResearchExperienceEntry[];
    scholarship_application?: ScholarshipApplicationData;
    financial_guarantee?: FinancialGuaranteeData;
    // Study preferences
    study_mode?: string;
    funding_source?: string;
    // Communication
    wechat_id?: string;
  };
  profileCompletion: number;
}

export interface UpdateProfileRequest {
  full_name?: string;
  phone?: string;
  student_profile?: {
    // Personal information
    nationality?: string;
    date_of_birth?: string;
    gender?: string;
    current_address?: string;
    postal_code?: string;
    permanent_address?: string;
    chinese_name?: string;
    marital_status?: string;
    religion?: string;
    // Emergency contact
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    // Passport information
    passport_number?: string;
    passport_expiry_date?: string;
    passport_issuing_country?: string;
    // Academic information
    education_history?: EducationHistoryEntry[];
    work_experience?: WorkExperienceEntry[];
    // Legacy single-education fields
    highest_education?: string;
    institution_name?: string;
    field_of_study?: string;
    graduation_date?: string;
    gpa?: string;
    // Language test scores
    hsk_level?: number | string;
    hsk_score?: number | string;
    ielts_score?: string;
    toefl_score?: number | string;
    // Family information
    family_members?: FamilyMemberEntry[];
    // Additional information
    extracurricular_activities?: ExtracurricularActivityEntry[];
    awards?: AwardEntry[];
    publications?: PublicationEntry[];
    research_experience?: ResearchExperienceEntry[];
    scholarship_application?: ScholarshipApplicationData;
    financial_guarantee?: FinancialGuaranteeData;
    // Study preferences
    study_mode?: string;
    funding_source?: string;
    // Communication
    wechat_id?: string;
  };
}

export interface ApplicationsResponse {
  applications: Application[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Application {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  intake?: string;
  personal_statement?: string;
  study_plan?: string;
  notes?: string;
  programs?: {
    id: string;
    name: string;
    degree_level: string;
    discipline?: string;
    tuition_per_year?: number;
    tuition_currency?: string;
    application_deadline_fall?: string;
    application_deadline_spring?: string;
    universities?: {
      id: string;
      name_en: string;
      city: string;
      province?: string;
      logo_url?: string;
    };
  };
  application_documents?: Document[];
}

export interface CreateApplicationRequest {
  program_id: string;
  university_id?: string;
  partner_id?: string;
  personal_statement?: string;
  study_plan?: string;
  intake?: string;
}

export interface DocumentsResponse {
  documents: Document[];
  stats: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
  };
}

export interface Document {
  id: string;
  document_type: string;
  status: string;
  file_url: string;
  file_name?: string;
  file_size?: number;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
  applications?: {
    id: string;
    programs?: {
      id: string;
      name: string;
      universities?: {
        id: string;
        name_en: string;
      };
    };
  };
}

export interface MeetingsResponse {
  meetings: Meeting[];
}

export interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  duration_minutes: number;
  platform: string;
  meeting_url: string;
  meeting_id?: string;
  meeting_password?: string;
  status: string;
  notes?: string;
  created_at: string;
  applications?: {
    id: string;
    programs?: {
      id: string;
      name: string;
      universities?: {
        id: string;
        name_en: string;
        logo_url?: string;
      };
    };
  };
  users?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  link?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface FavoritesResponse {
  favorites: Favorite[];
}

export interface FavoriteResponse {
  success: boolean;
  favorite: Favorite;
  message: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  entity_id: string;
  entity_type: 'university' | 'program';
  created_at: string;
  entity?: {
    id: string;
    name_en: string;
    name_cn?: string;
    city?: string;
    province?: string;
    type?: string;
    logo_url?: string;
    ranking_national?: number;
    degree_type?: string;
    tuition_per_year?: number;
    tuition_currency?: string;
    universities?: {
      id: string;
      name_en: string;
      city?: string;
      logo_url?: string;
    };
  };
}

export interface SettingsResponse {
  settings: UserSettings;
  isDefault?: boolean;
  success?: boolean;
  message?: string;
}

export interface UserSettings {
  id?: string;
  user_id?: string;
  email_notifications: boolean;
  push_notifications: boolean;
  meeting_reminders: boolean;
  application_updates: boolean;
  document_updates: boolean;
  language: 'en' | 'zh';
  timezone: string;
  date_format: string;
  profile_visibility: 'public' | 'partners_only' | 'private';
  show_contact_info: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UpdateSettingsRequest {
  email_notifications?: boolean;
  push_notifications?: boolean;
  meeting_reminders?: boolean;
  application_updates?: boolean;
  document_updates?: boolean;
  language?: 'en' | 'zh';
  timezone?: string;
  date_format?: string;
  profile_visibility?: 'public' | 'partners_only' | 'private';
  show_contact_info?: boolean;
}
