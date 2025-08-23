import { Hono } from 'hono';
import {supabase} from '../config/supabase';
import { authMiddleware } from '../middlewares/auth';

const auth = new Hono();

// 用户注册
auth.post('/register', async (c) => {
  try {
    const { email, password, username } = await c.req.json();

    // 使用 Supabase 创建用户
    const {
      data,
      error: signUpError,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (signUpError) {
      throw signUpError;
    }

    return c.json({
      message: '注册成功，请检查邮箱完成验证',
      data,
    });
  } catch (error: any) {
    console.error(error);
    return c.json({ error: error.message }, 400);
  }
});

// 用户登录
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    console.log('email', email);
    console.log('password', password);
    const {
      data: { session },
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return c.json({
      message: '登录成功',
      session,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 401);
  }
});

// 用户登出
auth.post('/logout', authMiddleware, async (c) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }

    return c.json({ message: '退出登录成功' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 刷新 token
auth.post('/refresh', async (c) => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    if (error) {
      throw error;
    }
    if (!session) {
      throw new Error('No session found');
    }

    return c.json({
      message: 'Token 刷新成功',
      session,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 401);
  }
});

export default auth;
