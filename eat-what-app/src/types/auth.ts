export interface User {
  id: string;
  email: string;
  user_metadata: {
    email: string;
    username: string;
    email_verified: boolean;
    phone_verified: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  username: string;
  avatar_url?: string;
}

export interface AuthResponse {
  message: string;
  session: Session;
}

export interface RegisterResponse {
  message: string;
  data: {
    session: Session;
    user: User;
  };
}
