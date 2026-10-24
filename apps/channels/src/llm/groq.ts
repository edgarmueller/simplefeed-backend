import { JsonModel } from './llm'

export interface GroqOptions {
  apiKey: string
  model: string
  /** OpenAI-compatible base URL, e.g. https://api.groq.com/openai/v1 */
  baseUrl: string
  fetchFn?: typeof fetch
}

interface ChatCompletion {
  choices?: { message?: { content?: string | null } }[]
}

/** Groq's OpenAI-compatible chat completions endpoint, in JSON mode. */
export class GroqModel implements JsonModel {
  readonly name: string
  private readonly fetchFn: typeof fetch

  constructor(private readonly options: GroqOptions) {
    this.name = `groq:${options.model}`
    this.fetchFn = options.fetchFn ?? fetch
  }

  async completeJson(instructions: string, input: string): Promise<unknown> {
    const response = await this.fetchFn(`${this.options.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.options.model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: instructions },
          { role: 'user', content: input },
        ],
      }),
    })
    if (!response.ok) {
      throw new Error(`Groq responded with ${response.status}: ${await response.text()}`)
    }
    const completion = (await response.json()) as ChatCompletion
    const content = completion.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('Groq returned no content')
    }
    return JSON.parse(content)
  }
}
