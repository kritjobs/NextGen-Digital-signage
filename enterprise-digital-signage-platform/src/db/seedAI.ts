import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://signage_admin:SignageSecure2026!@localhost:5433/signage_db' });
const db = drizzle(pool, { schema });

async function seedAI() {
  console.log('[AI Seed] Seeding providers...');
  await db.insert(schema.aiProviders).values([
    { id: 'aip-openrouter', name: 'OpenRouter', type: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1', apiKey: null, isEnabled: true, models: ['anthropic/claude-sonnet-4-20250514','google/gemini-2.5-flash','openai/gpt-4o','meta-llama/llama-3.3-70b-instruct','mistralai/mistral-large-latest','deepseek/deepseek-chat-v3'], lastTestStatus: 'untested' },
    { id: 'aip-gemini', name: 'Google Gemini', type: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com', apiKey: null, isEnabled: true, models: ['gemini-2.0-flash','gemini-2.5-flash','gemini-2.5-pro','gemini-2.0-flash-exp'], lastTestStatus: 'untested' },
    { id: 'aip-ollama', name: 'Ollama (Local)', type: 'ollama', baseUrl: 'http://localhost:11434', apiKey: null, isEnabled: false, models: ['llama3.2','gemma2','mistral','phi3','qwen2.5'], lastTestStatus: 'untested' },
  ]).onConflictDoNothing();

  console.log('[AI Seed] Seeding task configs...');
  await db.insert(schema.aiTaskConfigs).values([
    { id: 'aitc-text', taskType: 'text_generation', taskLabel: 'Text Generation', description: 'Announcements, tickers, headlines', providerId: 'aip-openrouter', modelId: 'google/gemini-2.5-flash', systemPrompt: 'You are a professional digital signage content writer. Write concise, impactful content. Use the same language the user writes in.', temperature: '0.7', maxTokens: 1000, isEnabled: true },
    { id: 'aitc-image', taskType: 'image_generation', taskLabel: 'Image Generation', description: 'Posters, banners, backgrounds', providerId: 'aip-gemini', modelId: 'gemini-2.0-flash-exp', systemPrompt: 'Generate high-quality digital signage visuals', temperature: '0.8', maxTokens: 500, isEnabled: true },
    { id: 'aitc-layout', taskType: 'layout_recommendation', taskLabel: 'Layout Recommendation', description: 'Suggest zone layouts for venues', providerId: 'aip-openrouter', modelId: 'google/gemini-2.5-flash', systemPrompt: 'You are a digital signage layout expert. Recommend multi-zone layouts based on venue type.', temperature: '0.5', maxTokens: 800, isEnabled: true },
    { id: 'aitc-diag', taskType: 'diagnosis', taskLabel: 'System Diagnosis', description: 'Analyze screen health and issues', providerId: 'aip-openrouter', modelId: 'google/gemini-2.5-flash', systemPrompt: 'You are a digital signage system administrator. Analyze screen metrics and identify potential issues. Provide brief, actionable recommendations.', temperature: '0.3', maxTokens: 600, isEnabled: true },
    { id: 'aitc-slide', taskType: 'slideshow_content', taskLabel: 'Slideshow Content', description: 'Generate slide text content', providerId: 'aip-openrouter', modelId: 'google/gemini-2.5-flash', systemPrompt: 'You are a digital signage content creator. Generate slide content as a JSON array. Each object has: headlineText, subtitleText, bodyText, ctaText.', temperature: '0.7', maxTokens: 1500, isEnabled: true },
    { id: 'aitc-trans', taskType: 'translation', taskLabel: 'Content Translation', description: 'Translate content TH/EN/CN', providerId: 'aip-openrouter', modelId: 'google/gemini-2.5-flash', systemPrompt: 'You are a professional translator for digital signage. Translate accurately while keeping appropriate tone for public display.', temperature: '0.3', maxTokens: 1000, isEnabled: true },
  ]).onConflictDoNothing();

  console.log('[AI Seed] ✅ Done! 3 providers + 6 task configs seeded.');
}

seedAI().catch(console.error).finally(() => pool.end());
