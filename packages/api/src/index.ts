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
export * as taxonomyApi from "./resources/taxonomy";
export * as submissionsApi from "./resources/submissions";
export * as authApi from "./resources/auth";

export type {
	Difficulty,
	ProblemDetailDto,
	ProblemStatus,
	ProblemSummaryDto,
	SampleDto,
	StatementDto,
} from "./resources/problems";

export type { SubjectDto, TopicDto } from "./resources/taxonomy";

export type {
	AdminProblemDto,
	AdminProblemSummaryDto,
	AdminStatementDto,
	CreateProblemInput,
	StatementInput,
	TestCaseDto,
} from "./resources/admin-problems";

export type {
	LanguageDto,
	SubmissionDto,
	SubmissionStatus,
	Verdict,
} from "./resources/submissions";

export type { AuthDto, DeviceInfo, MeDto, OtpProvider, Role } from "./resources/auth";
