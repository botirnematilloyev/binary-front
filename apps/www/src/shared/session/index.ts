/**
 * Sessiya — `shared`, `features/auth` emas.
 *
 * Boshida u `features/auth` ichida edi va bu qatlam qoidasini buzardi:
 * `features/submission` unga murojaat qilishi kerak, feature esa
 * feature'dan import qilmaydi. Sessiya kesib o'tuvchi (cross-cutting)
 * narsa — har feature unga muhtoj bo'lishi mumkin, shuning uchun u
 * pastroq qatlamda.
 *
 * `features/auth` da endi faqat LOGIN OQIMI qoladi (forma, kod kiritish)
 * — bu haqiqatan bitta use-case.
 */
export {
	SessionProvider,
	useSession,
	type SessionStatus,
} from "./session-provider";

export { SessionExpiredError, withFreshToken } from "./token-store";
