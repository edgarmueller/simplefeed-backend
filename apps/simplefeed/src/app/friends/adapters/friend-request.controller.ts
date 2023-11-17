import { FriendRequest } from '@simplefeed/user';
import { JwtAuthGuard, RequestWithUser } from '@simplefeed/auth';
import { Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { FriendUsecases } from '@simplefeed/user';
import { GetFriendRequestDto } from '../dto/get-friend-request.dto';

@Controller('friend-requests')
export class FriendRequestsController {
  constructor(private readonly usecases: FriendUsecases) {}

  @UseGuards(JwtAuthGuard)
  @Post(':username')
  async sendFriendRequest(
    @Req() req: RequestWithUser,
    @Param('username') toUserName: string
  ): Promise<GetFriendRequestDto> {
    const fromUser = req.user
    return GetFriendRequestDto.fromDomain(await this.usecases.sendFriendRequest(fromUser, toUserName))
  }

  @UseGuards(JwtAuthGuard)
  @Get('pending')
  async getPendingFriendRequests(
    @Req() req: RequestWithUser
  ): Promise<GetFriendRequestDto[]> {
    const friendRequests = await this.usecases.getReceivedFriendRequests(req.user)
    return friendRequests.map(GetFriendRequestDto.fromDomain)
  }

  @UseGuards(JwtAuthGuard)
  @Get('sent')
  async getSentFriendRequests(
    @Req() req: RequestWithUser
  ): Promise<GetFriendRequestDto[]> {
    const friendRequests = await this.usecases.getSentFriendRequests(req.user)
    return friendRequests.map(GetFriendRequestDto.fromDomain)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':friendRequestId')
  async confirmFriendRequest(@Param('friendRequestId') friendRequestId: string) {
    const friendRequest = await this.usecases.confirmRequest(friendRequestId);
    return GetFriendRequestDto.fromDomain(friendRequest);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':friendRequestId')
  async cancelFriendRequest(
    @Req() req: RequestWithUser,
    @Param('friendRequestId') friendRequestId: string
  ): Promise<void> {
    return this.usecases.cancelFriendRequest(req.user, friendRequestId);
  }
}