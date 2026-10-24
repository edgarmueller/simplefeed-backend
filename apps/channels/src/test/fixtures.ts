import { Story } from '../sources/hacker-news'
import { JsonModel } from '../llm/llm'

let nextId = 1

export function story(title: string, overrides: Partial<Story> = {}): Story {
  const id = overrides.id ?? nextId++
  return {
    id,
    title,
    url: `https://example.com/${id}`,
    domain: 'example.com',
    score: 200,
    comments: 50,
    postedAt: new Date('2026-10-25T08:00:00Z'),
    discussionUrl: `https://news.ycombinator.com/item?id=${id}`,
    ...overrides,
  }
}

/** A model that answers with fixed JSON (or throws), recording what it was asked. */
export function fakeModel(answer: unknown | Error): JsonModel & { inputs: string[] } {
  const inputs: string[] = []
  return {
    name: 'fake',
    inputs,
    async completeJson(_instructions: string, input: string) {
      inputs.push(input)
      if (answer instanceof Error) throw answer
      return answer
    },
  }
}

export const silentLogger = { log: () => undefined, warn: () => undefined, error: () => undefined }
