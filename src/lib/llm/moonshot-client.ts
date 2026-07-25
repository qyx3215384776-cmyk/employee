import OpenAI from 'openai';

const DEFAULT_BASE_URL = 'https://api.moonshot.cn/v1';
const DEFAULT_MODEL = 'kimi-k3';

export const MOONSHOT_MODEL = process.env.MOONSHOT_MODEL ?? DEFAULT_MODEL;

export const moonshot = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY ?? '',
  baseURL: process.env.MOONSHOT_BASE_URL ?? DEFAULT_BASE_URL,
});
