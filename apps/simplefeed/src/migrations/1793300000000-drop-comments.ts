import { MigrationInterface, QueryRunner } from 'typeorm'

/** Posts link to their source's discussion instead of having comments. */
export class DropComments1793300000000 implements MigrationInterface {
  name = 'DropComments1793300000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "simplefeed"."comment"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // the dropped comments can't be restored
    await queryRunner.query(
      `CREATE TABLE "simplefeed"."comment" ("id" character varying NOT NULL, "content" character varying NOT NULL, "path" ltree, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "author_id" character varying, "post_id" character varying, CONSTRAINT "PK_0b0e4bbc8415ec426f87f3a88e2" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."comment" ADD CONSTRAINT "FK_3ce66469b26697baa097f8da923" FOREIGN KEY ("author_id") REFERENCES "simplefeed"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE "simplefeed"."comment" ADD CONSTRAINT "FK_8aa21186314ce53c5b61a0e8c93" FOREIGN KEY ("post_id") REFERENCES "simplefeed"."posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }
}
