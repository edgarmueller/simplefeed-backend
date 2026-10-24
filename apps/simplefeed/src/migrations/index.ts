import { InitialSchema1792351315435 } from './1792351315435-initial-schema'
import { AddBotFlag1792868551565 } from './1792868551565-add-bot-flag'
import { SubscriptionsOnly1793200000000 } from './1793200000000-subscriptions-only'
import { DropComments1793300000000 } from './1793300000000-drop-comments'

// Migrations are bundled into the build, so each one has to be listed here.
export const migrations = [
  InitialSchema1792351315435,
  AddBotFlag1792868551565,
  SubscriptionsOnly1793200000000,
  DropComments1793300000000,
]
