import { io, Socket } from 'socket.io-client'
import { Logger } from '../logger'

export interface Account {
  username: string
  firstName: string
  lastName: string
  email: string
  bio: string
  imageUrl?: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  authorId: string
  content: string
  isRead?: boolean
  createdAt?: string
}

export interface Conversation {
  id: string
  userIds: string[]
  /** the most recent message plus all unread ones */
  messages: ChatMessage[]
}

export interface ReceivedLike {
  postId: string
  likedAt: string
}

/** Thrown for unsuccessful responses, with the status code. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}

const RENEW_BEFORE_EXPIRY_MS = 60_000

function expiresAt(token: string): number {
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
  return payload.exp * 1000
}

/**
 * The simplefeed API as one account sees it. Channels use the same
 * endpoints and sockets as the web app, so the backend needs no special
 * handling for them.
 */
export class SimplefeedClient {
  private accessToken?: string
  private userId?: string

  constructor(
    private readonly apiUrl: string,
    private readonly account: Account,
    private readonly password: string,
    private readonly fetchFn: typeof fetch = fetch
  ) {}

  get username() {
    return this.account.username
  }

  private async request<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
    const headers = new Headers(init.headers)
    if (authenticated) {
      headers.set('Authorization', `Bearer ${await this.token()}`)
    }
    if (init.body && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
    const response = await this.fetchFn(`${this.apiUrl}${path}`, { ...init, headers })
    if (!response.ok) {
      throw new ApiError(response.status, `${init.method ?? 'GET'} ${path}: ${response.status} ${await response.text()}`)
    }
    const text = await response.text()
    return (text ? JSON.parse(text) : undefined) as T
  }

  /** Creates the bot account unless it exists already. */
  async ensureAccount(registrationKey: string): Promise<void> {
    try {
      await this.request(
        '/auth/register-bot',
        {
          method: 'POST',
          headers: { 'x-bot-registration-key': registrationKey },
          body: JSON.stringify({ user: { ...this.account, password: this.password } }),
        },
        false
      )
    } catch (error) {
      // 409: the account exists from an earlier run
      if (!(error instanceof ApiError && error.status === 409)) {
        throw error
      }
    }
  }

  /** A valid access token, logging in again shortly before the current one expires. */
  async token(): Promise<string> {
    if (!this.accessToken || expiresAt(this.accessToken) - Date.now() < RENEW_BEFORE_EXPIRY_MS) {
      const { accessToken } = await this.request<{ accessToken: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ user: { email: this.account.email, password: this.password } }),
        },
        false
      )
      this.accessToken = accessToken
    }
    return this.accessToken
  }

  async id(): Promise<string> {
    if (!this.userId) {
      this.userId = (await this.request<{ id: string }>('/users/me')).id
    }
    return this.userId
  }

  /** Posts to the channel's feed and returns the new post's id. */
  async post(body: string): Promise<string> {
    const form = new FormData()
    form.append('body', body)
    const { id } = await this.request<{ id: string }>('/posts', { method: 'POST', body: form })
    return id
  }

  /** Readers' likes on the channel's posts, most recent first. */
  likesOnMyPosts(): Promise<ReceivedLike[]> {
    return this.request('/posts/likes')
  }

  conversations(): Promise<Conversation[]> {
    return this.request('/chat')
  }
}

const API_RETRY_DELAY_MS = 5_000

/**
 * Runs `task`, retrying while the API is unreachable or failing, e.g. when
 * the worker starts before the API. Client errors such as a wrong
 * registration key are rethrown, since retrying won't fix them.
 */
export async function whenApiIsUp<T>(
  task: () => Promise<T>,
  logger: Logger = console,
  delayMs = API_RETRY_DELAY_MS
): Promise<T> {
  for (;;) {
    try {
      return await task()
    } catch (error) {
      if (error instanceof ApiError && error.status < 500) {
        throw error
      }
      logger.log(`waiting for the API (${error instanceof Error ? error.message : error}), retrying in ${delayMs / 1000}s`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

export interface ChatConnection {
  /** settles once the socket has connected for the first time */
  ready: Promise<void>
  join(conversationId: string): Promise<void>
  send(conversationId: string, content: string): Promise<void>
  markAsRead(conversationId: string): Promise<void>
  close(): void
}

const RECONNECT_DELAY_MS = 5_000

/**
 * Connects to the chat socket and calls `onMessage` for messages from
 * others. The server checks the token only when connecting, so after a
 * disconnect this reconnects with a fresh one.
 */
export function connectChat(
  socketUrl: string,
  client: SimplefeedClient,
  onMessage: (message: ChatMessage) => void,
  logger: Logger = console
): ChatConnection {
  let socket: Socket | undefined
  let closed = false
  const joined = new Set<string>()
  let markReady: () => void = () => undefined
  const ready = new Promise<void>((resolve) => (markReady = resolve))

  async function connect() {
    const [token, ownId] = await Promise.all([client.token(), client.id()])
    socket = io(`${socketUrl}/chat`, {
      query: { Authorization: `Bearer ${token}` },
      transports: ['websocket'],
      reconnection: false,
    })
    socket.on('connect', () => markReady())
    socket.on('conversations_joined', ({ conversationIds }: { conversationIds: string[] }) => {
      conversationIds.forEach((id) => joined.add(id))
    })
    socket.on('receive_message', (message: ChatMessage) => {
      if (message.authorId !== ownId) {
        onMessage(message)
      }
    })
    socket.on('disconnect', () => {
      joined.clear()
      if (!closed) {
        setTimeout(() => connect().catch((error) => logger.error(`chat reconnect failed: ${error}`)), RECONNECT_DELAY_MS)
      }
    })
  }

  // fails instead of dropping the event while (re)connecting, so callers
  // don't record a join or a reply that never reached the server
  const emit = async (event: string, payload: object) => {
    const auth = await client.token()
    if (!socket?.connected) {
      throw new Error(`chat socket is not connected, cannot ${event}`)
    }
    socket.emit(event, { ...payload, auth })
  }

  connect().catch((error) => logger.error(`chat connection failed: ${error}`))

  return {
    ready,
    async join(conversationId) {
      if (!joined.has(conversationId)) {
        await emit('join_conversation', { conversationId })
        joined.add(conversationId)
      }
    },
    async send(conversationId, content) {
      await emit('send_message', {
        message: { conversationId, content, authorId: await client.id() },
      })
    },
    async markAsRead(conversationId) {
      await emit('mark_as_read', { conversationId })
    },
    close() {
      closed = true
      socket?.close()
    },
  }
}
