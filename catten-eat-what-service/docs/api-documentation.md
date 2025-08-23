# API 文档

本文档提供了所有可用的 API 接口信息，包括请求方法、URL、参数说明和响应格式。

## 目录

- [用户相关](#用户相关)
- [认证相关](#认证相关)
- [食谱相关](#食谱相关)
- [推荐相关](#推荐相关)
- [膳食计划相关](#膳食计划相关)
- [管理员相关](#管理员相关)

## 用户相关

### 上传用户头像

**请求方法**: POST  
**URL**: `/api/user/avatar`  
**描述**: 上传并处理用户头像图片  
**认证要求**: 需要用户登录

**请求体**:

- `avatar`: 图片文件 (FormData)

**响应**:

```json
{
  "avatarUrl": "https://example.com/path/to/image.webp"
}
```

**错误响应**:

```json
{
  "error": "错误信息"
}
```

### 获取用户信息

**请求方法**: GET  
**URL**: `/api/user/profile`  
**描述**: 获取当前登录用户的个人信息  
**认证要求**: 需要用户登录

**响应**:

```json
{
  "id": "user-id",
  "name": "用户名",
  "email": "user@example.com",
  "avatarUrl": "https://example.com/path/to/avatar.webp",
  "preferences": {
    // 用户偏好设置
  }
}
```

### 更新用户信息

**请求方法**: PUT  
**URL**: `/api/user/profile`  
**描述**: 更新当前登录用户的个人信息  
**认证要求**: 需要用户登录

**请求体**:

```json
{
  "name": "新用户名",
  "preferences": {
    // 更新的偏好设置
  }
}
```

**响应**:

```json
{
  "id": "user-id",
  "name": "新用户名",
  "email": "user@example.com",
  "avatarUrl": "https://example.com/path/to/avatar.webp",
  "preferences": {
    // 更新后的偏好设置
  }
}
```

## 认证相关

### 用户登录

**请求方法**: POST  
**URL**: `/api/auth/login`  
**描述**: 用户登录并获取认证令牌

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "name": "用户名",
    "email": "user@example.com"
  }
}
```

### 用户注册

**请求方法**: POST  
**URL**: `/api/auth/register`  
**描述**: 创建新用户账户

**请求体**:

```json
{
  "name": "用户名",
  "email": "user@example.com",
  "password": "password123"
}
```

**响应**:

```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "name": "用户名",
    "email": "user@example.com"
  }
}
```

### 刷新令牌

**请求方法**: POST  
**URL**: `/api/auth/refresh`  
**描述**: 使用刷新令牌获取新的访问令牌  
**认证要求**: 需要有效的刷新令牌

**响应**:

```json
{
  "token": "new-jwt-token"
}
```

## 食谱相关

### 获取食谱列表

**请求方法**: GET  
**URL**: `/api/recipes`  
**描述**: 获取食谱列表，支持分页和多种过滤条件

**查询参数**:

- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)
- `cuisineType`: 菜系类型
- `maxCookingTime`: 最大烹饪时间（分钟）
- `dietType`: 饮食类型，多个值用逗号分隔
- `name`: 按名称搜索
- `minCalories`: 最小卡路里
- `maxCalories`: 最大卡路里
- `sortBy`: 排序字段 (默认: createdAt)
- `sortOrder`: 排序方向 (asc/desc, 默认: desc)

**响应**:

```json
{
  "data": [
    {
      "id": "recipe-id",
      "name": "食谱名称",
      "description": "食谱描述",
      "cookingTime": 30,
      "calories": 350,
      "imageUrl": "https://example.com/path/to/image.jpg",
      "cuisineType": "中式",
      "dietType": ["素食"],
      "ingredients": [
        {
          "name": "食材名称",
          "amount": "100g"
        }
      ],
      "steps": ["步骤1", "步骤2"]
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### 获取食谱详情

**请求方法**: GET  
**URL**: `/api/recipes/:id`  
**描述**: 获取特定食谱的详细信息

**路径参数**:

- `id`: 食谱 ID

**响应**:

```json
{
  "id": "recipe-id",
  "name": "食谱名称",
  "description": "食谱描述",
  "cookingTime": 30,
  "calories": 350,
  "imageUrl": "https://example.com/path/to/image.jpg",
  "cuisineType": "中式",
  "dietType": ["素食"],
  "ingredients": [
    {
      "name": "食材名称",
      "amount": "100g"
    }
  ],
  "steps": ["步骤1", "步骤2"],
  "nutrition": {
    "protein": "10g",
    "fat": "5g",
    "carbs": "30g"
  }
}
```

## 推荐相关

### 获取个性化食谱推荐

**请求方法**: GET  
**URL**: `/api/recommendations`  
**描述**: 根据用户偏好获取个性化食谱推荐  
**认证要求**: 需要用户登录

**查询参数**:

- `limit`: 推荐数量 (默认: 5)

**响应**:

```json
{
  "recommendations": [
    {
      "id": "recipe-id",
      "name": "食谱名称",
      "description": "食谱描述",
      "cookingTime": 30,
      "calories": 350,
      "imageUrl": "https://example.com/path/to/image.jpg",
      "cuisineType": "中式",
      "matchScore": 0.95
    }
  ]
}
```

### 获取热门食谱

**请求方法**: GET  
**URL**: `/api/recipes/popular`  
**描述**: 获取热门食谱列表

**查询参数**:

- `limit`: 返回数量 (默认: 10)

**响应**:

```json
{
  "popular": [
    {
      "id": "recipe-id",
      "name": "食谱名称",
      "description": "食谱描述",
      "cookingTime": 30,
      "calories": 350,
      "imageUrl": "https://example.com/path/to/image.jpg",
      "viewCount": 1500
    }
  ]
}
```

### 获取今日推荐

**请求方法**: GET  
**URL**: `/api/recommendations/today`  
**描述**: 获取基于向量相似度的今日推荐食谱
**认证要求**: 登录后能获得个性化推荐，未登录时提供通用推荐

**查询参数**:

- `limit`: 返回数量 (默认: 10)
- `page`: 页码 (默认: 1)
- `userId`: 用户 ID (登录用户可选)

**响应**:

```json
{
  "recipes": [
    {
      "id": "recipe-id",
      "name": "食谱名称",
      "description": "食谱描述",
      "cookingTime": 30,
      "calories": 350,
      "cuisineType": "中式",
      "dietType": ["素食"],
      "img": "https://example.com/path/to/image.jpg"
    }
  ],
  "title": "今日推荐"
}
```

### 获取相似食谱

**请求方法**: GET  
**URL**: `/api/recommendations/similar/:recipeId`  
**描述**: 根据指定的食谱 ID 查找相似的食谱

**路径参数**:

- `recipeId`: 食谱 ID

**查询参数**:

- `limit`: 返回数量 (默认: 5)

**响应**:

```json
{
  "recipes": [
    {
      "id": "similar-recipe-id",
      "name": "相似食谱名称",
      "description": "食谱描述",
      "cookingTime": 25,
      "calories": 320,
      "cuisineType": "中式",
      "dietType": ["素食"],
      "img": "https://example.com/path/to/image.jpg"
    }
  ],
  "title": "相似食谱"
}
```

## 膳食计划相关

### 创建膳食计划

**请求方法**: POST  
**URL**: `/api/meal-plans`  
**描述**: 创建新的膳食计划  
**认证要求**: 需要用户登录

**请求体**:

```json
{
  "name": "我的一周计划",
  "startDate": "2023-06-01",
  "endDate": "2023-06-07",
  "meals": [
    {
      "date": "2023-06-01",
      "mealType": "breakfast",
      "recipeId": "recipe-id-1"
    },
    {
      "date": "2023-06-01",
      "mealType": "lunch",
      "recipeId": "recipe-id-2"
    }
  ]
}
```

**响应**:

```json
{
  "id": "meal-plan-id",
  "name": "我的一周计划",
  "startDate": "2023-06-01",
  "endDate": "2023-06-07",
  "meals": [
    {
      "id": "meal-id-1",
      "date": "2023-06-01",
      "mealType": "breakfast",
      "recipe": {
        "id": "recipe-id-1",
        "name": "早餐食谱",
        "imageUrl": "https://example.com/path/to/image.jpg"
      }
    },
    {
      "id": "meal-id-2",
      "date": "2023-06-01",
      "mealType": "lunch",
      "recipe": {
        "id": "recipe-id-2",
        "name": "午餐食谱",
        "imageUrl": "https://example.com/path/to/image.jpg"
      }
    }
  ]
}
```

### 获取用户膳食计划

**请求方法**: GET  
**URL**: `/api/meal-plans`  
**描述**: 获取当前用户的所有膳食计划  
**认证要求**: 需要用户登录

**响应**:

```json
{
  "mealPlans": [
    {
      "id": "meal-plan-id",
      "name": "我的一周计划",
      "startDate": "2023-06-01",
      "endDate": "2023-06-07",
      "createdAt": "2023-05-30T12:00:00Z"
    }
  ]
}
```

### 获取膳食计划详情

**请求方法**: GET  
**URL**: `/api/meal-plans/:id`  
**描述**: 获取特定膳食计划的详细信息  
**认证要求**: 需要用户登录

**路径参数**:

- `id`: 膳食计划 ID

**响应**:

```json
{
  "id": "meal-plan-id",
  "name": "我的一周计划",
  "startDate": "2023-06-01",
  "endDate": "2023-06-07",
  "meals": [
    {
      "id": "meal-id-1",
      "date": "2023-06-01",
      "mealType": "breakfast",
      "recipe": {
        "id": "recipe-id-1",
        "name": "早餐食谱",
        "cookingTime": 15,
        "calories": 250,
        "imageUrl": "https://example.com/path/to/image.jpg"
      }
    }
  ],
  "nutritionSummary": {
    "totalCalories": 8750,
    "averageCaloriesPerDay": 1250,
    "macroDistribution": {
      "protein": "25%",
      "fat": "30%",
      "carbs": "45%"
    }
  }
}
```

## 管理员相关

### 缓存预热状态

**请求方法**: GET  
**URL**: `/api/admin/cache/warmup/status`  
**描述**: 获取缓存预热的当前状态  
**认证要求**: 需要管理员权限

**响应**:

```json
{
  "isRunning": true,
  "progress": 65,
  "startedAt": "2023-06-01T10:00:00Z",
  "estimatedCompletion": "2023-06-01T10:15:00Z"
}
```

### 启动缓存预热

**请求方法**: POST  
**URL**: `/api/admin/cache/warmup/start`  
**描述**: 启动缓存预热过程  
**认证要求**: 需要管理员权限

**响应**:

```json
{
  "success": true,
  "sessionId": "warmup-session-id",
  "startedAt": "2023-06-01T10:00:00Z"
}
```

### 获取缓存预热会话列表

**请求方法**: GET  
**URL**: `/api/admin/cache/warmup/sessions`  
**描述**: 获取最近的缓存预热会话列表  
**认证要求**: 需要管理员权限

**查询参数**:

- `limit`: 返回数量 (默认: 10)

**响应**:

```json
{
  "sessions": [
    {
      "id": "warmup-session-id",
      "startedAt": "2023-06-01T10:00:00Z",
      "completedAt": "2023-06-01T10:15:00Z",
      "status": "completed",
      "itemsProcessed": 1500,
      "totalItems": 1500
    }
  ]
}
```

### 获取向量数据库状态

**请求方法**: GET  
**URL**: `/api/admin/vector-db/status`  
**描述**: 获取向量数据库的当前状态  
**认证要求**: 需要管理员权限

**响应**:

```json
{
  "success": true,
  "status": "connected",
  "recipeCount": 1250
}
```

### 从 Excel 导入食谱

**请求方法**: POST  
**URL**: `/api/admin/recipes/import/excel`  
**描述**: 从 Excel 文件导入食谱数据并向量化  
**认证要求**: 需要管理员权限

**请求体**:

- `file`: Excel 文件 (FormData)

**响应**:

```json
{
  "success": true,
  "message": "成功导入 42 个食谱，失败 3 个",
  "data": {
    "total": 45,
    "success": 42,
    "failed": 3,
    "failures": [
      {
        "recipe": "失败的食谱名",
        "error": "错误原因"
      }
    ]
  }
}
```

### 从 URL 导入食谱

**请求方法**: POST  
**URL**: `/api/admin/recipes/import/url`  
**描述**: 从网页 URL 导入食谱数据并向量化  
**认证要求**: 需要管理员权限

**请求体**:

```json
{
  "url": "https://example.com/recipes-page"
}
```

**响应**:

```json
{
  "success": true,
  "message": "成功导入 15 个食谱，失败 2 个",
  "data": {
    "total": 17,
    "success": 15,
    "failed": 2,
    "failures": [
      {
        "recipe": "失败的食谱名",
        "error": "错误原因"
      }
    ]
  }
}
```
