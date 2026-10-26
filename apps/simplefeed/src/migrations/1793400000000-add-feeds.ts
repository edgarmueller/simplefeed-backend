import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFeeds1793400000000 implements MigrationInterface {
  name = 'AddFeeds1793400000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."feed" ("id" character varying NOT NULL, "url" character varying NOT NULL, "feed_url" character varying, "title" character varying, "status" character varying NOT NULL, "error" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "channel_id" character varying, CONSTRAINT "UQ_8b50ee8dd27f84bebd722d64a7c" UNIQUE ("url"), CONSTRAINT "PK_8a8dfd1ff306ccdf65f0b5d04b2" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."feed_requesters" ("feed_id" character varying NOT NULL, "user_id" character varying NOT NULL, CONSTRAINT "PK_26aa816a5387b3e49201af79d0e" PRIMARY KEY ("feed_id", "user_id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_0d2ea013c70ad3801bcf96f68f" ON "simplefeed"."feed_requesters" ("feed_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_6d61c4e738f51fb7af9fb95dd9" ON "simplefeed"."feed_requesters" ("user_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."feed" ADD CONSTRAINT "FK_dd0bb976406899926844fe6f344" FOREIGN KEY ("channel_id") REFERENCES "simplefeed"."user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."feed_requesters" ADD CONSTRAINT "FK_0d2ea013c70ad3801bcf96f68fa" FOREIGN KEY ("feed_id") REFERENCES "simplefeed"."feed"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."feed_requesters" ADD CONSTRAINT "FK_6d61c4e738f51fb7af9fb95dd9b" FOREIGN KEY ("user_id") REFERENCES "simplefeed"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."feed_requesters" DROP CONSTRAINT "FK_6d61c4e738f51fb7af9fb95dd9b"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."feed_requesters" DROP CONSTRAINT "FK_0d2ea013c70ad3801bcf96f68fa"`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."feed" DROP CONSTRAINT "FK_dd0bb976406899926844fe6f344"`,
    )
    await queryRunner.query(
      `DROP INDEX "simplefeed"."IDX_6d61c4e738f51fb7af9fb95dd9"`,
    )
    await queryRunner.query(
      `DROP INDEX "simplefeed"."IDX_0d2ea013c70ad3801bcf96f68f"`,
    )
    await queryRunner.query(`DROP TABLE "simplefeed"."feed_requesters"`)
    await queryRunner.query(`DROP TABLE "simplefeed"."feed"`)
  }
}
