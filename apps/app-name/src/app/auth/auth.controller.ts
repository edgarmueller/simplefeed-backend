import {
  AuthService,
  JwtRefreshGuard,
  LocalAuthGuard,
  RequestWithUser,
} from '@kittgen/auth'
import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Profile, User, UserAlreadyExistsError } from '@kittgen/user'
import { GetUserDto } from './dto/get-user.dto'
import { RegisterUserDto } from './dto/register-user.dto'
import { AuthUsecases } from './auth.usecases'

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
    try {
      const registeredUser = await this.usecases.register(
        User.create({
          email: user.email,
          password: user.password,
          profile: Profile.create({ username: user.username }),
        })
      )
      return { user: GetUserDto.fromDomain(registeredUser).withToken(null) }
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        throw new ConflictException(error.message)
      }
      throw error
    }
  }

  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async logIn(@Req() request: RequestWithUser): Promise<{ user: GetUserDto }> {
    const { user } = request
    const { accessToken, refreshToken } = await this.usecases.login(user)
    return {
      user: GetUserDto.fromDomain(user)
        .withToken(accessToken)
        .withRefreshToken(refreshToken),
    }
  }

  @UseGuards(JwtRefreshGuard)
  @Post('users/refresh')
  @HttpCode(200)
  async refresh(
    @Req()
    request: RequestWithUser /*@Res({ passthrough: true }) response: Response*/
  ) {
    // TODO: if we were to use cookies
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
}
