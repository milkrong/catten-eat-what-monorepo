import { Hono } from "hono";
import { RecommendationService } from "../services/recommendation.service";
import { ImageService } from "../services/image.service";
import { checkPaymentMiddleware } from "../middlewares/auth";
import { vectorRecommendationService } from "../services/vector-recommendation.service";
import { qdrantService } from "../services/qdrant.service";

const recommendationRoutes = new Hono();
const recommendationService = new RecommendationService();
const imageService = new ImageService();

// 添加付费检查中间件到所有推荐路由
recommendationRoutes.use("/*", checkPaymentMiddleware);

recommendationRoutes.post("/single", async (c) => {
  try {
    const request = await c.req.json();
    const user_id = c.get("userId");
    request.userId = user_id;

    console.log(request, user_id);
    const recommendation =
      await recommendationService.getSingleMealRecommendation(request);
    return c.json(recommendation);
  } catch (error) {
    console.error("Error getting single meal recommendation:", error);
    return c.json({ error: "Failed to get meal recommendation" }, 500);
  }
});

recommendationRoutes.post("/daily", async (c) => {
  try {
    const request = await c.req.json();
    request.userId = c.get("userId");
    const recommendations =
      await recommendationService.getDailyPlanRecommendation(request);
    return c.json(recommendations);
  } catch (error) {
    console.error("Error getting daily plan recommendation:", error);
    return c.json({ error: "Failed to get daily meal plan" }, 500);
  }
});

recommendationRoutes.post("/weekly", async (c) => {
  try {
    const request = await c.req.json();
    request.userId = c.get("userId");
    const recommendations =
      await recommendationService.getWeeklyPlanRecommendation(request);
    return c.json(recommendations);
  } catch (error) {
    console.error("Error getting weekly plan recommendation:", error);
    return c.json({ error: "Failed to get weekly meal plan" }, 500);
  }
});

recommendationRoutes.post("/single/stream", async (c) => {
  try {
    const request = await c.req.json();
    request.userId = c.get("userId");

    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    // 使用 Web Streams API
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // 启动异步推荐过程
    recommendationService
      .getStreamingSingleMealRecommendation(request, (chunk) => {
        writer.write(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ content: chunk })}\n\n`
          )
        );
      })
      .then(() => {
        writer.write(new TextEncoder().encode("data: [DONE]\n\n"));
        writer.close();
      })
      .catch((error) => {
        console.error("Error in streaming recommendation:", error);
        writer.write(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ error: "Streaming error occurred" })}\n\n`
          )
        );
        writer.close();
      });

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error initializing stream:", error);
    return c.json({ error: "Failed to initialize streaming response" }, 500);
  }
});

recommendationRoutes.post("/generate-image", async (c) => {
  const { recipeName, description, image_size } = await c.req.json();

  if (!recipeName || !description) {
    return c.json({ error: "Recipe name and description are required" }, 400);
  }

  try {
    const imageUrl = await imageService.generateRecipeImage(
      recipeName,
      description,
      image_size
    );
    return c.json({ imageUrl });
  } catch (error) {
    console.error("Error generating recipe image:", error);
    return c.json({ error: "Failed to generate image" }, 500);
  }
});

// 今日推荐接口
recommendationRoutes.get("/today", async (c) => {
  try {
    // 初始化向量数据库
    await qdrantService.initialize();
    
    const limit = Number.parseInt(c.req.query('limit') || '10');
    const page = Number.parseInt(c.req.query('page') || '1');
    const userId = c.req.query('userId');
    
    // 获取推荐
    const recommendations = await vectorRecommendationService.getDailyRecommendations({
      userId,
      limit,
      page
    });
    
    return c.json(recommendations);
  } catch (error) {
    console.error('获取今日推荐失败:', error);
    return c.json({ error: "Failed to get today's recommendations" }, 500);
  }
});

// 相似食谱查询接口
recommendationRoutes.get("/similar/:recipeId", async (c) => {
  try {
    const recipeId = c.req.param('recipeId');
    const limit = Number.parseInt(c.req.query('limit') || '5');
    
    if (!recipeId) {
      return c.json({ error: "Recipe ID is required" }, 400);
    }
    
    // 使用向量推荐服务获取相似食谱
    const recommendations = await vectorRecommendationService.getSimilarRecipes(recipeId, limit);
    
    return c.json(recommendations);
  } catch (error) {
    console.error('获取相似食谱失败:', error);
    return c.json({ error: "Failed to get similar recipes" }, 500);
  }
});

export { recommendationRoutes };
