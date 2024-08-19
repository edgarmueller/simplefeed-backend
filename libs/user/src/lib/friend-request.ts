import { AggregateRoot, Props, createId } from '@simplefeed/shared-ddd'
import { FriendRequestAccepted } from './events/friend-request-accepted.event'
import { User } from './user'

const PREFIX = 'frq'
const createFriendRequestId = createId(PREFIX)

export class FriendRequest extends AggregateRoot {
  id: string
  from: User
  to: User
  createdAt?: Date
  deletedAt?: Date 

  public static create(props: Props<FriendRequest>, id?: string): FriendRequest {
    const friendRequest = new FriendRequest({ ...props }, id)
		return friendRequest;
  }

  constructor(props: Props<FriendRequest>, id?: string) {
    super(props, id || createFriendRequestId())
  }

  accept() {
    this.from.addFriend(this.to);
    this.from.friendRequests = this.from.friendRequests?.filter(req => req.id !== this.id);
    this.to.friendRequests = this.to.friendRequests?.filter(req => req.id !== this.id);
    this.emitDomainEvent(new FriendRequestAccepted(this))
  }

  decline() {
    this.from.friendRequests = this.from.friendRequests?.filter(req => req.id !== this.id);
    this.to.friendRequests = this.to.friendRequests?.filter(req => req.id !== this.id);
  }

  cancel() {
    // currently the same as decline
    this.decline();
  }
}
