import { FriendRequestRepository, FriendRequest, User, UsersRepository } from '@kittgen/user';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common'

@Injectable()
export class FriendRequestUsecases {
  private logger = new Logger(FriendRequestUsecases.name)

  constructor(
		private readonly userRepository: UsersRepository,
		private readonly friendRequestRepository: FriendRequestRepository
	) {}
	
  async sendFriendRequest(from: User, toUserName: string): Promise<FriendRequest> {
    const toUser = await this.userRepository.findOneByUsernameOrFail(toUserName)
    const friendRequest = from.sendFriendRequestTo(toUser)
    await this.userRepository.saveMany([from, toUser])
    return friendRequest
  }

  async getPendingFriendRequests(forUser: User): Promise<FriendRequest[]> {
    const friendRequests = await this.friendRequestRepository.findFriendRequestsByUserId(forUser.id);
    return friendRequests
  }

  async cancelFriendRequest(actor: User, friendRequestId: string): Promise<void> {
    const friendRequest = await this.friendRequestRepository.findOneByIdWithFriends(friendRequestId);
    if (actor === friendRequest.from) {
      friendRequest.cancel();
    } else if (actor === friendRequest.to) {
      friendRequest.decline();
    } else {
      throw new ForbiddenException();
    }
    await this.userRepository.saveMany([friendRequest.from, friendRequest.to]);
  }

  async confirmRequest(friendRequestId: string): Promise<void> {
    const foundRequest = await this.friendRequestRepository.findOneByIdWithFriends(friendRequestId);
    if (!foundRequest) {
      throw new Error('Friend request has not been sent');
    }
    foundRequest.accept();
    await this.userRepository.saveMany([foundRequest.from, foundRequest.to]);
  }
}