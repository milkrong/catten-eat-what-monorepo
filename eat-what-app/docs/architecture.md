# 项目架构文档

## 系统架构图

![系统架构图](./architecture.svg)

## 1. 系统概述

这是一个基于 Node.js 的膳食计划管理系统，使用 Hono 框架构建 RESTful API，并使用 Supabase 作为后端服务。系统提供了用户认证、膳食计划管理、食谱管理等功能。

## 2. 技术栈

- **后端框架**: Hono.js
- **数据库**: PostgreSQL (通过 Supabase)
- **认证服务**: Supabase Auth
- **API 验证**: Zod
- **运行时**: Bun

## 3. 数据库架构

### 3.1 核心表结构

#### profiles（用户档案）
- id: UUID (主键)
- username: 用户名
- avatar_url: 头像URL
- created_at: 创建时间
- updated_at: 更新时间

#### preferences（用户偏好）
- id: UUID (主键)
- diet_type: 饮食类型数组
- restrictions: 饮食限制数组
- allergies: 过敏源数组
- calories_min: 最小卡路里
- calories_max: 最大卡路里
- max_cooking_time: 最大烹饪时间
- cuisine_type: 菜系类型数组
- meals_per_day: 每日餐数

#### recipes（食谱）
- id: UUID (主键)
- name: 食谱名称
- description: 描述
- ingredients: 食材 (JSONB)
- steps: 步骤 (JSONB)
- calories: 卡路里
- cooking_time: 烹饪时间
- nutrition_facts: 营养成分 (JSONB)
- cuisine_type: 菜系
- diet_type: 饮食类型数组
- created_by: 创建者ID
- views: 浏览次数
- img: 图片URL

#### meal_plans（膳食计划）
- id: UUID (主键)
- user_id: 用户ID
- date: 日期
- meal_type: 餐点类型
- recipe_id: 食谱ID

#### favorites（收藏）
- id: UUID (主键)
- user_id: 用户ID
- recipe_id: 食谱ID

#### settings（用户设置）
- id: UUID (主键)
- user_id: 用户ID
- llm_service: LLM服务类型
- model_name: 模型名称
- is_paid: 是否付费用户
- api_key: API密钥
- api_endpoint: API端点

## 4. API 接口架构

### 4.1 认证接口 (/auth)

- POST /register - 用户注册
- POST /login - 用户登录
- POST /logout - 用户登出
- GET /me - 获取当前用户信息
- POST /refresh - 刷新认证令牌

### 4.2 膳食计划接口 (/meal-plan)

- GET / - 获取用户膳食计划
- POST / - 创建单个膳食计划
- POST /generate - 生成膳食计划
- PUT /:id - 更新膳食计划
- DELETE /:id - 删除膳食计划

### 4.3 食谱接口 (/recipes)

- GET / - 获取食谱列表（支持过滤）
- GET /:id - 获取单个食谱详情
- POST / - 创建新食谱
- PUT /:id - 更新食谱（仅创建者可更新）
- DELETE /:id - 删除食谱（仅创建者可删除）

### 4.4 用户接口 (/users)

- GET /info - 获取用户完整信息（包含个人资料、偏好和设置）
- GET /profile - 获取用户个人资料
- PUT /profile - 更新用户个人资料
- GET /favorites - 获取用户的食谱收藏
- POST /favorites/:recipeId - 添加食谱到收藏
- DELETE /favorites/:recipeId - 从收藏中移除食谱
- GET /preferences - 获取用户偏好设置
- PUT /preferences - 更新用户偏好设置
- GET /settings - 获取用户设置
- PUT /settings - 更新用户设置

### 4.5 推荐接口 (/recommendations)

- POST /single - 获取单餐推荐
- POST /daily - 获取每日推荐
- POST /weekly - 获取每周推荐
- POST /single/stream - 获取单餐推荐（流式响应）
- POST /generate-image - 生成食谱图片

## 5. 服务层架构

系统采用分层架构，主要包含以下层次：

### 5.1 路由层 (routes/)
处理 HTTP 请求路由和基本的请求验证
- auth.routes.ts - 认证相关路由
- user.routes.ts - 用户相关路由
- meal-plan.routes.ts - 膳食计划路由
- recipe.routes.ts - 食谱相关路由
- recommendation.routes.ts - 推荐相关路由

### 5.2 服务层 (services/)
- user.service.ts - 用户相关业务逻辑
- meal-plan.service.ts - 膳食计划业务逻辑
- recipe.service.ts - 食谱相关业务逻辑
- recommendation.service.ts - 推荐服务逻辑
- image.service.ts - 图片生成服务
- cache-warmup.service.ts - 缓存预热服务
- warmup-scheduler.service.ts - 预热调度服务
- coze.service.ts - Coze AI 服务集成
- openai-like.service.ts - OpenAI 兼容服务集成
- ollama.service.ts - Ollama 服务集成

### 5.3 中间件层 (middlewares/)
- auth.ts - 认证中间件

### 5.4 配置层 (config/)
- supabase.ts - Supabase 客户端配置
- db.ts - 数据库配置

### 5.5 工具层 (utils/)
- auth.ts - 认证相关工具函数

## 6. 安全特性

1. 使用 Supabase 提供的认证服务
2. API 接口使用 JWT 进行认证
3. 密码等敏感信息通过 Supabase Auth 加密存储
4. 所有用户相关操作都需要认证
5. 资源访问控制（用户只能访问自己的数据）

## 7. 缓存策略

系统实现了缓存预热机制：
- cache-warmup.service.ts 负责缓存预热逻辑
- warmup-scheduler.service.ts 负责调度缓存预热任务

## 8. 数据库优化

1. 使用 UUID 作为主键
2. 适当的索引设计
3. 使用 JSONB 类型存储复杂数据
4. 添加 updated_at 触发器自动更新时间戳 