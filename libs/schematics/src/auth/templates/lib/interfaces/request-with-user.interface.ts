import { Request } from 'express'
import { User } from '@simplefeed/user'

export interface RequestWithUser extends Request {
  user: User & { anonymous?: boolean }
}
