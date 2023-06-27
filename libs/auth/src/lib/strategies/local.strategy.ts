import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { User } from '@simplefeed/user'
import { AuthService } from '../auth.service'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authenticationService: AuthService) {
    super({
      usernameField: 'user[]email',
      passwordField: 'user[]password',
    })
  }
  async validate(email: string, password: string): Promise<User> {
    try {
      return await this.authenticationService.authenticate(email, password)
    } catch (error) {
      throw new UnauthorizedException(error.message)
    }
  }
}
