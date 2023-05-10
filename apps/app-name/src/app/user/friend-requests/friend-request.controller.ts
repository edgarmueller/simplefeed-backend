import { JwtAuthGuard, RequestWithUser } from '@kittgen/auth';
import { FriendRequest } from '@kittgen/user';
import { Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { FriendRequestUsecases } from "./friend-request.usecases";
import { GetFriendRequestDto } from './get-friend-request.dto';

@Controller()
export class FriendRequestsController {
  constructor(private readonly usecases: FriendRequestUsecases) {}

  @UseGuards(JwtAuthGuard)
  @Post('/friend-requests/:username')
  async sendFriendRequest(
    @Req() req: RequestWithUser,
    @Param('username') toUserName: string
  ): Promise<GetFriendRequestDto> {
    const fromUser = req.user
    const friendRequest = await this.usecases.sendFriendRequest(fromUser, toUserName)
    return {
      id: friendRequest.id,
      from: friendRequest.from.id,
      to: friendRequest.to.id,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('friend-requests/pending')
  async getPendingFriendRequests(
    @Req() req: RequestWithUser
  ): Promise<FriendRequest[]> {
    const pendingRequets = await this.usecases.getPendingFriendRequests(req.user)
    return pendingRequets;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('friend-requests/:friendRequestId')
  async confirmFriendRequest(@Param('friendRequestId') friendRequestId: string) {
    return this.usecases.confirmRequest(friendRequestId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('friend-requests/:friendRequestId')
  async cancelFriendRequest(
    @Req() req: RequestWithUser,
    @Param('friendRequestId') friendRequestId: string
  ): Promise<void> {
    return this.usecases.cancelFriendRequest(req.user, friendRequestId);
  }

}