import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBotFlag1792868551565 implements MigrationInterface {
  name = 'AddBotFlag1792868551565'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."profile" ADD "is_bot" boolean NOT NULL DEFAULT false`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."profile" DROP COLUMN "is_bot"`,
    )
  }
}
