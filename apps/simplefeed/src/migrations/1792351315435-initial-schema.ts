import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1792351315435 implements MigrationInterface {
  name = 'InitialSchema1792351315435'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // comment threads are stored as materialized paths
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS ltree`)
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."refresh_token" ("id" SERIAL NOT NULL, "userId" character varying NOT NULL, "token" character varying, CONSTRAINT "PK_b575dd3c21fb0831013c909e7fe" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."user" ("id" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."profile" ("id" character varying NOT NULL, "username" character varying NOT NULL, "bio" character varying, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "imageUrl" character varying, "nrOfPosts" integer NOT NULL DEFAULT '0', "nrOfLikes" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" character varying, CONSTRAINT "REL_d752442f45f258a8bdefeebb2f" UNIQUE ("user_id"), CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."friend_request" ("id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "from_user_id" character varying, "to_user_id" character varying, CONSTRAINT "PK_4c9d23ff394888750cf66cac17c" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."posts" ("id" character varying NOT NULL, "body" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "attachments" json, "author_id" character varying, "posted_to" character varying, CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."comment" ("id" character varying NOT NULL, "content" character varying NOT NULL, "path" ltree, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "author_id" character varying, "post_id" character varying, CONSTRAINT "PK_0b0e4bbc8415ec426f87f3a88e2" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."likes" ("id" character varying NOT NULL, "unliked" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" character varying NOT NULL, "post_id" character varying, CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."conversations" ("id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_ids" jsonb NOT NULL, CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."message" ("id" character varying NOT NULL, "content" character varying NOT NULL, "authorId" character varying NOT NULL, "recipientId" character varying NOT NULL, "conversationId" character varying NOT NULL, "isRead" boolean NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."notification" ("id" character varying NOT NULL, "senderId" character varying NOT NULL, "recipientId" character varying NOT NULL, "content" character varying NOT NULL, "opened" boolean NOT NULL, "viewed" boolean NOT NULL, "type" character varying NOT NULL, "resourceId" character varying NOT NULL, "link" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."user_friends_user" ("user_id" character varying NOT NULL, "befriended_by_id" character varying NOT NULL, CONSTRAINT "PK_55fdc3419d427d6042e1425a1fc" PRIMARY KEY ("user_id", "befriended_by_id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_cf68805ef245070626bc628b43" ON "simplefeed"."user_friends_user" ("user_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_776ce12a18867b367d034fb64b" ON "simplefeed"."user_friends_user" ("befriended_by_id") `,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."user_friend_requests_friend_request" ("from_user_id" character varying NOT NULL, "to_user_id" character varying NOT NULL, CONSTRAINT "PK_65843254aefa7182787f2904fec" PRIMARY KEY ("from_user_id", "to_user_id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_6332adf584e0d5e2ef98179253" ON "simplefeed"."user_friend_requests_friend_request" ("from_user_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_f4aede1f9e39cd30eb4b5f03b2" ON "simplefeed"."user_friend_requests_friend_request" ("to_user_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."profile" ADD CONSTRAINT "FK_d752442f45f258a8bdefeebb2f2" FOREIGN KEY ("user_id") REFERENCES "simplefeed"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."friend_request" ADD CONSTRAINT "FK_7546f8014fd624ff26ce08d495d" FOREIGN KEY ("from_user_id") REFERENCES "simplefeed"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."friend_request" ADD CONSTRAINT "FK_982704090d6efc768cfd98f7fba" FOREIGN KEY ("to_user_id") REFERENCES "simplefeed"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."posts" ADD CONSTRAINT "FK_312c63be865c81b922e39c2475e" FOREIGN KEY ("author_id") REFERENCES "simplefeed"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."posts" ADD CONSTRAINT "FK_2339dae678777940cb213c699ac" FOREIGN KEY ("posted_to") REFERENCES "simplefeed"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."comment" ADD CONSTRAINT "FK_3ce66469b26697baa097f8da923" FOREIGN KEY ("author_id") REFERENCES "simplefeed"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."comment" ADD CONSTRAINT "FK_8aa21186314ce53c5b61a0e8c93" FOREIGN KEY ("post_id") REFERENCES "simplefeed"."posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."likes" ADD CONSTRAINT "FK_3f519ed95f775c781a254089171" FOREIGN KEY ("user_id") REFERENCES "simplefeed"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."likes" ADD CONSTRAINT "FK_741df9b9b72f328a6d6f63e79ff" FOREIGN KEY ("post_id") REFERENCES "simplefeed"."posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."message" ADD CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f" FOREIGN KEY ("conversationId") REFERENCES "simplefeed"."conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."user_friends_user" ADD CONSTRAINT "FK_cf68805ef245070626bc628b431" FOREIGN KEY ("user_id") REFERENCES "simplefeed"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."user_friends_user" ADD CONSTRAINT "FK_776ce12a18867b367d034fb64be" FOREIGN KEY ("befriended_by_id") REFERENCES "simplefeed"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."user_friend_requests_friend_request" ADD CONSTRAINT "FK_6332adf584e0d5e2ef981792531" FOREIGN KEY ("from_user_id") REFERENCES "simplefeed"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."user_friend_requests_friend_request" ADD CONSTRAINT "FK_f4aede1f9e39cd30eb4b5f03b21" FOREIGN KEY ("to_user_id") REFERENCES "simplefeed"."friend_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."user_friend_requests_friend_request" DROP CONSTRAINT "FK_f4aede1f9e39cd30eb4b5f03b21"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."user_friend_requests_friend_request" DROP CONSTRAINT "FK_6332adf584e0d5e2ef981792531"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."user_friends_user" DROP CONSTRAINT "FK_776ce12a18867b367d034fb64be"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."user_friends_user" DROP CONSTRAINT "FK_cf68805ef245070626bc628b431"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."message" DROP CONSTRAINT "FK_7cf4a4df1f2627f72bf6231635f"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."likes" DROP CONSTRAINT "FK_741df9b9b72f328a6d6f63e79ff"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."likes" DROP CONSTRAINT "FK_3f519ed95f775c781a254089171"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."comment" DROP CONSTRAINT "FK_8aa21186314ce53c5b61a0e8c93"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."comment" DROP CONSTRAINT "FK_3ce66469b26697baa097f8da923"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."posts" DROP CONSTRAINT "FK_2339dae678777940cb213c699ac"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."posts" DROP CONSTRAINT "FK_312c63be865c81b922e39c2475e"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."friend_request" DROP CONSTRAINT "FK_982704090d6efc768cfd98f7fba"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."friend_request" DROP CONSTRAINT "FK_7546f8014fd624ff26ce08d495d"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."profile" DROP CONSTRAINT "FK_d752442f45f258a8bdefeebb2f2"`,
    )
    await queryRunner.query(
      `DROP INDEX "simplefeed"."IDX_f4aede1f9e39cd30eb4b5f03b2"`,
    )
    await queryRunner.query(
      `DROP INDEX "simplefeed"."IDX_6332adf584e0d5e2ef98179253"`,
    )
    await queryRunner.query(
      `DROP TABLE "simplefeed"."user_friend_requests_friend_request"`,
    )
    await queryRunner.query(
      `DROP INDEX "simplefeed"."IDX_776ce12a18867b367d034fb64b"`,
    )
    await queryRunner.query(
      `DROP INDEX "simplefeed"."IDX_cf68805ef245070626bc628b43"`,
    )
    await queryRunner.query(`DROP TABLE "simplefeed"."user_friends_user"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."notification"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."message"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."conversations"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."likes"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."comment"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."posts"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."friend_request"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."profile"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."user"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."refresh_token"`)
  }
}
