/**
 * Integration tests for rate limiting
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { 
  checkRateLimit, 
  createRateLimitMiddleware, 
  rateLimitPresets,
  getClientIP 
} from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const identifier = 'test-user-1';
      const config = { maxRequests: 5, windowMs: 60000 };
      
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(identifier, config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(config.maxRequests - i - 1);
      }
    });

    it('should block requests exceeding limit', () => {
      const identifier = 'test-user-2';
      const config = { maxRequests: 3, windowMs: 60000 };
      
      // Make 3 requests (limit)
      for (let i = 0; i < 3; i++) {
        const result = checkRateLimit(identifier, config);
        expect(result.allowed).toBe(true);
      }
      
      // 4th request should be blocked
      const result = checkRateLimit(identifier, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', async () => {
      const identifier = 'test-user-3';
      const config = { maxRequests: 2, windowMs: 100 }; // 100ms window
      
      // Use up the limit
      checkRateLimit(identifier, config);
      checkRateLimit(identifier, config);
      
      // Should be blocked
      let result = checkRateLimit(identifier, config);
      expect(result.allowed).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be allowed again
      result = checkRateLimit(identifier, config);
      expect(result.allowed).toBe(true);
    });

    it('should track different identifiers independently', () => {
      const config = { maxRequests: 2, windowMs: 60000 };
      
      // User 1 makes 2 requests
      checkRateLimit('user-1', config);
      checkRateLimit('user-1', config);
      
      // User 1 should be blocked
      let result = checkRateLimit('user-1', config);
      expect(result.allowed).toBe(false);
      
      // User 2 should still be allowed
      result = checkRateLimit('user-2', config);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Rate Limit Presets', () => {
    it('should have auth preset configured correctly', () => {
      expect(rateLimitPresets.auth.maxRequests).toBe(10);
      expect(rateLimitPresets.auth.windowMs).toBe(60000);
    });

    it('should have password reset preset configured correctly', () => {
      expect(rateLimitPresets.passwordReset.maxRequests).toBe(5);
      expect(rateLimitPresets.passwordReset.windowMs).toBe(3600000); // 1 hour
    });

    it('should have api preset configured correctly', () => {
      expect(rateLimitPresets.api.maxRequests).toBe(200);
      expect(rateLimitPresets.api.windowMs).toBe(60000);
    });

    it('should have export preset configured correctly', () => {
      expect(rateLimitPresets.export.maxRequests).toBe(20);
      expect(rateLimitPresets.export.windowMs).toBe(60000);
    });

    it('should have upload preset configured correctly', () => {
      expect(rateLimitPresets.upload.maxRequests).toBe(30);
      expect(rateLimitPresets.upload.windowMs).toBe(60000);
    });
  });

  describe('createRateLimitMiddleware', () => {
    it('should create middleware function', () => {
      const middleware = createRateLimitMiddleware(rateLimitPresets.auth);
      expect(typeof middleware).toBe('function');
    });

    it('should use IP from request', () => {
      const middleware = createRateLimitMiddleware(rateLimitPresets.api);
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1'
        }
      });
      
      const result = middleware(request);
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('resetTime');
      expect(result).toHaveProperty('limit');
    });

    it('should allow custom identifier', () => {
      const middleware = createRateLimitMiddleware(rateLimitPresets.api);
      const request = new NextRequest('http://localhost/api/test');
      
      const result = middleware(request, 'custom-user-id');
      expect(result.allowed).toBe(true);
    });

    it('should track requests across multiple calls', () => {
      const middleware = createRateLimitMiddleware({ maxRequests: 2, windowMs: 60000 });
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '10.0.0.1'
        }
      });
      
      // First request
      let result = middleware(request);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
      
      // Second request
      result = middleware(request);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
      
      // Third request - should be blocked
      result = middleware(request);
      expect(result.allowed).toBe(false);
    });
  });

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '203.0.113.1, 70.41.3.18'
        }
      });
      
      const ip = getClientIP(request);
      expect(ip).toBe('203.0.113.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-real-ip': '198.51.100.1'
        }
      });
      
      const ip = getClientIP(request);
      expect(ip).toBe('198.51.100.1');
    });

    it('should extract IP from cf-connecting-ip header (Cloudflare)', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'cf-connecting-ip': '192.0.2.1'
        }
      });
      
      const ip = getClientIP(request);
      expect(ip).toBe('192.0.2.1');
    });

    it('should return "unknown" if no IP headers present', () => {
      const request = new NextRequest('http://localhost/api/test');
      const ip = getClientIP(request);
      expect(ip).toBe('unknown');
    });

    it('should prioritize x-forwarded-for over other headers', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '203.0.113.1',
          'x-real-ip': '198.51.100.1',
          'cf-connecting-ip': '192.0.2.1'
        }
      });
      
      const ip = getClientIP(request);
      expect(ip).toBe('203.0.113.1');
    });
  });

  describe('Rate Limit Response Properties', () => {
    it('should return correct remaining count', () => {
      const identifier = 'test-remaining';
      const config = { maxRequests: 10, windowMs: 60000 };
      
      const result1 = checkRateLimit(identifier, config);
      expect(result1.remaining).toBe(9);
      
      const result2 = checkRateLimit(identifier, config);
      expect(result2.remaining).toBe(8);
    });

    it('should return correct reset time', () => {
      const identifier = 'test-reset-time';
      const config = { maxRequests: 5, windowMs: 60000 };
      
      const result = checkRateLimit(identifier, config);
      expect(result.resetTime).toBeGreaterThan(0);
      expect(result.resetTime).toBeLessThanOrEqual(60);
    });

    it('should return correct limit', () => {
      const identifier = 'test-limit';
      const config = { maxRequests: 15, windowMs: 60000 };
      
      const result = checkRateLimit(identifier, config);
      expect(result.limit).toBe(15);
    });
  });
});

describe('Rate Limiting Integration with API Routes', () => {
  it('should apply rate limiting to password reset endpoint', async () => {
    // In a real integration test, this would make actual HTTP requests
    const middleware = createRateLimitMiddleware(rateLimitPresets.passwordReset);
    const request = new NextRequest('http://localhost/api/auth/change-password', {
      method: 'POST',
      headers: {
        'x-forwarded-for': 'test-ip-1'
      }
    });
    
    // Should allow first 5 requests
    for (let i = 0; i < 5; i++) {
      const result = middleware(request);
      expect(result.allowed).toBe(true);
    }
    
    // Should block 6th request
    const result = middleware(request);
    expect(result.allowed).toBe(false);
  });

  it('should apply rate limiting to export endpoint', async () => {
    const middleware = createRateLimitMiddleware(rateLimitPresets.export);
    const request = new NextRequest('http://localhost/api/admin/export', {
      headers: {
        'x-forwarded-for': 'test-ip-2'
      }
    });
    
    // Should allow first 20 requests
    for (let i = 0; i < 20; i++) {
      const result = middleware(request);
      expect(result.allowed).toBe(true);
    }
    
    // Should block 21st request
    const result = middleware(request);
    expect(result.allowed).toBe(false);
  });

  it('should apply rate limiting to upload endpoint', async () => {
    const middleware = createRateLimitMiddleware(rateLimitPresets.upload);
    const request = new NextRequest('http://localhost/api/student/documents', {
      method: 'POST',
      headers: {
        'x-forwarded-for': 'test-ip-3'
      }
    });
    
    // Should allow first 30 requests
    for (let i = 0; i < 30; i++) {
      const result = middleware(request);
      expect(result.allowed).toBe(true);
    }
    
    // Should block 31st request
    const result = middleware(request);
    expect(result.allowed).toBe(false);
  });
});
