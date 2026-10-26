import { RefreshToken } from '@simplefeed/auth'
import { readerSchemas } from '@simplefeed/reader'
import { ProfileSchema, UserSchema } from '@simplefeed/user'

export const entities = [UserSchema, ProfileSchema, RefreshToken, ...readerSchemas]
