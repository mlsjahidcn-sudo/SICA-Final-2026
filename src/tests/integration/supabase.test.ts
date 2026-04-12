import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getSupabaseClient, clearSupabaseClient } from '@/storage/database/supabase-client';

/**
 * Integration tests for Supabase database connectivity.
 * 
 * PREREQUISITES:
 * - Set up .env.local with valid Supabase credentials
 * - Ensure the external Supabase database is accessible
 * 
 * Run with: pnpm test src/tests/integration/supabase.test.ts
 */
describe('Supabase Integration', () => {
  beforeAll(() => {
    // Clear any cached client before tests
    clearSupabaseClient();
  });

  afterAll(() => {
    // Clean up after tests
    clearSupabaseClient();
  });

  describe('Connection', () => {
    it('should connect to external Supabase database', async () => {
      const supabase = getSupabaseClient();
      expect(supabase).toBeDefined();

      // Test basic connectivity
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      // Should not have connection errors
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should have correct database URL', async () => {
      const supabaseUrl = process.env.COZE_SUPABASE_URL;
      
      expect(supabaseUrl).toBeDefined();
      expect(supabaseUrl).toContain('maqzxlcsgfpwnfyleoga');
      expect(supabaseUrl).toMatch(/^https:\/\/.*\.supabase\.co$/);
    });
  });

  describe('Service Role Access', () => {
    it('should have service role key configured', () => {
      const serviceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
      expect(serviceKey).toBeDefined();
      expect(serviceKey).toMatch(/^eyJ/);
    });

    it('should be able to query users table (bypass RLS)', async () => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role')
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should be able to query applications table', async () => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('applications')
        .select('id, status, student_id')
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    it('should have valid user roles', async () => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .limit(100);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const validRoles = ['admin', 'partner', 'student'];
      data?.forEach(user => {
        expect(validRoles).toContain(user.role);
      });
    });

    it('should have valid application statuses', async () => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('applications')
        .select('status')
        .limit(100);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      const validStatuses = [
        'draft', 
        'submitted', 
        'under_review', 
        'accepted', 
        'rejected',
        'document_request',
        'interview_scheduled',
        'withdrawn'
      ];
      data?.forEach(app => {
        expect(validStatuses).toContain(app.status);
      });
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time (5s)', async () => {
      const startTime = Date.now();
      
      const supabase = getSupabaseClient();
      await supabase.from('users').select('id').limit(1);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });

    it('should reuse server-side client connection', async () => {
      const client1 = getSupabaseClient();
      const client2 = getSupabaseClient();
      
      // Should be the same instance
      expect(client1).toBe(client2);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing table gracefully', async () => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('nonexistent_table_xyz')
        .select('*')
        .limit(1);

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });
  });
});
