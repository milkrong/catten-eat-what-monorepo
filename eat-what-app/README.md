# 猫咪吃什么 - React Native 客户端设计文档

## 技术栈

- **框架**: React Native + Expo
- **状态管理**: Zustand
- **导航**: Expo Router
- **认证**: 自定义认证（使用后端 API）
- **样式**: TailwindCSS + nativewind
- **HTTP 客户端**: Axios
- **本地存储**: AsyncStorage
- **表单处理**: React Hook Form
- **类型检查**: TypeScript
- **测试**: Jest & React Native Testing Library

## 应用架构

## No

### 目录结构

```
app/                    # Expo Router 页面目录
├── (auth)/            # 认证相关页面组
│   ├── login.tsx      # 登录页面
│   ├── register.tsx   # 注册页面
│   └── _layout.tsx    # 认证布局
├── (tabs)/            # 主要标签页面组
│   ├── index.tsx      # 首页（推荐页）
│   ├── recipes/       # 食谱相关页面
│   │   ├── index.tsx  # 食谱列表
│   │   └── [id].tsx   # 食谱详情
│   ├── meal-plans/    # 餐饮计划相关页面
│   │   ├── index.tsx  # 计划列表
│   │   └── [id].tsx   # 计划详情
│   ├── ai/            # AI 对话相关页面
│   │   └── index.tsx  # AI 对话界面
│   ├── profile/       # 个人资料相关页面
│   │   ├── index.tsx  # 个人主页
│   │   └── settings.tsx # 设置页面
│   └── _layout.tsx    # 标签页布局
├── modals/            # 模态框页面
│   ├── filter.tsx     # 筛选模态��
│   └── create-plan.tsx # 创建计划模态框
└── _layout.tsx        # 根布局

src/
├── components/        # 可复用组件
│   ├── ui/           # 基础 UI 组件
│   └── shared/       # 业务组件
├── stores/           # Zustand stores
├── hooks/            # 自定义 hooks
├── utils/            # 工具函数
├── types/            # TypeScript 类型定义
└── constants/        # 常量定义
```

## 数据类型定义

```typescript
// types/auth.ts
interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// types/recipe.ts
interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
  }[];
  steps: {
    order: number;
    description: string;
  }[];
  cuisine_type: string;
  diet_type: string[];
  cooking_time: number;
  calories: number;
  nutrition_facts: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  image_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// types/meal-plan.ts
interface MealPlan {
  id: string;
  user_id: string;
  recipe_id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  created_at: string;
  updated_at: string;
}

// types/preferences.ts
interface UserPreferences {
  id: string;
  diet_type: string[];
  allergies: string[];
  calories_min: number;
  calories_max: number;
  max_cooking_time: number;
  created_at: string;
  updated_at: string;
}
```

## 功能模块

### 1. 认证模块

#### screens

- `LoginScreen`: 登录界面
- `RegisterScreen`: 注册界面
- `ProfileScreen`: 用户信息界面
- `PreferencesScreen`: 用户偏好设置

#### 功能

- Supabase 认证集成
  - 邮箱密码注册
  - 邮箱密码登录
  - Token 刷新
  - 登出功能
- 用户信息展示和编辑
- 偏好设置管理（饮食类型、过敏原等）

### 2. 食谱浏览模块

#### screens

- `RecipeListScreen`: 食谱列表
- `RecipeDetailScreen`: 食谱详情
- `SearchScreen`: 搜索界面
- `FilterScreen`: 筛选界面

#### 功能

- 食谱列表展示（支持分页）
- 详细食谱信息展示
  - 食材清单
  - 步骤说明
  - 营养成分
  - 烹饪时间
- 高级搜索和筛选
  - 按菜系筛选
  - 按烹饪时间筛选
  - 按饮食类型筛选
- 收藏功能
- 分享功能

### 3. 餐饮计划模块

#### screens

- `MealPlanScreen`: 餐饮计划主界面
- `MealPlanCreateScreen`: 创建计划界面
- `MealPlanDetailScreen`: 计划详情界面

#### 功能

- 日历视图展示餐饮计划
- 创建和编辑餐饮计划
  - 选择日期和餐次
  - 选择食谱
- 自动生成餐饮计划
  - 设置时间范围
  - 设置偏好
- 计划提醒设置

### 4. 推荐系统模块

#### screens

- `RecommendationsScreen`: 推荐食谱列表
- `PersonalizedFeedScreen`: 个性化推荐流

#### 功能

- 单餐推荐
- 每日推荐
- 每周推荐
- 实时推荐流

### 5. 收藏管理模块

#### screens

- `FavoritesScreen`: 收藏列表

#### 功能

- 收藏食谱列表
- 快速添加/移除收藏

## API 集成

### 接口封装

```typescript
// api/auth.ts
export const authApi = {
  register: (data: RegisterInput) => axios.post('/api/auth/register', data),
  login: (data: LoginInput) => axios.post('/api/auth/login', data),
  logout: () => axios.post('/api/auth/logout'),
  refreshToken: () => axios.post('/api/auth/refresh'),
  getMe: () => axios.get('/api/auth/me'),
};

// api/recipes.ts
export const recipeApi = {
  getList: (params: RecipeParams) => axios.get('/api/recipes', { params }),
  getById: (id: string) => axios.get(`/api/recipes/${id}`),
  create: (data: RecipeInput) => axios.post('/api/recipes', data),
  update: (id: string, data: RecipeInput) =>
    axios.put(`/api/recipes/${id}`, data),
  delete: (id: string) => axios.delete(`/api/recipes/${id}`),
};

// api/recommendations.ts
export const recommendationApi = {
  getSingle: (preferences: PreferenceInput) =>
    axios.post('/api/recommendations/single', preferences),
  getDaily: (preferences: PreferenceInput) =>
    axios.post('/api/recommendations/daily', preferences),
  getWeekly: (preferences: PreferenceInput) =>
    axios.post('/api/recommendations/weekly', preferences),
  getSingleStream: (preferences: PreferenceInput) =>
    axios.post('/api/recommendations/single/stream', preferences),
};
```

## 状态管理

### Zustand Store 设计

```typescript
// stores/useAuthStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    username: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const response = await axios.post('/api/auth/login', { email, password });
      const { session, user } = response.data;
      await AsyncStorage.setItem('token', session.access_token);
      set({
        token: session.access_token,
        user,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  register: async (email, password, username) => {
    try {
      set({ loading: true, error: null });
      const response = await axios.post('/api/auth/register', {
        email,
        password,
        username,
      });
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  logout: async () => {
    try {
      await axios.post('/api/auth/logout');
      await AsyncStorage.removeItem('token');
      set({ user: null, token: null });
    } catch (error) {
      set({ error: error.message });
    }
  },
  refreshToken: async () => {
    try {
      const response = await axios.post('/api/auth/refresh');
      const { session } = response.data;
      await AsyncStorage.setItem('token', session.access_token);
      set({ token: session.access_token });
    } catch (error) {
      set({ error: error.message });
    }
  },
}));

// stores/useRecipeStore.ts
interface RecipeState {
  list: Recipe[];
  current: Recipe | null;
  loading: boolean;
  error: string | null;
  fetchRecipes: (filters?: RecipeFilters) => Promise<void>;
  fetchRecipe: (id: string) => Promise<void>;
}

export const useRecipeStore = create<RecipeState>((set) => ({
  list: [],
  current: null,
  loading: false,
  error: null,
  fetchRecipes: async (filters) => {
    try {
      set({ loading: true, error: null });
      const response = await recipeApi.getList(filters);
      set({ list: response.data });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  fetchRecipe: async (id) => {
    try {
      set({ loading: true, error: null });
      const response = await recipeApi.getById(id);
      set({ current: response.data });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
}));

// stores/useMealPlanStore.ts
interface MealPlanState {
  plans: MealPlan[];
  loading: boolean;
  error: string | null;
  fetchPlans: (startDate: string, endDate: string) => Promise<void>;
  createPlan: (plan: MealPlanInput) => Promise<void>;
}

export const useMealPlanStore = create<MealPlanState>((set) => ({
  plans: [],
  loading: false,
  error: null,
  fetchPlans: async (startDate, endDate) => {
    try {
      set({ loading: true, error: null });
      const response = await mealPlanApi.getList({ startDate, endDate });
      set({ plans: response.data });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  createPlan: async (plan) => {
    try {
      set({ loading: true, error: null });
      await mealPlanApi.create(plan);
      // 重新获取计划列表
      const response = await mealPlanApi.getList({});
      set({ plans: response.data });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
}));
```

## 组件示例

```typescript
// components/RecipeCard.tsx
interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  onFavorite?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onPress,
  onFavorite,
}) => {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-lg shadow-sm overflow-hidden mb-4"
    >
      <Image source={{ uri: recipe.image_url }} className="w-full h-48" />
      <View className="p-4">
        <Text className="text-lg font-bold mb-2">{recipe.name}</Text>
        <Text className="text-gray-600 mb-4">{recipe.description}</Text>
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Text className="text-gray-500">{recipe.cooking_time}分钟</Text>
            <Text className="text-gray-500 ml-4">{recipe.calories}卡路里</Text>
          </View>
          <Pressable
            onPress={onFavorite}
            className="w-10 h-10 items-center justify-center"
          >
            <HeartIcon className="w-6 h-6 text-red-500" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

// components/MealPlanCard.tsx
interface MealPlanCardProps {
  mealPlan: MealPlan;
  recipe: Recipe;
  onPress?: () => void;
  onDelete?: () => void;
}

export const MealPlanCard: React.FC<MealPlanCardProps> = ({
  mealPlan,
  recipe,
  onPress,
  onDelete,
}) => {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-lg shadow-sm p-4 mb-4"
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-bold">{recipe.name}</Text>
        <Text className="text-gray-500">
          {formatMealType(mealPlan.mealType)}
        </Text>
      </View>
      <Text className="text-gray-600 mb-4">{formatDate(mealPlan.date)}</Text>
      <Pressable
        onPress={onDelete}
        className="bg-red-500 rounded-lg py-2 items-center"
      >
        <Text className="text-white font-medium">删除</Text>
      </Pressable>
    </Pressable>
  );
};
```

## 开发环境设置

1. 初始化项目

```bash
npx react-native init CattenEatWhat --template react-native-template-typescript
```

2. 安装依赖

```bash
yarn add @react-navigation/native @react-navigation/stack zustand @supabase/supabase-js nativewind tailwindcss axios react-hook-form @react-native-async-storage/async-storage react-native-calendars
yarn add -D tailwindcss
```

3. 配置 Tailwind

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
      },
    },
  },
  plugins: [],
};
```

4. 环境变量配置

```env
API_BASE_URL=your_api_url
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 性能优化

### 缓存策略

- 使用 AsyncStorage 缓存常用数据
- 图片预加载和缓存
- API 响应缓存

### 列表优化

- 使用 `FlatList` 实现虚拟列表
- 图片懒加载
- 下拉刷 和上拉加载更多

## 测试策略

### 单元测试

- 组件渲染测试
- Redux actions 和 reducers 测试
- 工具函数测试

### 集成测试

- 页面导航测试
- API 调用测试
- 状态管理测试

## 部署流程

### Android

1. 生成签名密钥
2. 配置 gradle 构建文件
3. 生成 Release APK/Bundle

### iOS

1. 配置证书和 Provisioning Profile
2. 设置版本号和构建号
3. 通过 Xcode 打包上传

## 版本计划

### v1.0.0

- 基础认证功能
- 食谱浏览和搜索
- 基本的餐饮计划
- 收藏功能

### v1.1.0

- 高级搜索和筛选
- 个性化推荐
- 社交分享功能
- 离线支持

### v1.2.0

- 多语言支持
- 深色模式
- 营养分析
- 智能助手
