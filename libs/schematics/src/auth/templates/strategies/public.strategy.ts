import { Injectable } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { Strategy } from "passport-local"

@Injectable()
export class PublicStrategy extends PassportStrategy(Strategy, 'public') {
  constructor() {
    super()
  }

  authenticate() {
    return this.success({
      anonymous: true
    })
  }
}