/**
 * AI Router Service — Multi-Provider AI Generation
 * Supports: Gemini, OpenRouter, Ollama, Custom OpenAI-compatible
 * Routes requests to correct provider based on task config in DB
 */
import { db } from '../db/index.js';
import { aiProviders, aiTaskConfigs } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export interface AIGenerateRequest {
  task: string;         // task type: 'text_generation' | 'image_generation' | ...
  prompt: string;
  systemPrompt?: string; // override system prompt
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;       // override model
  };
}

export interface AIGenerateResponse {
  success: boolean;
  text?: string;
  imageUrl?: string;
  model?: string;
  provider?: string;
  tokensUsed?: number;
  error?: string;
}

// ─── Get task config from DB ────────────────────────────────
async function getTaskConfig(taskType: string) {
  const config = await db.query.aiTaskConfigs.findFirst({
    where: eq(aiTaskConfigs.taskType, taskType),
    with: { provider: true },
  });
  return config;
}

// ─── Provider: Gemini ───────────────────────────────────────
async function callGemini(
  apiKey: string, model: string, prompt: string,
  systemPrompt: string, isImage: boolean, temperature: number, maxTokens: number
): Promise<AIGenerateResponse> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  if (isImage) {
    const response = await ai.models.generateContent({
      model: model || 'gemini-2.0-flash-exp',
      contents: { parts: [{ text: prompt }] },
      config: { responseModalities: ['TEXT', 'IMAGE'] },
    });
    let imageUrl = '';
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if ((part as any).inlineData) {
          const d = (part as any).inlineData;
          imageUrl = `data:${d.mimeType || 'image/png'};base64,${d.data}`;
          break;
        }
      }
    }
    return { success: !!imageUrl, imageUrl, model, provider: 'gemini' };
  }

  const response = await ai.models.generateContent({
    model: model || 'gemini-2.0-flash',
    contents: prompt,
    config: { systemInstruction: systemPrompt, temperature, maxOutputTokens: maxTokens },
  });
  return { success: true, text: response.text || '', model, provider: 'gemini' };
}


// ─── Provider: OpenRouter / OpenAI-compatible ───────────────
async function callOpenAICompatible(
  baseUrl: string, apiKey: string, model: string, prompt: string,
  systemPrompt: string, temperature: number, maxTokens: number,
  isImage: boolean = false
): Promise<AIGenerateResponse> {
  // Image generation uses /images/generations endpoint
  if (isImage) {
    const res = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3100',
        'X-Title': 'NextGen Digital Signage',
      },
      body: JSON.stringify({
        model: model || 'google/gemini-2.5-flash-preview-image',
        prompt,
        n: 1,
        size: '1024x576',  // 16:9 aspect
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: (err as any).error?.message || `Image API Error: ${res.status}` };
    }

    const data = await res.json() as any;
    const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json
      ? `data:image/png;base64,${data.data[0].b64_json}`
      : '';
    return { success: !!imageUrl, imageUrl, model, provider: 'openrouter' };
  }

  // Text generation uses /chat/completions
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3100',
      'X-Title': 'NextGen Digital Signage',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { success: false, error: (err as any).error?.message || `API Error: ${res.status}` };
  }

  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content || '';
  const tokensUsed = data.usage?.total_tokens;
  return { success: true, text, model, provider: 'openrouter', tokensUsed };
}

// ─── Provider: Ollama (Local) ───────────────────────────────
async function callOllama(
  baseUrl: string, model: string, prompt: string,
  systemPrompt: string, temperature: number
): Promise<AIGenerateResponse> {
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: `${systemPrompt}\n\nUser: ${prompt}`,
      stream: false,
      options: { temperature },
    }),
  });

  if (!res.ok) {
    return { success: false, error: `Ollama Error: ${res.status}` };
  }

  const data = await res.json() as any;
  return { success: true, text: data.response || '', model, provider: 'ollama' };
}

// ─── Main Router: Generate ──────────────────────────────────
export async function aiGenerate(req: AIGenerateRequest): Promise<AIGenerateResponse> {
  try {
    // Get task config from DB
    const config = await getTaskConfig(req.task);
    if (!config) {
      return { success: false, error: `No AI configuration found for task: ${req.task}. Configure in AI Settings.` };
    }
    if (!config.isEnabled) {
      return { success: false, error: `AI task "${req.task}" is disabled.` };
    }

    const provider = (config as any).provider;
    if (!provider || !provider.isEnabled) {
      return { success: false, error: `AI provider "${config.providerId}" is not enabled or configured.` };
    }

    const model = req.options?.model || config.modelId;
    const systemPrompt = req.systemPrompt || config.systemPrompt || 'You are a helpful AI assistant for a digital signage system.';
    const temperature = (req.options?.temperature ?? Number(config.temperature)) || 0.7;
    const maxTokens = (req.options?.maxTokens ?? config.maxTokens) ?? 1000;
    const isImage = req.task === 'image_generation';

    // Route to correct provider
    switch (provider.type) {
      case 'gemini':
        if (!provider.apiKey) return { success: false, error: 'Gemini API key not configured' };
        return await callGemini(provider.apiKey, model, req.prompt, systemPrompt, isImage, temperature, maxTokens);

      case 'openrouter':
      case 'openai_compatible':
        if (!provider.apiKey) return { success: false, error: `${provider.name} API key not configured` };
        return await callOpenAICompatible(provider.baseUrl, provider.apiKey, model, req.prompt, systemPrompt, temperature, maxTokens, isImage);

      case 'ollama':
        return await callOllama(provider.baseUrl, model, req.prompt, systemPrompt, temperature);

      default:
        return { success: false, error: `Unknown provider type: ${provider.type}` };
    }
  } catch (err: any) {
    console.error('[AI Router] Error:', err.message);
    return { success: false, error: err.message || 'AI generation failed' };
  }
}

// ─── Test Provider Connection ───────────────────────────────
export async function testProvider(providerId: string): Promise<{ success: boolean; message: string }> {
  try {
    const [provider] = await db.select().from(aiProviders).where(eq(aiProviders.id, providerId));
    if (!provider) return { success: false, message: 'Provider not found' };

    switch (provider.type) {
      case 'gemini': {
        if (!provider.apiKey) return { success: false, message: 'No API key' };
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: provider.apiKey });
        const r = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: 'Say "OK"' });
        return { success: !!r.text, message: r.text ? 'Connected successfully' : 'No response' };
      }
      case 'openrouter':
      case 'openai_compatible': {
        if (!provider.apiKey) return { success: false, message: 'No API key' };
        const r = await fetch(`${provider.baseUrl}/models`, { headers: { 'Authorization': `Bearer ${provider.apiKey}` } });
        return { success: r.ok, message: r.ok ? 'Connected successfully' : `Error: ${r.status}` };
      }
      case 'ollama': {
        const r = await fetch(`${provider.baseUrl}/api/tags`);
        return { success: r.ok, message: r.ok ? 'Connected successfully' : 'Cannot reach Ollama' };
      }
      default:
        return { success: false, message: 'Unknown provider type' };
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection failed' };
  }
}
