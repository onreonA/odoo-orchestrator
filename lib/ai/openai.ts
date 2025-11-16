import OpenAI from 'openai'

/**
 * OpenAI client instance
 * Lazy loaded to avoid issues with test mocks
 */
let openaiInstance: OpenAI | null = null

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    if (!openaiInstance) {
      openaiInstance = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || '',
      })
    }
    return (openaiInstance as any)[prop]
  },
})

