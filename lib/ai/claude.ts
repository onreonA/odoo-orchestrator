import Anthropic from '@anthropic-ai/sdk'

/**
 * Claude (Anthropic) client configuration
 * Make sure ANTHROPIC_API_KEY is set in .env.local
 */
export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})



