import { RefreshToken } from '@simplefeed/auth'
import { ConversationSchema, MessageSchema } from '@simplefeed/chat'
import { NotificationSchema } from '@simplefeed/notification'
import { CommentSchema, LikeSchema, PostSchema } from '@simplefeed/post'
import { FriendRequestSchema, ProfileSchema, UserSchema } from '@simplefeed/user'

export const entities = [
  UserSchema,
  ProfileSchema,
  FriendRequestSchema,
  RefreshToken,
  PostSchema,
  CommentSchema,
  LikeSchema,
  ConversationSchema,
  MessageSchema,
  NotificationSchema,
]
