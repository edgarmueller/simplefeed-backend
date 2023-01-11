import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('refresh_token')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  public id?: string

  @Column()
  userId: string

  @Column({
    nullable: true,
  })
  token: string
}
