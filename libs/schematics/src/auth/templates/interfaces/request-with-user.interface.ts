import { Request } from 'express'
import { User } from '@realworld/user'

export interface RequestWithUser extends Request {
  user: User & { anonymous?: boolean }
}
