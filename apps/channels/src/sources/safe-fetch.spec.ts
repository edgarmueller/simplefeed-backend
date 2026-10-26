import { createSafeFetch, isPrivateAddress } from './safe-fetch'

describe('isPrivateAddress', () => {
  it.each(['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1'])(
    'treats %s as private',
    (address) => {
      expect(isPrivateAddress(address)).toBe(true)
    }
  )

  it.each(['93.184.216.34', '8.8.8.8', '2606:4700::1111', '172.32.0.1'])('treats %s as public', (address) => {
    expect(isPrivateAddress(address)).toBe(false)
  })
})

describe('createSafeFetch', () => {
  const publicHost = async () => ['93.184.216.34']

  it('refuses hosts that resolve to private addresses', async () => {
    const fetchFn = vi.fn()
    const safeFetch = createSafeFetch({ fetchFn, resolve: async () => ['10.0.0.5'] })

    await expect(safeFetch('http://intranet.example.com/feed')).rejects.toThrow('not a public address')
    await expect(createSafeFetch({ fetchFn })('http://169.254.169.254/latest')).rejects.toThrow('not a public address')
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('checks every redirect', async () => {
    const fetchFn = vi.fn(async () => new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/admin' } }))
    const safeFetch = createSafeFetch({ fetchFn: fetchFn as unknown as typeof fetch, resolve: publicHost })

    await expect(safeFetch('https://example.com/feed')).rejects.toThrow('127.0.0.1 is not a public address')
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('follows redirects and returns the final URL', async () => {
    const fetchFn = vi.fn(async (url: URL) =>
      url.pathname === '/old'
        ? new Response(null, { status: 301, headers: { location: '/new' } })
        : new Response('<rss/>', { headers: { 'content-type': 'application/rss+xml' } })
    )
    const safeFetch = createSafeFetch({ fetchFn: fetchFn as unknown as typeof fetch, resolve: publicHost })

    expect(await safeFetch('https://example.com/old')).toEqual({
      url: 'https://example.com/new',
      contentType: 'application/rss+xml',
      body: '<rss/>',
    })
  })

  it('stops reading large responses', async () => {
    const fetchFn = async () => new Response('x'.repeat(2000))
    const safeFetch = createSafeFetch({ fetchFn: fetchFn as unknown as typeof fetch, resolve: publicHost, maxBytes: 1000 })

    await expect(safeFetch('https://example.com/huge')).rejects.toThrow('larger than 1000 bytes')
  })

  it('says who is asking', async () => {
    const fetchFn = vi.fn(async (_url: URL, _init: RequestInit) => new Response('<rss/>'))
    await createSafeFetch({ fetchFn: fetchFn as unknown as typeof fetch, resolve: publicHost })('https://example.com/feed')

    expect(new Headers(fetchFn.mock.calls[0][1].headers).get('user-agent')).toMatch(/^simplefeed\//)
  })

  it('names the site that did not answer in time', async () => {
    const fetchFn = async () => {
      throw new DOMException('The operation was aborted due to timeout', 'TimeoutError')
    }
    const safeFetch = createSafeFetch({ fetchFn: fetchFn as unknown as typeof fetch, resolve: publicHost, timeoutMs: 10_000 })

    await expect(safeFetch('https://slow.example.com/feed')).rejects.toThrow("slow.example.com didn't answer within 10 s")
  })

  it('only fetches http and https', async () => {
    await expect(createSafeFetch()('file:///etc/passwd')).rejects.toThrow('only http and https')
  })
})
