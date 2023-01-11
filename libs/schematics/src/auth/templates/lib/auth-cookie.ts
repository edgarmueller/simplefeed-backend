import { TokenPayload } from './interfaces/token-payload.interface'

export class AuthCookie {
  public static cookieForLogOut() {
    return [
      'Authentication=; HttpOnly; Path=/; Max-Age=0',
      'Refresh=; HttpOnly; Path=/; Max-Age=0',
    ]
  }

  public static cookieForAccessToken(accessToken: string, maxAge: number) {
    return `Authentication=${accessToken}; HttpOnly; Path=/; Max-Age=${maxAge}`
  }

  public static cookieForAccessToken2(accessToken: string, maxAge: number) {
    return `${accessToken}; HttpOnly; Path=/; Max-Age=${maxAge}`
  }

  public static cookieForRefreshToken(refreshToken: string, maxAge): string {
    return `Refresh=${refreshToken}; HttpOnly; Path=/; Max-Age=${maxAge}`
  }

  public static cookieForRefreshToken2(refreshToken: string, maxAge): string {
    return `${refreshToken}; HttpOnly; Path=/; Max-Age=${maxAge}`
  }
}
