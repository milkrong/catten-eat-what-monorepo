import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import auth from '../routes/auth.routes';
import { supabase } from '../config/supabase';

// Mock Clerk Auth
vi.mock('@hono/clerk-auth', () => ({
  getAuth: vi.fn(),
  clerkMiddleware: () => async (c: any, next: any) => next(),
}));

// Mock Supabase
vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('Auth Routes', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/auth', auth);
    vi.clearAllMocks();
  });

  describe('POST /webhook', () => {
    it('should create user in Supabase when receiving user.created webhook', async () => {
      const mockUserData = {
        type: 'user.created',
        data: {
          id: 'clerk_123',
          email_addresses: [{ email_address: 'test@example.com' }],
          username: 'testuser',
        },
      };

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const res = await app.request('/auth/webhook', {
        method: 'POST',
        body: JSON.stringify(mockUserData),
      });

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true });
      expect(mockInsert).toHaveBeenCalledWith({
        clerk_id: 'clerk_123',
        email: 'test@example.com',
        username: 'testuser',
        created_at: expect.any(String),
      });
    });

    it('should handle Supabase error during user creation', async () => {
      const mockUserData = {
        type: 'user.created',
        data: {
          id: 'clerk_123',
          email_addresses: [{ email_address: 'test@example.com' }],
          username: 'testuser',
        },
      };

      const mockError = { message: 'Database error' };
      const mockInsert = vi.fn().mockResolvedValue({ error: mockError });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const res = await app.request('/auth/webhook', {
        method: 'POST',
        body: JSON.stringify(mockUserData),
      });

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Database error' });
    });
  });

  describe('GET /me', () => {
    it('should return user data when authenticated', async () => {
      const mockUserId = 'clerk_123';
      const mockUserData = {
        id: 1,
        clerk_id: mockUserId,
        email: 'test@example.com',
        username: 'testuser',
      };

      vi.mocked(require('@hono/clerk-auth').getAuth).mockReturnValue({
        userId: mockUserId,
      });

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockUserData,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      } as any);

      const res = await app.request('/auth/me');

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(mockUserData);
    });

    it('should return 401 when not authenticated', async () => {
      vi.mocked(require('@hono/clerk-auth').getAuth).mockReturnValue(null);

      const res = await app.request('/auth/me');

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should handle Supabase error', async () => {
      const mockUserId = 'clerk_123';
      vi.mocked(require('@hono/clerk-auth').getAuth).mockReturnValue({
        userId: mockUserId,
      });

      const mockError = { message: 'Database error' };
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      } as any);

      const res = await app.request('/auth/me');

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Database error' });
    });
  });
});
