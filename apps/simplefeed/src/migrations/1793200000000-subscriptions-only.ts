import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Users only subscribe to channels now, which takes effect immediately:
 * friend requests go away, and so do connections between two regular users.
 */
export class SubscriptionsOnly1793200000000 implements MigrationInterface {
  name = 'SubscriptionsOnly1793200000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "simplefeed"."user_friend_requests_friend_request"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."friend_request"`)
    await queryRunner.query(
      `DELETE FROM "simplefeed"."user_friends_user" AS connection
       WHERE NOT EXISTS (
         SELECT 1 FROM "simplefeed"."profile" AS profile
         WHERE profile."is_bot" AND profile."user_id" IN (connection."user_id", connection."befriended_by_id")
       )`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // the deleted connections can't be restored
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."friend_request" ("id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "from_user_id" character varying, "to_user_id" character varying, CONSTRAINT "PK_4c9d23ff394888750cf66cac17c" PRIMARY KEY ("id"))`,
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
      `ALTER TABLE "simplefeed"."friend_request" ADD CONSTRAINT "FK_7546f8014fd624ff26ce08d495d" FOREIGN KEY ("from_user_id") REFERENCES "simplefeed"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."friend_request" ADD CONSTRAINT "FK_982704090d6efc768cfd98f7fba" FOREIGN KEY ("to_user_id") REFERENCES "simplefeed"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."user_friend_requests_friend_request" ADD CONSTRAINT "FK_6332adf584e0d5e2ef981792531" FOREIGN KEY ("from_user_id") REFERENCES "simplefeed"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."user_friend_requests_friend_request" ADD CONSTRAINT "FK_f4aede1f9e39cd30eb4b5f03b21" FOREIGN KEY ("to_user_id") REFERENCES "simplefeed"."friend_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }
}
