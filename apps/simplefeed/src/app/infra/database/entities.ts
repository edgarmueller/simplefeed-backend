import { RefreshToken } from '@simplefeed/auth'
import { ConversationSchema, MessageSchema } from '@simplefeed/chat'
import { FeedSchema } from '@simplefeed/feed'
import { NotificationSchema } from '@simplefeed/notification'
import { LikeSchema, PostSchema } from '@simplefeed/post'
import { ProfileSchema, UserSchema } from '@simplefeed/user'

export const entities = [
  UserSchema,
  ProfileSchema,
  RefreshToken,
  PostSchema,
  LikeSchema,
  ConversationSchema,
  MessageSchema,
  NotificationSchema,
  FeedSchema,
]
