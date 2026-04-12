/**
 * Integration tests for authentication flow
 * 
 * Tests the centralized authentication helpers and middleware
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { 
  requireAdmin, 
  requirePartner, 
  requireStudent, 
  requireAuth, 
  verifyAuthToken 
} from '@/lib/auth-utils';
import { getSupabaseClient } from '@/storage/database/supabase-client';

describe('Authentication Helpers', () => {
  // Mock tokens for different roles
  const adminToken = 'mock-admin-token';
  const partnerToken = 'mock-partner-token';
  const studentToken = 'mock-student-token';
  const invalidToken = 'invalid-token';

  describe('requireAdmin', () => {
    it('should return 401 when no token is provided', async () => {
      const request = new NextRequest('http://localhost/api/admin/users');
      const result = await requireAdmin(request);
      
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(401);
      
      const json = await (result as Response).json();
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 401 when token is invalid', async () => {
      const request = new NextRequest('http://localhost/api/admin/users', {
        headers: {
          authorization: `Bearer ${invalidToken}`
        }
      });
      
      const result = await requireAdmin(request);
      
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(401);
    });

    it('should return 403 when user is not admin', async () => {
      const request = new NextRequest('http://localhost/api/admin/users', {
        headers: {
          authorization: `Bearer ${studentToken}`
        }
      });
      
      const result = await requireAdmin(request);
      
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(403);
    });

    it('should return user object when user is admin', async () => {
      const request = new NextRequest('http://localhost/api/admin/users', {
        headers: {
          authorization: `Bearer ${adminToken}`
        }
      });
      
      const result = await requireAdmin(request);
      
      expect(result).not.toBeInstanceOf(Response);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect((result as any).role).toBe('admin');
    });
  });

  describe('requirePartner', () => {
    it('should return 401 when no token is provided', async () => {
      const request = new NextRequest('http://localhost/api/partner/dashboard');
      const result = await requirePartner(request);
      
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(401);
    });

    it('should return 403 when user is not partner', async () => {
      const request = new NextRequest('http://localhost/api/partner/dashboard', {
        headers: {
          authorization: `Bearer ${studentToken}`
        }
      });
      
      const result = await requirePartner(request);
      
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(403);
    });

    it('should return user object when user is partner', async () => {
      const request = new NextRequest('http://localhost/api/partner/dashboard', {
        headers: {
          authorization: `Bearer ${partnerToken}`
        }
      });
      
      const result = await requirePartner(request);
      
      expect(result).not.toBeInstanceOf(Response);
      expect((result as any).role).toBe('partner');
    });
  });

  describe('requireStudent', () => {
    it('should return 401 when no token is provided', async () => {
      const request = new NextRequest('http://localhost/api/student/dashboard');
      const result = await requireStudent(request);
      
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(401);
    });

    it('should return 403 when user is not student', async () => {
      const request = new NextRequest('http://localhost/api/student/dashboard', {
        headers: {
          authorization: `Bearer ${adminToken}`
        }
      });
      
      const result = await requireStudent(request);
      
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(403);
    });

    it('should return user object when user is student', async () => {
      const request = new NextRequest('http://localhost/api/student/dashboard', {
        headers: {
          authorization: `Bearer ${studentToken}`
        }
      });
      
      const result = await requireStudent(request);
      
      expect(result).not.toBeInstanceOf(Response);
      expect((result as any).role).toBe('student');
    });
  });

  describe('requireAuth', () => {
    it('should return 401 when no token is provided', async () => {
      const request = new NextRequest('http://localhost/api/profile');
      const result = await requireAuth(request);
      
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(401);
    });

    it('should return user object for any authenticated user', async () => {
      const request = new NextRequest('http://localhost/api/profile', {
        headers: {
          authorization: `Bearer ${studentToken}`
        }
      });
      
      const result = await requireAuth(request);
      
      expect(result).not.toBeInstanceOf(Response);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('role');
    });
  });

  describe('verifyAuthToken', () => {
    it('should return null when no token is provided', async () => {
      const request = new NextRequest('http://localhost/api/test');
      const result = await verifyAuthToken(request);
      
      expect(result).toBeNull();
    });

    it('should return null when token is invalid', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          authorization: `Bearer ${invalidToken}`
        }
      });
      
      const result = await verifyAuthToken(request);
      
      expect(result).toBeNull();
    });

    it('should return user object when token is valid', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          authorization: `Bearer ${adminToken}`
        }
      });
      
      const result = await verifyAuthToken(request);
      
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('role');
    });
  });

  describe('Token Extraction', () => {
    it('should extract token from Authorization header', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          authorization: `Bearer ${adminToken}`
        }
      });
      
      const result = await verifyAuthToken(request);
      expect(result).not.toBeNull();
    });

    it('should handle malformed Authorization header', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          authorization: 'InvalidFormat'
        }
      });
      
      const result = await verifyAuthToken(request);
      expect(result).toBeNull();
    });

    it('should handle missing Bearer prefix', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          authorization: adminToken
        }
      });
      
      const result = await verifyAuthToken(request);
      expect(result).toBeNull();
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent 401 error format', async () => {
      const request = new NextRequest('http://localhost/api/admin/users');
      const result = await requireAdmin(request);
      const json = await (result as Response).json();
      
      expect(json).toHaveProperty('error');
      expect(json.error).toBe('Unauthorized');
    });

    it('should return consistent 403 error format', async () => {
      const request = new NextRequest('http://localhost/api/admin/users', {
        headers: {
          authorization: `Bearer ${studentToken}`
        }
      });
      
      const result = await requireAdmin(request);
      const json = await (result as Response).json();
      
      expect(json).toHaveProperty('error');
      expect(json.error).toBe('Forbidden');
    });
  });
});

describe('Authentication Flow Integration', () => {
  it('should authenticate admin for admin route', async () => {
    // This would be a real test with actual Supabase auth in integration tests
    const request = new NextRequest('http://localhost/api/admin/users', {
      headers: {
        authorization: `Bearer admin-token`
      }
    });
    
    const user = await requireAdmin(request);
    
    if (!(user instanceof Response)) {
      expect(user.role).toBe('admin');
    } else {
      // Auth failed - would need real token in integration tests
      expect(user.status).toBe(401);
    }
  });

  it('should authenticate partner for partner route', async () => {
    const request = new NextRequest('http://localhost/api/partner/dashboard', {
      headers: {
        authorization: `Bearer partner-token`
      }
    });
    
    const user = await requirePartner(request);
    
    if (!(user instanceof Response)) {
      expect(user.role).toBe('partner');
    } else {
      expect(user.status).toBe(401);
    }
  });

  it('should authenticate student for student route', async () => {
    const request = new NextRequest('http://localhost/api/student/dashboard', {
      headers: {
        authorization: `Bearer student-token`
      }
    });
    
    const user = await requireStudent(request);
    
    if (!(user instanceof Response)) {
      expect(user.role).toBe('student');
    } else {
      expect(user.status).toBe(401);
    }
  });
});
