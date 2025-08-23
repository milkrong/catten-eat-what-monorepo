interface DifyServiceConfig {
  apiKey: string;
  apiEndpoint: string;
}

// Generic SSE response (legacy chat usage)
interface DifySseResponse {
  event:
    | "message"
    | "message_end"
    | "tts_message"
    | "tts_message_end"
    | "agent_message";
  message_id?: string;
  conversation_id: string;
  answer?: string;
  error?: string;
  created_at?: number;
  metadata?: {
    usage?: {
      total_tokens: number;
      total_price: string;
    };
  };
}

// Workflow run response per Dify docs (CompletionResponse)
export interface DifyWorkflowResponse<TOutputs = unknown> {
  workflow_run_id: string;
  task_id: string;
  id: string;
  workflow_id: string;
  status?: string;
  data?: Record<string, unknown>;
  outputs?: TOutputs;
  error?: string;
  elapsed_time?: number;
  total_tokens?: number;
  total_steps?: number;
  created_at?: number;
  finished_at?: number;
}

export class DifyService {
  private apiKey: string;
  private apiEndpoint: string;

  constructor(config: DifyServiceConfig) {
    this.apiKey = config.apiKey;
    this.apiEndpoint = config.apiEndpoint;
  }

  // ===============
  // Workflows API
  // ===============
  async runWorkflowBlocking<TOutputs = unknown>(
    inputs: Record<string, unknown>,
    userId = "recommendation-user"
  ): Promise<DifyWorkflowResponse<TOutputs>> {
    console.log(">>inputs", inputs);
    const response = await fetch(`${this.apiEndpoint}/workflows/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs,
        response_mode: "blocking",
        user: userId,
      }),
    });

    if (!response.ok) {
      let message = response.statusText;
      try {
        const errorData = (await response.json()) as { error?: string };
        if (errorData?.error) message = errorData.error;
      } catch {}
      throw new Error(`Dify workflow error: ${message}`);
    }

    const raw = (await response.json()) as any;
    console.log(">>json", raw);

    // allow both top-level and nested under `data`
    const nested = raw?.data ?? {};
    const normalized: DifyWorkflowResponse<TOutputs> = {
      workflow_run_id: raw?.workflow_run_id ?? nested?.workflow_run_id ?? "",
      task_id: raw?.task_id ?? nested?.task_id ?? "",
      id: raw?.id ?? nested?.id ?? "",
      workflow_id: raw?.workflow_id ?? nested?.workflow_id ?? "",
      status: raw?.status ?? nested?.status,
      data: nested && Object.keys(nested).length ? nested : undefined,
      outputs: (raw?.outputs ?? nested?.outputs) as TOutputs | undefined,
      error: raw?.error ?? nested?.error,
      elapsed_time: raw?.elapsed_time ?? nested?.elapsed_time,
      total_tokens: raw?.total_tokens ?? nested?.total_tokens,
      total_steps: raw?.total_steps ?? nested?.total_steps,
      created_at: raw?.created_at ?? nested?.created_at,
      finished_at: raw?.finished_at ?? nested?.finished_at,
    };

    const hasOutputs =
      normalized.outputs !== undefined ||
      (normalized.data as any)?.outputs !== undefined;
    if (!hasOutputs) {
      const err = normalized.error || "Dify workflow returned no outputs";
      throw new Error(err);
    }
    return normalized;
  }

  async runWorkflowStreaming(
    inputs: Record<string, unknown>,
    onChunk: (chunk: string) => void,
    userId = "recommendation-user"
  ): Promise<void> {
    const response = await fetch(`${this.apiEndpoint}/workflows/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs,
        response_mode: "streaming",
        user: userId,
      }),
    });

    if (!response.ok) {
      let message = response.statusText;
      try {
        const errorData = (await response.json()) as { error?: string };
        if (errorData?.error) message = errorData.error;
      } catch {}
      throw new Error(`Dify workflow error: ${message}`);
    }

    if (!response.body) {
      throw new Error("Dify workflow error: No response body received");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const messages = buffer.split("\n\n");
      buffer = messages.pop() || "";
      for (const message of messages) {
        if (message.startsWith("data: ")) {
          // Pass through raw payload to the caller; caller decides how to use
          onChunk(message.slice(6));
        }
      }
    }

    if (buffer.startsWith("data: ")) {
      onChunk(buffer.slice(6));
    }
  }

  // ===============
  // Legacy chat-like helpers (kept for backward compatibility)
  // ===============
  async createCompletion(prompt: string): Promise<string> {
    try {
      let fullResponse = "";
      await this.createStreamingCompletion(prompt, (chunk) => {
        console.log("<<", chunk);
        fullResponse += chunk;
      });
      console.log(">>fullResponse", fullResponse);
      return fullResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Dify API error: Unknown error occurred");
    }
  }

  async createStreamingCompletion(
    prompt: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.apiEndpoint}/workflows/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {},
          conversation_id: "",
          query: prompt,
          response_mode: "blocking",
          user: "recommendation-user",
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as DifySseResponse;
        console.log(">>errorData", errorData);
        throw new Error(
          `Dify API error: ${errorData.error || response.statusText}`
        );
      }

      if (!response.body) {
        throw new Error("Dify API error: No response body received");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split("\n\n");

        // Keep the last incomplete message in the buffer
        buffer = messages.pop() || "";
        for (const message of messages) {
          if (message.startsWith("data: ")) {
            try {
              const data = JSON.parse(message.slice(6)) as DifySseResponse;
              console.log(">>data", data, message);
              if (data.event === "agent_message" && data.answer) {
                onChunk(data.answer);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }

      // Handle any remaining data
      if (buffer.startsWith("data: ")) {
        try {
          const data = JSON.parse(buffer.slice(6)) as DifySseResponse;
          if (data.event === "message" && data.answer) {
            onChunk(data.answer);
          }
        } catch (e) {
          console.error("Error parsing SSE data:", e);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Dify API error: Unknown error occurred");
    }
  }
}
