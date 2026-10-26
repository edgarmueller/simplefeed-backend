import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export interface FetchedPage {
  /** the final URL, after redirects */
  url: string
  contentType: string
  body: string
}

/** Fetches a URL someone typed in, as text. */
export type PageFetcher = (url: string) => Promise<FetchedPage>

export interface SafeFetchOptions {
  /** allows hosts on private networks, e.g. a feed served from localhost in development */
  allowPrivateHosts?: boolean
  timeoutMs?: number
  maxBytes?: number
  fetchFn?: typeof fetch
  resolve?: (hostname: string) => Promise<string[]>
}

const MAX_REDIRECTS = 5
const DNS_TIMEOUT_MS = 5_000
/** some sites refuse or stall requests without one */
const USER_AGENT = 'simplefeed/1.0 (+https://github.com/edgarmueller/simplefeed-backend)'

const resolveAll = (hostname: string) =>
  Promise.race([
    lookup(hostname, { all: true }).then((entries) => entries.map((entry) => entry.address)),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`looking up ${hostname} took too long`)), DNS_TIMEOUT_MS).unref()
    ),
  ])

/** Loopback, private, link-local and other addresses that aren't the public internet. */
export function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    )
  }
  const ip = address.toLowerCase()
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) {
    return isPrivateAddress(mapped[1])
  }
  return ip === '::' || ip === '::1' || /^f[cd]/.test(ip) || /^fe[89ab]/.test(ip) || ip.startsWith('ff')
}

/**
 * Fetches user-supplied URLs without letting them reach the worker's own
 * network: only http(s), no private addresses (checked on every redirect),
 * with a timeout and a size limit.
 */
export function createSafeFetch(options: SafeFetchOptions = {}): PageFetcher {
  const {
    allowPrivateHosts = false,
    timeoutMs = 10_000,
    maxBytes = 2_000_000,
    fetchFn = fetch,
    resolve = resolveAll,
  } = options

  async function checkUrl(url: URL) {
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error(`only http and https are supported, not ${url.protocol}`)
    }
    if (allowPrivateHosts) {
      return
    }
    const hostname = url.hostname.replace(/^\[|\]$/g, '')
    const addresses = isIP(hostname) ? [hostname] : await resolve(hostname)
    if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
      throw new Error(`${url.hostname} is not a public address`)
    }
  }

  return async (input: string) => {
    let url = new URL(input)
    for (let redirects = 0; ; redirects++) {
      await checkUrl(url)
      let response: Response
      try {
        response = await fetchFn(url, {
          redirect: 'manual',
          signal: AbortSignal.timeout(timeoutMs),
          headers: {
            accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.5',
            'user-agent': USER_AGENT,
          },
        })
      } catch (error) {
        if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
          throw new Error(`${url.host} didn't answer within ${timeoutMs / 1000} s`)
        }
        throw error
      }
      const location = response.headers.get('location')
      if (response.status >= 300 && response.status < 400 && location) {
        if (redirects >= MAX_REDIRECTS) {
          throw new Error('too many redirects')
        }
        url = new URL(location, url)
        continue
      }
      if (!response.ok) {
        throw new Error(`${url} responded with ${response.status}`)
      }
      return { url: url.toString(), contentType: response.headers.get('content-type') ?? '', body: await readText(response, maxBytes) }
    }
  }
}

async function readText(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) {
    return ''
  }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      throw new Error(`the response is larger than ${maxBytes} bytes`)
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf8')
}
