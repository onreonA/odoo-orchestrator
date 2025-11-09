import OpenAI from 'openai'

/**
 * OpenAI client configuration
 * Make sure OPENAI_API_KEY is set in .env.local
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
