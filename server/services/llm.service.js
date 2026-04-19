import { invokeGroqText, QueueSaturatedError } from "./groq.llm.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("llm-service");

/**
 * Text generation via Groq (free tier: https://console.groq.com).
 * Set GROQ_API_KEY.
 */
export async function invokeLlmText({ system, prompt, maxTokens = 2000 }) {
  try {
    const text = await invokeGroqText({ system, prompt, maxTokens });
    if (text && String(text).trim()) return String(text);
    logger.warn("llm:text_empty_response", { maxTokens });
  } catch (error) {
    if (error instanceof QueueSaturatedError) {
      logger.warn("llm:queue_saturated", { maxTokens });
      return null;
    }
    logger.error("llm:text_invoke_failed", { error, maxTokens });
  }
  return null;
}
