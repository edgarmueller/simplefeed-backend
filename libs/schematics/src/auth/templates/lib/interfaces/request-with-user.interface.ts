import { Request } from 'express'
import { User } from '@kittgen/user'

export interface RequestWithUser extends Request {
  user: User & { anonymous?: boolean }
}
