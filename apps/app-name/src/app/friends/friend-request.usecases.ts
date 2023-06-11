import { FriendRequestRepository, FriendRequest, User, UsersRepository } from '@kittgen/user';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common'
import { GetFriendRequestDto } from './get-friend-request.dto';

@Injectable()
export class FriendRequestUsecases {
  private logger = new Logger(FriendRequestUsecases.name)

  constructor(
		private readonly userRepository: UsersRepository,
		private readonly friendRequestRepository: FriendRequestRepository
	) {}
	
  async sendFriendRequest(from: User, toUserName: string): Promise<GetFriendRequestDto> {
    const toUser = await this.userRepository.findOneByUsernameOrFail(toUserName)
    const friendRequest = from.sendFriendRequestTo(toUser)
    await this.userRepository.saveMany([from, toUser])
    return GetFriendRequestDto.fromDomain(friendRequest);
  }

  async getSentFriendRequests(forUser: User): Promise<GetFriendRequestDto[]> {
    const friendRequests = await this.friendRequestRepository.findFriendRequestsFromUserId(forUser.id);
    return friendRequests.map(friendRequest => GetFriendRequestDto.fromDomain(friendRequest));
  }

  async getReceivedFriendRequests(forUser: User): Promise<GetFriendRequestDto[]> {
    const friendRequests = await this.friendRequestRepository.findFriendRequestsForUserId(forUser.id);
    return friendRequests.map(friendRequest => GetFriendRequestDto.fromDomain(friendRequest));
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
    await this.friendRequestRepository.delete(foundRequest);
  }
}