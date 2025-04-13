import axios from "axios";
import { LLMProvider, LLMRequest, LLMResponse } from "../types";
import { GoogleGenerativeAI } from "@google/generative-ai";

const handleLLMResponse = (data: any, provider: LLMProvider): LLMResponse => {
  switch (provider) {
    case LLMProvider.GEMINI:
      return parseGeminiResponse(data);
    case LLMProvider.OPENAI:
      return parseOpenAIResponse(data);
    case LLMProvider.CLAUDE:
      return parseClaudeResponse(data);
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
};

const parseGeminiResponse = (data: any): LLMResponse => {
  const response = data;

  const codeBlockRegex = /```([a-zA-Z0-9_+-]+)?\n([\s\S]*?)\n```/g;
  let match = codeBlockRegex.exec(response);

  if (match) {
    const language = match[1] || "text";
    const code = match[2];
    const explanation = response.replace(match[0], "").trim();

    return {
      code,
      language,
      explanation,
    };
  }

  return {
    code: response,
    language: "text",
    explanation: "",
  };
};

const parseOpenAIResponse = (data: any): LLMResponse => {
  const response = data.choices[0].message.content;

  const codeBlockRegex = /```([a-zA-Z0-9_+-]+)?\n([\s\S]*?)\n```/g;
  let match = codeBlockRegex.exec(response);

  if (match) {
    const language = match[1] || "text";
    const code = match[2];
    const explanation = response.replace(match[0], "").trim();

    return {
      code,
      language,
      explanation,
    };
  }

  return {
    code: response,
    language: "text",
    explanation: "",
  };
};

const parseClaudeResponse = (data: any): LLMResponse => {
  const response = data.content[0].text;

  const codeBlockRegex = /```([a-zA-Z0-9_+-]+)?\n([\s\S]*?)\n```/g;
  let match = codeBlockRegex.exec(response);

  if (match) {
    const language = match[1] || "text";
    const code = match[2];
    const explanation = response.replace(match[0], "").trim();

    return {
      code,
      language,
      explanation,
    };
  }

  return {
    code: response,
    language: "text",
    explanation: "",
  };
};

export const generateWithGemini = async (
  request: LLMRequest
): Promise<LLMResponse> => {
  try {
    const { prompt, parameters } = request;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    // Use "gemini-pro" model instead of "gemini-1.0-pro"
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let enhancedPrompt = prompt;
    if (request.language) {
      enhancedPrompt += `\n\nPlease write the code in ${request.language}.`;
    }
    if (request.framework) {
      enhancedPrompt += `\n\nUse the ${request.framework} framework.`;
    }

    const generationConfig = {
      temperature: parameters?.temperature || 0.7,
      topK: parameters?.topK || 40,
      topP: parameters?.topP || 0.95,
      maxOutputTokens: parameters?.maxTokens || 8192,
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
      generationConfig,
    });

    if (!result.response) {
      throw new Error("Invalid response from Gemini API");
    }

    const responseText = result.response.text();

    if (!responseText || responseText.length === 0) {
      throw new Error("No text found in Gemini API response");
    }

    return handleLLMResponse(responseText, LLMProvider.GEMINI);
  } catch (error) {
    console.error("Error generating with Gemini:", error);
    throw error;
  }
};

export const generateWithOpenAI = async (
  request: LLMRequest
): Promise<LLMResponse> => {
  try {
    const { prompt, parameters } = request;

    let enhancedPrompt = prompt;
    if (request.language) {
      enhancedPrompt += `\n\nPlease write the code in ${request.language}.`;
    }
    if (request.framework) {
      enhancedPrompt += `\n\nUse the ${request.framework} framework.`;
    }

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: parameters?.model || "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are an expert programmer. Provide code solutions with explanations when appropriate.",
          },
          {
            role: "user",
            content: enhancedPrompt,
          },
        ],
        temperature: parameters?.temperature || 0.7,
        max_tokens: parameters?.maxTokens || 4096,
        top_p: parameters?.topP || 1,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return handleLLMResponse(response.data, LLMProvider.OPENAI);
  } catch (error) {
    console.error("Error generating with OpenAI:", error);
    throw error;
  }
};

export const generateWithClaude = async (
  request: LLMRequest
): Promise<LLMResponse> => {
  try {
    const { prompt, parameters } = request;

    let enhancedPrompt = prompt;
    if (request.language) {
      enhancedPrompt += `\n\nPlease write the code in ${request.language}.`;
    }
    if (request.framework) {
      enhancedPrompt += `\n\nUse the ${request.framework} framework.`;
    }

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: parameters?.model || "claude-3-opus-20240229",
        messages: [
          {
            role: "user",
            content: enhancedPrompt,
          },
        ],
        temperature: parameters?.temperature || 0.7,
        max_tokens: parameters?.maxTokens || 4096,
        stream: false,
      },
      {
        headers: {
          "x-api-key": process.env.CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );

    return handleLLMResponse(response.data, LLMProvider.CLAUDE);
  } catch (error) {
    console.error("Error generating with Claude:", error);
    throw error;
  }
};

export const generateCode = async (
  request: LLMRequest
): Promise<LLMResponse> => {
  switch (request.provider) {
    case LLMProvider.GEMINI:
      return generateWithGemini(request);
    case LLMProvider.OPENAI:
      return generateWithOpenAI(request);
    case LLMProvider.CLAUDE:
      return generateWithClaude(request);
    default:
      throw new Error(`Unsupported LLM provider: ${request.provider}`);
  }
};
