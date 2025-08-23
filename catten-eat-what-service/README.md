# 猫咪吃什么 API 服务

基于 Bun + Hono + Supabase 构建的食谱推荐和餐饮计划 API 服务。

## 技术栈

- **运行时**: Bun
- **Web 框架**: Hono
- **数据库**: Supabase (PostgreSQL)
- **缓存**: Redis (Upstash)
- **认证**: Clerk
- **测试**: Vitest

## 功能特性

- 用户认证和授权 (Clerk)
- 食谱管理和搜索
- 个性化餐饮计划
- 智能推荐系统
- 用户偏好设置
- 食谱收藏
- 性能优化 (Redis 缓存)

## API 设计

### 认证相关

- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/webhook` - Clerk Webhook 处理 (用户创建回调)

### 食谱相关

- `GET /api/recipes` - 获取食谱列表
- `GET /api/recipes/:id` - 获取单个食谱
- `POST /api/recipes` - 创建食谱 (需要认证)
- `PUT /api/recipes/:id` - 更新食谱 (需要认证)
- `DELETE /api/recipes/:id` - 删除食谱 (需要认证)

### 餐饮计划

- `GET /api/meal-plans` - 获取用户的餐饮计划 (需要认证)
- `POST /api/meal-plans` - 创建餐饮计划 (需要认证)
- `PUT /api/meal-plans/:id` - 更新餐饮计划 (需要认证)
- `DELETE /api/meal-plans/:id` - 删除餐饮计划 (需要认证)

### 推荐系统

- `GET /api/recommendations` - 获取推荐食谱
- `GET /api/recommendations/personalized` - 获取个性化推荐 (需要认证)

### 用户相关

- `GET /api/users/profile` - 获取用户个人资料 (需要认证)
- `PUT /api/users/profile` - 更新用户个人资料 (需要认证)
- `GET /api/users/preferences` - 获取用户偏好 (需要认证)
- `PUT /api/users/preferences` - 更新用户偏好 (需要认证)
- `GET /api/users/settings` - 获取用户设置 (需要认证)
- `PUT /api/users/settings` - 更新用户设置 (需要认证)
- `GET /api/users/info` - 获取用户完整信息（包含个人资料、偏好和设置）(需要认证)

### 收藏管理

- `GET /api/users/favorites` - 获取收藏的食谱 (需要认证)
- `POST /api/users/favorites` - 添加收藏 (需要认证)
- `DELETE /api/users/favorites/:recipeId` - 取消收藏 (需要认证)

## 数据模型

### users (Supabase)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  clerk_id TEXT NOT NULL UNIQUE,
  email TEXT,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### recipes

```sql
CREATE TABLE recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  ingredients JSONB,
  steps JSONB,
  cuisine_type TEXT,
  diet_type TEXT[],
  cooking_time INTEGER,
  calories INTEGER,
  nutrition_facts JSONB,
  image_url TEXT,
  created_by TEXT REFERENCES users(clerk_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### meal_plans

```sql
CREATE TABLE meal_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(clerk_id),
  recipe_id TEXT REFERENCES recipes(id),
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### preferences

```sql
CREATE TABLE preferences (
  id TEXT PRIMARY KEY REFERENCES users(clerk_id),
  diet_type TEXT[],
  allergies TEXT[],
  calories_min INTEGER,
  calories_max INTEGER,
  max_cooking_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### favorites

```sql
CREATE TABLE favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(clerk_id),
  recipe_id TEXT REFERENCES recipes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 性能优化

### 缓存策略

1. **热门食谱缓存**

   - 缓存最受欢迎的 50 个食谱
   - 每 30 分钟更新一次
   - 使用 Redis 存储

2. **最新食谱缓存**

   - 缓存最新的 30 个食谱
   - 随数据更新实时刷新
   - 使用 Redis 存储

3. **用户偏好缓存**
   - 缓存用户的偏好设置
   - 在更新时刷新
   - 使用 Redis 存储

### 预热机制

- 服务启动 5 秒后开始预热
- 每 30 分钟自动预热一次
- 支持手动触发预热
- 预热包括热门食谱和最新食谱

## 开发环境设置

1. 克隆仓库

```bash
git clone <repository-url>
cd catten-eat-what
```

2. 安装依赖

```bash
bun install
```

3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入必要的配置：

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
CLERK_SECRET_KEY=your_clerk_secret_key
REDIS_URL=your_redis_url
```

4. 启动开发服务器

```bash
bun run dev
```

## 测试

运行单元测试：

```bash
bun test
```

运行测试覆盖率报告：

```bash
bun test:coverage
```

## API 文档

详细的 API 文档请参考 `api.http` 文件，可以使用 VSCode 的 REST Client 插件直接测试 API。

## 部署

1. 构建项目

```bash
bun run build
```

2. 启动生产服务器

```bash
bun run start
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License
