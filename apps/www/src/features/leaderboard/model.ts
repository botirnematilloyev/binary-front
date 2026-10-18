import type { LeaderboardEntryDto } from "@binary/api";

export interface LeaderboardRow {
	rank: number;
	userId: number;
	username: string;
	displayName: string;
	initials: string;
	solved: number;
	rating: number;
	change: number;
}

export function toLeaderboardRow(dto: LeaderboardEntryDto): LeaderboardRow {
	const displayName = dto.full_name?.trim() || `@${dto.username}`;

	return {
		rank: dto.rank,
		userId: dto.user_id,
		username: dto.username,
		displayName,
		initials: initials(displayName, dto.username),
		solved: dto.solved,
		rating: dto.rating,
		change: dto.change,
	};
}

function initials(name: string, username: string): string {
	const parts = name
		.replace(/^@/, "")
		.split(/\s+/)
		.filter(Boolean);

	const letters = parts.length >= 2 ? [parts[0], parts[1]] : [parts[0] ?? username];
	return letters
		.map((part) => Array.from(part ?? "")[0] ?? "")
		.join("")
		.toUpperCase()
		.slice(0, 2);
}
