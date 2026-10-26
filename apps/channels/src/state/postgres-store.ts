import { Pool } from 'pg'
import { Preferences, normalizePreferences } from '../channel/preferences'
import { ChannelStore } from './store'

/** Keeps channel state in its own schema, next to the app's. */
export class PostgresChannelStore implements ChannelStore {
  constructor(private readonly pool: Pool) {}

  static async connect(databaseUrl: string): Promise<PostgresChannelStore> {
    const pool = new Pool({ connectionString: databaseUrl })
    await pool.query(`
      CREATE SCHEMA IF NOT EXISTS channels;
      CREATE TABLE IF NOT EXISTS channels.posted_items (
        channel text NOT NULL,
        item_id text NOT NULL,
        posted_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (channel, item_id)
      );
      CREATE TABLE IF NOT EXISTS channels.posts (
        channel text NOT NULL,
        post_id text NOT NULL,
        title text NOT NULL,
        PRIMARY KEY (channel, post_id)
      );
      CREATE TABLE IF NOT EXISTS channels.preferences (
        channel text PRIMARY KEY,
        data jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `)
    return new PostgresChannelStore(pool)
  }

  async getPreferences(channel: string): Promise<Preferences | undefined> {
    const { rows } = await this.pool.query('SELECT data FROM channels.preferences WHERE channel = $1', [channel])
    return rows[0] ? normalizePreferences(rows[0].data) : undefined
  }

  async savePreferences(channel: string, preferences: Preferences): Promise<void> {
    await this.pool.query(
      `INSERT INTO channels.preferences (channel, data) VALUES ($1, $2)
       ON CONFLICT (channel) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [channel, JSON.stringify(preferences)]
    )
  }

  async notPosted(channel: string, itemIds: string[]): Promise<string[]> {
    if (itemIds.length === 0) {
      return []
    }
    const { rows } = await this.pool.query(
      'SELECT item_id FROM channels.posted_items WHERE channel = $1 AND item_id = ANY($2)',
      [channel, itemIds]
    )
    const posted = new Set(rows.map((row) => row.item_id))
    return itemIds.filter((id) => !posted.has(id))
  }

  async markPosted(channel: string, itemIds: string[], postedAt: Date): Promise<void> {
    if (itemIds.length === 0) {
      return
    }
    await this.pool.query(
      `INSERT INTO channels.posted_items (channel, item_id, posted_at)
       SELECT $1, item_id, $3 FROM unnest($2::text[]) AS item_id
       ON CONFLICT (channel, item_id) DO NOTHING`,
      [channel, itemIds, postedAt]
    )
  }

  async countPostedSince(channel: string, since: Date): Promise<number> {
    const { rows } = await this.pool.query(
      'SELECT count(*)::int AS count FROM channels.posted_items WHERE channel = $1 AND posted_at >= $2',
      [channel, since]
    )
    return rows[0].count
  }

  async rememberPost(channel: string, postId: string, title: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO channels.posts (channel, post_id, title) VALUES ($1, $2, $3)
       ON CONFLICT (channel, post_id) DO UPDATE SET title = EXCLUDED.title`,
      [channel, postId, title]
    )
  }

  async postTitles(channel: string, postIds: string[]): Promise<Map<string, string>> {
    if (postIds.length === 0) {
      return new Map()
    }
    const { rows } = await this.pool.query(
      'SELECT post_id, title FROM channels.posts WHERE channel = $1 AND post_id = ANY($2)',
      [channel, postIds]
    )
    return new Map(rows.map((row) => [row.post_id, row.title]))
  }

  async close(): Promise<void> {
    await this.pool.end()
  }
}
