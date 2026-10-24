import { GroqModel } from './groq'

describe('GroqModel', () => {
  it('asks the chat completions endpoint for JSON and parses the answer', async () => {
    const requests: { url: string; init: RequestInit }[] = []
    const fetchFn = (async (url: string, init: RequestInit) => {
      requests.push({ url, init })
      return Response.json({ choices: [{ message: { content: '{"picks": []}' } }] })
    }) as unknown as typeof fetch
    const model = new GroqModel({ apiKey: 'key', model: 'openai/gpt-oss-20b', baseUrl: 'https://groq.test/v1', fetchFn })

    const answer = await model.completeJson('instructions', 'input')

    expect(answer).toEqual({ picks: [] })
    expect(requests[0].url).toBe('https://groq.test/v1/chat/completions')
    expect(requests[0].init.headers).toMatchObject({ Authorization: 'Bearer key' })
    expect(JSON.parse(requests[0].init.body as string)).toEqual({
      model: 'openai/gpt-oss-20b',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'instructions' },
        { role: 'user', content: 'input' },
      ],
    })
  })

  it('reports errors with the response body', async () => {
    const fetchFn = (async () => new Response('rate limit reached', { status: 429 })) as unknown as typeof fetch
    const model = new GroqModel({ apiKey: 'key', model: 'm', baseUrl: 'https://groq.test/v1', fetchFn })

    await expect(model.completeJson('i', 'x')).rejects.toThrow('429: rate limit reached')
  })
})
