import { JwtAuthGuard, RequestWithUser } from '@kittgen/auth';
import { Controller, Delete, Param, Req, UseGuards } from "@nestjs/common";
import { FriendUsecases } from './friends.usecases';

@Controller('friends')
export class FriendsController {
  constructor(private readonly usecases: FriendUsecases) {}

  @UseGuards(JwtAuthGuard)
  @Delete(':friendId')
  async removeFriend(
    @Req() req: RequestWithUser,
    @Param('friendId') friendId: string
  ): Promise<void> {
    return this.usecases.removeFriend(req.user.id, friendId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':friendId/mutual-friends')
  async getMutualFriends(@Req() req: RequestWithUser, friendId: string): Promise<string[]> {
    // return this.usecases.getMutualFriends(req.user, friendId);
  }
}