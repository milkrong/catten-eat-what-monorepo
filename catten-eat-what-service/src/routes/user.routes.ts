import { Hono } from "hono";
import type { Variables } from "../types/hono";
import { UserService } from "../services/user.service";
import { supabase } from "../config/supabase";
import { ImageService } from "../services/image.service";

const app = new Hono<{ Variables: Variables }>();
const userService = new UserService();
const imageService = new ImageService();

// 获取用户完整信息（包含个人资料、偏好设置和系统设置）
app.get("/info", async (c) => {
  try {
    const userId = c.get("userId");
    const userInfo = await userService.getUserInfo(userId);

    if (!userInfo) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(userInfo);
  } catch (error) {
    console.error('Error getting user info:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 获取用户信息
app.get("/profile", async (c) => {
  try {
    const userId = c.get("userId");
    const profile = await userService.getProfile(userId);

    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    return c.json(profile);
  } catch (error) {
    console.error('Error getting profile:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 创建用户资料
app.post("/profile", async (c) => {
  try {
    const userId = c.get("userId");
    const data = await c.req.json();
    const profile = await userService.createProfile(userId, data);

    return c.json(profile, 201);
  } catch (error) {
    console.error('Error creating profile:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 更新用户资料
app.put("/profile", async (c) => {
  try {
    const userId = c.get("userId");
    const updates = await c.req.json();
    console.log('update1s', updates, userId);
    const profile = await userService.updateProfile(userId, updates);

    console.log('profile', profile);

    return c.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 获取用户的食谱收藏
app.get("/favorites", async (c) => {
  try {
    const userId = c.get("userId");
    const favorites = await userService.getFavorites(userId);

    return c.json(favorites);
  } catch (error) {
    console.error('Error getting favorites:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 添加食谱到收藏
app.post("/favorites/:recipeId", async (c) => {
  try {
    const userId = c.get("userId");
    const recipeId = c.req.param("recipeId");
    const favorite = await userService.addFavorite(userId, recipeId);

    return c.json({ message: "Recipe added to favorites", favorite });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 从收藏中移除食谱
app.delete("/favorites/:recipeId", async (c) => {
  try {
    const userId = c.get("userId");
    const recipeId = c.req.param("recipeId");
    await userService.removeFavorite(userId, recipeId);

    return c.json({ message: "Recipe removed from favorites" });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 获取用户偏好设置
app.get("/preferences", async (c) => {
  try {
    const userId = c.get("userId");
    const preferences = await userService.getPreferences(userId);

    if (!preferences) {
      return c.json({ error: "Preferences not found" }, 404);
    }

    return c.json(preferences);
  } catch (error) {
    console.error('Error getting preferences:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 更新用户偏好设置
app.put("/preferences", async (c) => {
  try {
    const userId = c.get("userId");
    const updates = await c.req.json();
    const preferences = await userService.upsertPreferences(userId, updates);

    return c.json(preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 获取用户设置
app.get("/settings", async (c) => {
  try {
    const userId = c.get("userId");
    const settings = await userService.getSettings(userId);

    if (!settings) {
      return c.json({ error: "Settings not found" }, 404);
    }

    return c.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 更新用户设置
app.put("/settings", async (c) => {
  try {
    const userId = c.get("userId");
    const updates = await c.req.json();
    const settings = await userService.upsertSettings(userId, updates);

    return c.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 上传头像
app.post("/avatar", async (c) => {
  try {
    const formData = await c.req.formData();
    const avatar = formData.get('avatar');
    
    if (!avatar || !(avatar instanceof File)) {
      return c.json({ error: '请上传头像文件' }, 400);
    }

    // 验证文件类型
    if (!avatar.type.startsWith('image/')) {
      return c.json({ error: '请上传图片文件' }, 400);
    }

    const userId = c.get('userId');
    const fileName = `${userId}-${Date.now()}.webp`; // 使用 WebP 扩展名

    // 将文件转换为 ArrayBuffer
    const arrayBuffer = await avatar.arrayBuffer();

    // 处理图片（压缩和转换为 WebP）
    const processedImageBuffer = await imageService.processUploadedImage(arrayBuffer, {
      width: 400,
      height: 400,
      quality: 80
    });

    // 上传到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('eat-what')
      .upload(fileName, processedImageBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // 获取公开访问URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('eat-what')
      .getPublicUrl(fileName);

    // 更新用户资料
    const profile = await userService.updateProfile(userId, { avatarUrl: publicUrl });

    return c.json({
      message: '头像上传成功',
      profile
    });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export const userRoutes = app;
