import { Props, createId } from '@simplefeed/shared-ddd'
import { Subscription } from './subscription'

const createMessageId = createId('tun')

export type MessageAuthor = 'reader' | 'channel'

/** A message in the chat between a reader and a channel, used to tune it. */
export class TuningMessage {
  readonly id: string
  subscription: Subscription
  author: MessageAuthor
  content: string
  /** for the reader's messages: whether the channel has answered */
  answered: boolean
  createdAt?: Date

  static create(props: Props<TuningMessage>, id?: string) {
    return Object.assign(new TuningMessage(id), props)
  }

  private constructor(id?: string) {
    this.id = id || createMessageId()
  }
}
