import { HackerNewsSource } from './hacker-news'

// responses in the shape of the official API, see https://github.com/HackerNews/API
const responses: Record<string, unknown> = {
  'https://hn.test/v0/topstories.json': [8863, 121003, 192327, 4242],
  'https://hn.test/v0/item/8863.json': {
    by: 'dhouston',
    descendants: 71,
    id: 8863,
    score: 111,
    time: 1175714200,
    title: 'My YC app: Dropbox - Throw away your USB drive',
    type: 'story',
    url: 'http://www.getdropbox.com/u/2/screencast.html',
  },
  'https://hn.test/v0/item/121003.json': {
    by: 'tel',
    descendants: 16,
    id: 121003,
    score: 25,
    time: 1203647620,
    title: 'Ask HN: The Arc Effect',
    type: 'story',
  },
  'https://hn.test/v0/item/192327.json': { id: 192327, type: 'job', title: 'Justin.tv is hiring' },
  'https://hn.test/v0/item/4242.json': null,
}

const fakeFetch = (async (url: string) => {
  if (!(url in responses)) {
    return new Response('not found', { status: 404 })
  }
  return Response.json(responses[url])
}) as typeof fetch

describe('HackerNewsSource', () => {
  it('reads top stories and skips jobs and missing items', async () => {
    const stories = await new HackerNewsSource('https://hn.test/v0', fakeFetch).topStories(10)

    expect(stories).toEqual([
      {
        id: 8863,
        title: 'My YC app: Dropbox - Throw away your USB drive',
        url: 'http://www.getdropbox.com/u/2/screencast.html',
        domain: 'getdropbox.com',
        score: 111,
        comments: 71,
        postedAt: new Date(1175714200 * 1000),
        discussionUrl: 'https://news.ycombinator.com/item?id=8863',
      },
      expect.objectContaining({
        id: 121003,
        // Ask HN posts link to their discussion
        url: 'https://news.ycombinator.com/item?id=121003',
        domain: 'news.ycombinator.com',
      }),
    ])
  })

  it('only fetches as many items as asked for', async () => {
    const stories = await new HackerNewsSource('https://hn.test/v0', fakeFetch).topStories(1)

    expect(stories.map((story) => story.id)).toEqual([8863])
  })

  it('reports API errors', async () => {
    const failing = (async () => new Response('down', { status: 503 })) as unknown as typeof fetch

    await expect(new HackerNewsSource('https://hn.test/v0', failing).topStories(5)).rejects.toThrow('503')
  })
})
