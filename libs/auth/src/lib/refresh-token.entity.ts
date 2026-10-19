import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('refresh_token')
export class RefreshToken {
  @PrimaryGeneratedColumn('increment')
  public id?: number

  @Column({ type: 'varchar' })
  userId: string

  @Column({ type: 'varchar', nullable: true })
  token: string
}
