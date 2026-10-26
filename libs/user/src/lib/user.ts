import { AggregateRoot, Props, createId } from '@simplefeed/shared-ddd';
import bcrypt from 'bcrypt';
import { Profile } from './profile';

const PREFIX = 'use'
export type UserId = string
const createUserId = createId(PREFIX)

/** A reader's account. */
export class User extends AggregateRoot {
  email?: string
  password?: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date

  profile: Profile
  closed?: boolean;

  public static create(props: Props<User>, id?: string): User {
    return new User({ ...props }, id)
  }

  private constructor(props: Props<User>, id?: string) {
    super(props, id || createUserId())
  }

  updateEmail(email: string) {
    if (email) {
      this.email = email;
    }
  }

  async updatePassword(password: string) {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      this.password = hashedPassword;
    }
  }

  close() {
    this.closed = true;
  }
}
