import { createConnection } from "typeorm"

export async function createDbSchema(): Promise<void> {
  const connection = await createConnection({
    type: 'postgres',
    host: 'localhost',
    port: 5433,
    username: 'admin',
    password: 'admin',
    database: 'simplefeed_testing',
  })
  await connection.createQueryRunner().createSchema('simplefeed', true)
  await connection.close()
}