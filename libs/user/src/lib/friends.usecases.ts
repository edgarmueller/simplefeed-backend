import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { UsersRepository } from './user.repository';
import { FriendRequestRepository } from './friend-request.repository';
import { User } from './user';
import { FriendRequest } from './friend-request';

@Injectable()
export class FriendUsecases {
  private logger = new Logger(FriendUsecases.name)

  constructor(
		private readonly userRepository: UsersRepository,
		private readonly friendRequestRepository: FriendRequestRepository
	) {}
	
  async sendFriendRequest(from: User, toUserName: string): Promise<FriendRequest> {
    const toUser = await this.userRepository.findOneByUsernameWithFriendRequestsOrFail(toUserName)
    const friendRequest = from.sendFriendRequestTo(toUser)
    await this.userRepository.saveMany([from, toUser])
    return friendRequest
  }

  async getSentFriendRequests(forUser: User): Promise<FriendRequest[]> {
    const friendRequests = await this.friendRequestRepository.findFriendRequestsFromUserId(forUser.id)
    return friendRequests
  }

  async getReceivedFriendRequests(forUser: User): Promise<FriendRequest[]> {
    const friendRequests = await this.friendRequestRepository.findFriendRequestsForUserId(forUser.id);
    return friendRequests
  }

  async cancelFriendRequest(actor: User, friendRequestId: string): Promise<void> {
    const friendRequest = await this.friendRequestRepository.findOneByIdWithFriends(friendRequestId);
    if (actor.id === friendRequest.from.id) {
      friendRequest.cancel();
    } else if (actor.id === friendRequest.to.id) {
      friendRequest.decline();
    } else {
      throw new ForbiddenException();
    }
    await this.friendRequestRepository.delete(friendRequest);
  }

  async confirmRequest(friendRequestId: string): Promise<void> {
    const foundRequest = await this.friendRequestRepository.findOneByIdWithFriends(friendRequestId);
    if (!foundRequest) {
      throw new Error('Friend request has not been sent');
    }
    foundRequest.accept();
    await this.userRepository.saveMany([foundRequest.from, foundRequest.to]);
    await this.friendRequestRepository.delete(foundRequest);
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const user = await this.userRepository.findOneByIdWithFriendsOrFail(userId)
    const friend = await this.userRepository.findOneByIdWithFriendsOrFail(
      friendId
    )
    user.unfriend(friend)
    await this.userRepository.saveMany([user, friend])
  }
}