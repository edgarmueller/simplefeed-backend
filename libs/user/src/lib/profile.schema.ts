import { EntitySchema } from 'typeorm'
import { Profile } from './profile'
import { User } from './user' 

export const ProfileSchema = new EntitySchema<Profile>({
  target: Profile,
  name: "Profile",
  tableName: "profile",
  columns: {
    id: {
      type: String,
      primary: true,
    },
		
		username: {
			type: String,
			unique: false,
			nullable: false,
      
		},
		
		bio: {
			type: String,
			unique: false,
			nullable: true,
      
		},
		
		image: {
			type: String,
			unique: false,
			nullable: true,
      
		},
		
		createdAt: {
			type: Date,
			unique: false,
			nullable: false,
      
      createDate: true,
      
		},
		
		updatedAt: {
			type: Date,
			unique: false,
			nullable: false,
      
      updateDate: true
      
		},
		
  },
  relations: {
		
    follows: {
      type: "many-to-many",
      target: "Profile",
      inverseSide: 'followedBy',
      
      
      
      
      
        joinTable: {
          joinColumn: {
            name: 'profile_id',
            referencedColumnName: 'id' 
          },
          inverseJoinColumn: {
            name: 'followed_by_id',
            referencedColumnName: 'id' 
          }
        }
      
    },
		
    user: {
      type: "one-to-one",
      target: "User",
      inverseSide: 'profile',
      
      
      onDelete: "CASCADE",
      joinColumn: { name: "user_id", }
      
    },
		
  }
})
