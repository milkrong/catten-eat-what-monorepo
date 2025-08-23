interface ImageGenerationResponse {
  data: Array<{
    url: string;
  }>;
}

export class ImageService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.SILICONFLOW_API_KEY!;
    this.apiUrl = `${process.env.SILICONFLOW_API_ENDPOINT!}/images/generations`;
  }

  async generateRecipeImage(
    recipeName: string,
    description: string,
    image_size = "512x512"
  ): Promise<string> {
    const prompt = `A delicious looking dish of ${recipeName}. ${description}. Food photography style, professional lighting, high resolution, appetizing presentation`;

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.SILICONFLOW_PICTURE_MODEL!,
          prompt,
          seed: Math.floor(Math.random() * 9999999999),
          image_size: image_size,
          batch_size: 1,
          guidance_scale: 7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Image generation failed: ${response.statusText}`);
      }

      const result = (await response.json()) as ImageGenerationResponse;
      return result.data[0].url;
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  }

  /**
   * Process uploaded image
   * @param buffer Image buffer
   * @param options Processing options
   * @returns Processed image buffer
   */
  async processUploadedImage(
    buffer: ArrayBuffer,
    options: {
      width?: number;
      height?: number;
      quality?: number;
    } = {}
  ): Promise<Buffer> {
    // For now, just return the buffer as is
    // TODO: Implement proper image processing when we find a compatible solution
    return Buffer.from(buffer);
  }
}
