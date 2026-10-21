/**
 * `@binary/api` — Go API bilan yagona shartnoma.
 *
 * Tashqi dunyo faqat shu fayldan import qiladi (`resources/*` dan
 * to'g'ridan-to'g'ri emas), shunda ichki tuzilishni o'zgartirish
 * iste'molchilarni sindirmaydi. Bu backenddagi "modul faqat o'z
 * `index` orqali ko'rinadi" qoidasining aynan o'zi.
 */

export {
	ApiContractError,
	ApiError,
	ApiTransportError,
	request,
	type RequestOptions,
} from "./http";

export * as problemsApi from "./resources/problems";
export * as adminProblemsApi from "./resources/admin-problems";
export * as adminTopicsApi from "./resources/admin-topics";
export * as adminUsersApi from "./resources/admin-users";
export * as taxonomyApi from "./resources/taxonomy";
export * as submissionsApi from "./resources/submissions";
export * as leaderboardApi from "./resources/leaderboard";
export * as authApi from "./resources/auth";
export * as profileApi from "./resources/profile";

export type {
	Difficulty,
	ProblemDetailDto,
	ProblemStatus,
	ProblemSummaryDto,
	SampleDto,
	StatementDto,
} from "./resources/problems";

export type {
	RoadmapDto,
	RoadmapNodeDto,
	SubjectDto,
	TopicDto,
} from "./resources/taxonomy";

export type {
	AdminTopicDto,
	CreateTopicInput,
	UpdateTopicInput,
} from "./resources/admin-topics";

export type {
	AdminProblemDto,
	AdminProblemSummaryDto,
	AdminStatementDto,
	CreateProblemInput,
	StatementInput,
	TestCaseDto,
} from "./resources/admin-problems";

export type {
	AccountProvider,
	AdminSubmissionDto,
	AdminUserDetailDto,
	AdminUserSummaryDto,
	LinkedAccountDto,
	SolvedProblemDto,
} from "./resources/admin-users";

export type {
	ActivityDto,
	LanguageDto,
	StatsDto,
	SubmissionDto,
	SubmissionStatus,
	Verdict,
} from "./resources/submissions";

export type {
	LeaderboardDto,
	LeaderboardEntryDto,
} from "./resources/leaderboard";

export type { AuthDto, DeviceInfo, MeDto, OtpProvider, Role } from "./resources/auth";

export type {
	DistrictDto,
	RegionDto,
	SessionDto,
	UpdateMeInput,
} from "./resources/profile";
