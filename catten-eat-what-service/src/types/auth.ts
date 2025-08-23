// src/types/auth.ts
import { User } from '@supabase/supabase-js';

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    user: User;
  }
}

export interface AuthUser extends User {
  user_metadata: {
    role?: string;
    [key: string]: any;
  };
}
