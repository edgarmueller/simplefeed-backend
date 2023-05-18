import { FriendRequest } from "@kittgen/user";

export class GetFriendRequestDto {
	id: string;
	from: {
		id: string;
		username: string;
		firstName: string;
		lastName: string;
		pictureUrl: string;
	}
	to: {
		id: string;
		username: string;
		firstName: string;
		lastName: string;
		pictureUrl: string;
	}

	static fromDomain(friendRequest: FriendRequest) { 
		return {
			id: friendRequest.id,
			from: {
				id: friendRequest.from.id,
				username: friendRequest.from.profile.username,
				firstName: friendRequest.from.profile.firstName,
				lastName: friendRequest.from.profile.lastName,
				pictureUrl: friendRequest.from.profile.imageUrl
			},
			to: {
				id: friendRequest.to.id,
				username: friendRequest.to.profile.username,
				firstName: friendRequest.to.profile.firstName,
				lastName: friendRequest.to.profile.lastName,
				pictureUrl: friendRequest.to.profile.imageUrl,
			}
		}
	}
}