// src/middlewares/auth.ts
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { supabase } from "../config/supabase";
import type { Variables } from "../types/hono";
import { UserService } from "../services/user.service";

// 认证中间件
export const authMiddleware = async (
  c: Context<{ Variables: Variables }>,
  next: Next
) => {
  console.log("authMiddleware");
  const authHeader = c.req.header("Authorization");
  console.log("authHeader", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    console.log("~~~~~", user.id, user);

    // 将用户信息添加到上下文中
    c.set("userId", user.id);
    c.set("user", user);

    await next();
  } catch (error: any) {
    return c.json({ error: "认证失败" }, 401);
  }
};

// 权限检查中间件生成器
export const requireRole = (requiredRole: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user?.user_metadata?.role) {
      throw new HTTPException(403, { message: "没有所需权限" });
    }

    if (user.user_metadata.role !== requiredRole) {
      throw new HTTPException(403, { message: "没有所需权限" });
    }

    await next();
  };
};

// 检查用户付费状态
export async function checkPaymentMiddleware(
  c: Context<{ Variables: Variables }>,
  next: Next
) {
  try {
    console.log("checkPaymentMiddleware");
    const userId = c.get("userId");
    console.log("userId", userId);

    const userService = new UserService();
    const settings = await userService.getSettings(userId);
    console.log("settings", settings);

    // 如果没有设置，默认为未付费状态
    if (!settings) {
      console.log("settings not found");
      return c.json(
        {
          error: "Settings required",
          message: "Please configure your settings first",
        },
        400
      );
    }

    // 如果用户使用自定义服务或已付费，允许访问
    if (settings.llmService === "custom" || settings.isPaid) {
      await next();
      return;
    }

    console.log("payment required");

    return c.json(
      {
        error: "Payment required",
        message:
          "Please upgrade to a paid plan or use a custom service to access this feature",
      },
      402
    );
  } catch (error) {
    console.error("Error in checkPaymentMiddleware:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
}
