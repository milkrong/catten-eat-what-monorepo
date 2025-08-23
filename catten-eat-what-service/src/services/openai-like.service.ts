interface OpenAIConfig {
  apiKey: string;
  apiEndpoint: string;
  model?: string;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    delta: {
      content?: string;
      role?: string;
    };
    index: number;
    finish_reason: string | null;
  }[];
}

const SYSTEM_PROMPT = `# Role
你是一位食谱推荐专家，能够根据用户的喜好生成食谱推荐。你的推荐应当营养丰富、易于操作，并且符合用户的饮食需求。

## Skills
### Skill 1: 生成食谱推荐
- 当用户请求食谱推荐时，首先了解用户的饮食偏好、限制和菜系偏好。如果已经了解这些信息，则跳过此步骤。
- 根据用户的偏好，生成以下JSON格式的食谱推荐：
\`\`\`json
{
  "name": "菜品名称",
  "ingredients": [
    {
      "name": "食材名称",
      "amount": 数字,
      "unit": "单位"
    }
  ],
  "calories": 数字,
  "cookingTime": 数字,
  "nutritionFacts": {
    "protein": 数字,
    "fat": 数字,
    "carbs": 数字,
    "fiber": 数字
  },
  "steps": [
    "步骤1",
    "步骤2"
  ],
  "cuisineType": ["菜系1", "菜系2"],
  "dietType": ["饮食类型1", "饮食类型2"]
}
\`\`\`
- 确保所有数值均为纯数字，不要使用分数（如1/2）或带单位的数字。
- 确保\`ingredients\`中的\`amount\`为纯数字，例如：0.5、1、2等。不要使用分数、文字描述或其他非数字形式。任何单位放在\`unit\`中。
- 确保\`ingredients\`中的\`unit\`必须是以下单位之一：克、千克、毫升、升、个、勺、杯、片、根、块、粒、包、袋、瓶、盒、条、瓣、茶匙、汤匙。不要使用空字符串或其他单位。
- 如果需要表示小份量，请使用小数，例如：0.5勺而不是1/2勺。
- 确保输出为有效的JSON格式。
- 不要添加任何额外的解释性文本。
- 仅输出 json 内容包括\`\`\`json和\`\`\`

## Constraints
- 仅讨论与食谱相关的内容，拒绝回答与食谱无关的话题。
- 输出内容必须按照给定格式组织，不得偏离框架要求。
- 确保食谱符合用户的饮食需求和偏好。
- 所有食材必须有明确的数量单位，不允许空单位。
- 所有数值必须为纯数字，不允许使用分数或文字描述。`;

export class OpenAIService {
  private apiKey: string;
  private apiEndpoint: string;
  private model?: string;

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.apiEndpoint = config.apiEndpoint;
    if (config.model) {
      this.model = config.model;
    }
  }

  private validateRecipe(recipe: {
    ingredients: Array<{ name: string; amount: number; unit: string }>;
    calories: number;
    cookingTime: number;
    nutritionFacts: {
      protein: number;
      fat: number;
      carbs: number;
      fiber: number;
    };
  }): void {
    // Validate ingredients
    if (!recipe.ingredients) {
      throw new Error("Ingredients are required");
    }
    for (const ingredient of recipe.ingredients) {
      if (typeof ingredient.amount !== "number") {
        throw new Error(
          `Invalid amount for ingredient ${ingredient.name}: must be a number`
        );
      }
      if (
        ![
          "克",
          "千克",
          "毫升",
          "升",
          "个",
          "勺",
          "杯",
          "片",
          "根",
          "块",
          "粒",
          "包",
          "袋",
          "瓶",
          "盒",
          "条",
          "瓣",
          "茶匙",
          "汤匙",
        ].includes(ingredient.unit)
      ) {
        throw new Error(
          `Invalid unit for ingredient ${ingredient.name}: must be one of the valid units`
        );
      }
    }

    // Validate numeric fields
    if (typeof recipe.calories !== "number") {
      throw new Error("Invalid calories: must be a number");
    }
    if (typeof recipe.cookingTime !== "number") {
      throw new Error("Invalid cooking_time: must be a number");
    }

    // Validate nutrition facts
    const { nutritionFacts } = recipe;
    if (
      typeof nutritionFacts?.protein !== "number" ||
      typeof nutritionFacts?.fat !== "number" ||
      typeof nutritionFacts?.carbs !== "number" ||
      typeof nutritionFacts?.fiber !== "number"
    ) {
      throw new Error("Invalid nutrition_facts: all values must be numbers");
    }
  }

  async createCompletion(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiEndpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.statusText}`);
      }

      const data = (await response.json()) as OpenAIResponse;
      const content = data?.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No content in response");
      }

      // Extract JSON from the response
      const match = content.match(/```json\n([\s\S]*?)\n```/);
      if (!match) {
        throw new Error("Invalid response format: JSON not found");
      }

      const recipeJson = JSON.parse(match[1]);
      const recipe = {
        ingredients: recipeJson.ingredients,
        calories: recipeJson.calories,
        cookingTime: recipeJson.cookingTime,
        nutritionFacts: recipeJson.nutritionFacts
      };
      this.validateRecipe(recipe);
      return match[1];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("LLM API error: Unknown error occurred");
    }
  }

  async createStreamingCompletion(
    prompt: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.apiEndpoint}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("LLM API error: No response body received");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            if (jsonStr === "[DONE]") {
              continue;
            }

            try {
              const data = JSON.parse(jsonStr) as OpenAIStreamResponse;
              const content = data.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.error("Error parsing LLM response:", e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("LLM API error: Unknown error occurred");
    }
  }

  async createEmbedding(text: string): Promise<{ data: { embedding: number[] }[] }> {
    try {
      const response = await fetch(`${this.apiEndpoint}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          input: text,
          model: this.model
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json() as { data: { embedding: number[] }[] };
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  }
}
