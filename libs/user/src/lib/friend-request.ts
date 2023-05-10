import { AggregateRoot, Props, createId } from '@kittgen/shared-ddd'
import { User, UserId } from './user'

const PREFIX = 'frq'
const createFriendRequestId = createId(PREFIX)

export class FriendRequest extends AggregateRoot {
  id: string
  from: User
  to: User
  createdAt?: Date

  public static create(props: Props<FriendRequest>, id?: string): FriendRequest {
    const friendRequest = new FriendRequest({ ...props }, id)
		return friendRequest;
  }

  constructor(props: Props<FriendRequest>, id?: string) {
    super(props, id || createFriendRequestId())
  }

  accept() {
    this.from.addFriend(this.to);
    this.from.outgoingFriendRequests = this.from.outgoingFriendRequests?.filter(req => req.id !== this.id);
    this.to.incomingFriendRequests = this.to.incomingFriendRequests?.filter(req => req.id !== this.id);
  }

  decline() {
    this.from.outgoingFriendRequests = this.from.outgoingFriendRequests?.filter(req => req.id !== this.id);
    this.to.incomingFriendRequests = this.to.incomingFriendRequests?.filter(req => req.id !== this.id);
  }

  cancel() {
    // currently the same as decline
    this.decline();
  }
}
