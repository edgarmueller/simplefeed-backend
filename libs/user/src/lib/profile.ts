import { Entity, Props, createId } from '@kittgen/shared-ddd';

import { User } from "./user" 

const PREFIX = 'pro'
export type ProfileId = string
const createProfileId = createId(PREFIX)

export class Profile implements Entity {
  username?: string 
  bio?: string 
  firstName?: string 
  lastName?: string 
  imageUrl?: string 
  nrOfPosts?: number 
  nrOfLikes?: number 
  createdAt?: Date 
  updatedAt?: Date 
  
  user?: User 

  public static create(props: Props<Profile>, id?: string): Profile {
    const profile = new Profile({ ...props }, id);
    return profile;
  }

  private constructor(props: Props<Profile>, readonly id: string) {
    Object.assign(this, props)
    this.id = id || createProfileId()
  }

  incrementPostCount() {
    this.nrOfPosts++;
  }

  decrementPostCount() {
    this.nrOfPosts--;
  }

  incrementLikeCount() {
    this.nrOfLikes++;
  }

  decrementLikeCount() {
    this.nrOfLikes--;
  }

  updateAvatar(location: string) {
    if (location) {
      this.imageUrl = location;
    }
  }

  updateProfile(updatedProps: Pick<Profile, 'firstName' | 'lastName'>) {
    if (updatedProps.firstName) {
      this.firstName = updatedProps.firstName;
    }
    if (updatedProps.lastName) {
      this.lastName = updatedProps.lastName;
    }
  }
}
