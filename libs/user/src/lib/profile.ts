import { Entity, Props, createId } from '@kittgen/shared-ddd';

import { User } from "./user" 

const PREFIX = 'pro'
export type ProfileId = string
const createProfileId = createId(PREFIX)

export class Profile implements Entity {
  
  username?: string 
  bio?: string 
  image?: string 
  createdAt?: Date 
  updatedAt?: Date 
  
  follows?: Profile[] 
  followedBy?: Profile[] 
  user?: User 

  public static create(props: Props<Profile>, id?: string): Profile {
    const profile = new Profile({ ...props }, id);
    return profile;
  }

  private constructor(props: Props<Profile>, readonly id: string) {
    Object.assign(this, props)
    this.id = id || createProfileId()
  }

  // TODO: add domain logic
}
