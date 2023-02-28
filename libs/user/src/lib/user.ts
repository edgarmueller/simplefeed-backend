import { AggregateRoot, Props, createId } from '@kittgen/shared-ddd';
import { UserCreatedEvent } from './events/user-created.event';
import { Profile } from "./profile" 

const PREFIX = 'use'
export type UserId = string
const createUserId = createId(PREFIX)

export class User extends AggregateRoot {
  email?: string 
  password?: string 
  createdAt?: Date 
  updatedAt?: Date 
  
  profile: Profile 

  public static create(props: Props<User>, id?: string): User {
    const isNewUser = !!id === false;
    const user = new User({ ...props }, id);

    if (isNewUser) {
      user.emitDomainEvent(new UserCreatedEvent(user));
    }

    return user;
  }

  private constructor(props: Props<User>, id?: string) {
    super(props, id || createUserId());
  }
}
