import { FriendRequest } from "@simplefeed/user";

export class GetFriendRequestDto {
	id: string;
	from: {
		id: string;
		username: string;
		firstName: string;
		lastName: string;
		imageUrl: string;
		isBot: boolean;
	}
	to: {
		id: string;
		username: string;
		firstName: string;
		lastName: string;
		imageUrl: string;
		isBot: boolean;
	}

	static fromDomain(friendRequest: FriendRequest) { 
		return {
			id: friendRequest.id,
			from: {
				id: friendRequest.from.id,
				username: friendRequest.from.profile.username,
				firstName: friendRequest.from.profile.firstName,
				lastName: friendRequest.from.profile.lastName,
				imageUrl: friendRequest.from.profile.imageUrl,
				isBot: friendRequest.from.profile.isBot
			},
			to: {
				id: friendRequest.to.id,
				username: friendRequest.to.profile.username,
				firstName: friendRequest.to.profile.firstName,
				lastName: friendRequest.to.profile.lastName,
				imageUrl: friendRequest.to.profile.imageUrl,
				isBot: friendRequest.to.profile.isBot,
			}
		}
	}
}