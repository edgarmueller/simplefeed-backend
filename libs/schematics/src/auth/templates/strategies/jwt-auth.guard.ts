import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
 
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context: ExecutionContext, status?: any) {
    const authInfo = (context.switchToHttp().getRequest().authInfo)
    if (authInfo instanceof Error && authInfo.message.includes('jwt expired')) {
      throw new UnauthorizedException('Token expired')
    }
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}