import { MigrationInterface, QueryRunner } from 'typeorm'

const DEFAULT_PREFERENCES =
  '{"interests":[],"muted":[],"minScore":100,"maxPostsPerDay":10,"notes":""}'

/**
 * Simplefeed becomes a reader: channels, the items they fetch and readers'
 * subscriptions replace bot accounts, posts, likes, chats and notifications.
 *
 * Readers keep their subscriptions, including feeds they added; everything
 * else starts fresh, and the worker refills the items on its next run.
 * Bot accounts, posts, likes, chats, notifications and the worker's own
 * state go away, so this can't be undone.
 */
export class ReaderModel1793500000000 implements MigrationInterface {
  name = 'ReaderModel1793500000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."channel" ("id" character varying NOT NULL, "kind" character varying NOT NULL, "name" character varying, "description" character varying, "url" character varying, "feed_url" character varying, "site_url" character varying, "status" character varying NOT NULL, "error" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_381af1d6fe6397fcc4c01ee661b" UNIQUE ("url"), CONSTRAINT "PK_590f33ee6ee7d76437acf362e39" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."subscription" ("id" character varying NOT NULL, "user_id" character varying NOT NULL, "preferences" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "channel_id" character varying, CONSTRAINT "UQ_subscription_user_channel" UNIQUE ("user_id", "channel_id"), CONSTRAINT "PK_8c3e00ebd02103caa1174cd5d9d" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."item" ("id" character varying NOT NULL, "external_id" character varying NOT NULL, "title" character varying NOT NULL, "url" character varying NOT NULL, "domain" character varying NOT NULL, "excerpt" character varying, "score" integer, "comments" integer, "discussion_url" character varying, "source_name" character varying, "published_at" TIMESTAMP NOT NULL, "fetched_at" TIMESTAMP NOT NULL DEFAULT now(), "channel_id" character varying, CONSTRAINT "UQ_item_channel_external_id" UNIQUE ("channel_id", "external_id"), CONSTRAINT "PK_d3c0c71f23e7adcf952a1d13423" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_item_channel_published" ON "simplefeed"."item" ("channel_id", "published_at") `,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."entry" ("id" character varying NOT NULL, "user_id" character varying NOT NULL, "summary" character varying, "picked_at" TIMESTAMP NOT NULL, "read_at" TIMESTAMP, "liked_at" TIMESTAMP, "saved_at" TIMESTAMP, "subscription_id" character varying, "item_id" character varying, CONSTRAINT "UQ_entry_user_item" UNIQUE ("user_id", "item_id"), CONSTRAINT "PK_a58c675c4c129a8e0f63d3676d6" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_entry_user_picked" ON "simplefeed"."entry" ("user_id", "picked_at") `,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."tuning_message" ("id" character varying NOT NULL, "author" character varying NOT NULL, "content" character varying NOT NULL, "answered" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "subscription_id" character varying, CONSTRAINT "PK_d63d4c900ab714c2587840d067d" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."subscription" ADD CONSTRAINT "FK_940d49a105d50bbd616be540013" FOREIGN KEY ("user_id") REFERENCES "simplefeed"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."subscription" ADD CONSTRAINT "FK_aa529383c3279195026c21420ed" FOREIGN KEY ("channel_id") REFERENCES "simplefeed"."channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."item" ADD CONSTRAINT "FK_4539fc1ad21a3801201a2bcb966" FOREIGN KEY ("channel_id") REFERENCES "simplefeed"."channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."entry" ADD CONSTRAINT "FK_13290f54efdc9f5564c58847d74" FOREIGN KEY ("user_id") REFERENCES "simplefeed"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."entry" ADD CONSTRAINT "FK_08872445f78f0154b64ce249d21" FOREIGN KEY ("subscription_id") REFERENCES "simplefeed"."subscription"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."entry" ADD CONSTRAINT "FK_ba75677cb5b9c2af63e20ad72b9" FOREIGN KEY ("item_id") REFERENCES "simplefeed"."item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."tuning_message" ADD CONSTRAINT "FK_92fee47205a35b5427993705422" FOREIGN KEY ("subscription_id") REFERENCES "simplefeed"."subscription"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )

    // Hacker News is built in
    await queryRunner.query(
      `INSERT INTO "simplefeed"."channel" ("id", "kind", "name", "description", "status")
       VALUES ('cha-hackernews', 'hackernews', 'Hacker News', 'The Hacker News front page, picked for you. Message me to tune what I post.', 'active')`,
    )
    // feeds users added become channels, keeping their ids' suffix
    await queryRunner.query(
      `INSERT INTO "simplefeed"."channel" ("id", "kind", "name", "description", "url", "feed_url", "status", "error", "created_at", "updated_at")
       SELECT 'cha-' || substr(feed.id, 5), 'feed', feed.title, profile.bio, feed.url, feed.feed_url, feed.status, feed.error, feed.created_at, feed.updated_at
       FROM "simplefeed"."feed" feed
       LEFT JOIN "simplefeed"."profile" profile ON profile.user_id = feed.channel_id`,
    )
    // subscriptions were connections between a reader and a channel's bot account
    await queryRunner.query(
      `INSERT INTO "simplefeed"."subscription" ("id", "user_id", "channel_id", "preferences")
       SELECT 'sub-' || gen_random_uuid(), connection.user_id,
              CASE WHEN bot.username = 'hackernews' THEN 'cha-hackernews' ELSE 'cha-' || substr(feed.id, 5) END,
              '${DEFAULT_PREFERENCES}'::jsonb
       FROM "simplefeed"."user_friends_user" connection
       JOIN "simplefeed"."profile" bot ON bot.user_id = connection.befriended_by_id AND bot.is_bot
       JOIN "simplefeed"."profile" reader ON reader.user_id = connection.user_id AND NOT reader.is_bot
       LEFT JOIN "simplefeed"."feed" feed ON feed.channel_id = connection.befriended_by_id
       WHERE bot.username = 'hackernews' OR feed.id IS NOT NULL
       ON CONFLICT DO NOTHING`,
    )
    // readers waiting for a feed are subscribed to it
    await queryRunner.query(
      `INSERT INTO "simplefeed"."subscription" ("id", "user_id", "channel_id", "preferences")
       SELECT 'sub-' || gen_random_uuid(), requester.user_id, 'cha-' || substr(requester.feed_id, 5), '${DEFAULT_PREFERENCES}'::jsonb
       FROM "simplefeed"."feed_requesters" requester
       ON CONFLICT DO NOTHING`,
    )

    await queryRunner.query(`DROP TABLE "simplefeed"."likes"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."posts"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."message"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."conversations"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."notification"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."feed_requesters"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."feed"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."user_friends_user"`)
    await queryRunner.query(
      `DELETE FROM "simplefeed"."refresh_token" WHERE "userId" IN (SELECT user_id FROM "simplefeed"."profile" WHERE is_bot)`,
    )
    await queryRunner.query(
      `DELETE FROM "simplefeed"."user" WHERE id IN (SELECT user_id FROM "simplefeed"."profile" WHERE is_bot)`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."profile" DROP COLUMN "nrOfPosts"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."profile" DROP COLUMN "nrOfLikes"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."profile" DROP COLUMN "is_bot"`,
    )
    // the worker kept its own state here; it now lives in the tables above
    await queryRunner.query(`DROP SCHEMA IF EXISTS "channels" CASCADE`)
  }

  public async down(): Promise<void> {
    throw new Error(
      'The reader model migration drops posts, chats and bot accounts, so it cannot be undone',
    )
  }
}
