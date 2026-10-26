import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Patch,
  Post,
  Req,
  UseGuards
} from '@nestjs/common'
import {
  AuthService,
  AuthUsecases,
  JwtRefreshGuard,
  LocalAuthGuard,
  RequestWithUser,
} from '@simplefeed/auth'
import { Profile, User } from '@simplefeed/user'
import { GetTokenDto } from './dto/get-token.dto'
import { GetUserDto } from './dto/get-user.dto'
import { RegisterUserDto } from './dto/register-user.dto'
import { UpdatePasswordDto } from './dto/update-password.dto'

@Controller('auth')
export class AuthController {
  private logger = new Logger(AuthController.name)

  constructor(
    private readonly usecases: AuthUsecases,
    private readonly authService: AuthService
  ) {}
  @Post('register')
  async register(
    @Body() { user }: RegisterUserDto
  ): Promise<{ user: GetUserDto }> {
    const registeredUser = await this.usecases.register(
      User.create({
        email: user.email,
        password: user.password,
        profile: Profile.create({
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        }),
      })
    )
    return { user: GetUserDto.fromDomain(registeredUser) }
  }

  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async logIn(@Req() request: RequestWithUser): Promise<GetTokenDto> {
    const { user } = request
    return await this.usecases.login(user)
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req()
    request: RequestWithUser /*@Res({ passthrough: true }) response: Response*/
  ) {
    // if we were to use cookies
    // --
    // if (this.useCookies) {
    //   const accessTokenCookie = await this.authService.createAccessTokenCookie(request.user.id)
    //   response.setHeader('Set-Cookie', accessTokenCookie);
    //   return request.user
    // }
    const accessToken = await this.authService.createAccessToken(request.user)

    return {
      accessToken,
    }
  }

  @UseGuards(JwtRefreshGuard)
  @Patch('update-password')
  async updatePassword(
    @Req() request: RequestWithUser,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    return this.authService.updatePassword(
      request.user,
      updatePasswordDto.password
    )
  }
}
