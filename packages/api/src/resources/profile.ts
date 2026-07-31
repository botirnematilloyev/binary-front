import { z } from "zod";
import { query, request, type RequestOptions } from "../http";

/*
 * Profil: o'zini tahrirlash, joylashuv ma'lumotnomasi va sessiyalar.
 *
 * `auth.ts` dan alohida, garchi `GET /me` o'sha yerda bo'lsa ham.
 * Sabab use-case: `auth.ts` — tizimga KIRISH (kod so'rash, tekshirish,
 * token yangilash), bu yerdagilar esa allaqachon kirgan odamning o'z
 * ma'lumotlari ustidagi amallari. Backendda ham xuddi shu ajratish bor:
 * `AuthService` va `ProfileService`.
 */

const localizedName = z.record(z.string(), z.string());

const regionSchema = z.object({
	id: z.number().int(),
	name: localizedName,
});

const districtSchema = z.object({
	id: z.number().int(),
	region_id: z.number().int(),
	name: localizedName,
});

export type RegionDto = z.infer<typeof regionSchema>;
export type DistrictDto = z.infer<typeof districtSchema>;

/**
 * Ochiq ma'lumotnoma: ro'yxatdan o'tish formasi ularni kirishdan OLDIN
 * yuklaydi, shuning uchun token talab qilinmaydi.
 */
export function listRegions(options?: RequestOptions) {
	return request("/regions", z.object({ regions: z.array(regionSchema) }), options);
}

export function listDistricts(regionId?: number, options?: RequestOptions) {
	return request(
		`/districts${query({ region_id: regionId })}`,
		z.object({ districts: z.array(districtSchema) }),
		options,
	);
}

const meSchema = z.object({
	id: z.number().int(),
	username: z.string(),
	full_name: z.string().nullable(),
	region_id: z.number().int().nullable(),
	district_id: z.number().int().nullable(),
	role: z.enum(["user", "setter", "admin"]),
	created_at: z.number().int(),
});

/**
 * PATCH semantikasi: berilmagan maydon TEGILMAYDI.
 *
 * `null` esa "tozalash" degani — masalan viloyatni olib tashlash.
 * Shuning uchun tana shartli yig'iladi: `undefined` ni JSON'ga
 * qo'shsak, u tushib qoladi va "tegma" bo'ladi; `null` esa qoladi va
 * "tozala" bo'ladi. Ikkovi bir xil ko'rinmasligi kerak.
 *
 * `username` bu yerda YO'Q: backend uni tahrirlashga ruxsat bermaydi.
 */
export interface UpdateMeInput {
	fullName?: string | null;
	regionId?: number | null;
	districtId?: number | null;
}

export function updateMe(input: UpdateMeInput, options: RequestOptions & { token: string }) {
	const body: Record<string, unknown> = {};
	if (input.fullName !== undefined) body["full_name"] = input.fullName;
	if (input.regionId !== undefined) body["region_id"] = input.regionId;
	if (input.districtId !== undefined) body["district_id"] = input.districtId;

	return request("/me", meSchema, { ...options, method: "PATCH", body });
}

const sessionSchema = z.object({
	id: z.number().int(),
	device_name: z.string().nullable(),
	platform: z.string().nullable(),
	os: z.string().nullable(),
	ip_address: z.string().nullable(),
	/** Joriy sessiya — uni o'chirish "o'zini chiqarish" degani. */
	is_current: z.boolean(),
	last_active_at: z.number().int().nullable(),
	expires_at: z.number().int(),
	created_at: z.number().int(),
});

export type SessionDto = z.infer<typeof sessionSchema>;

/**
 * Faol sessiyalar. Parolsiz akkaunt uchun bu shunchaki qulaylik emas:
 * parol yo'q, ya'ni "parolni almashtirib hammani chiqarish" ham yo'q —
 * begona qurilmani uzishning yagona yo'li shu ro'yxat.
 */
export function listSessions(options: RequestOptions & { token: string }) {
	return request("/sessions", z.object({ sessions: z.array(sessionSchema) }), options);
}

export function revokeSession(id: number, options: RequestOptions & { token: string }) {
	return request(`/sessions/${id}`, z.void(), { ...options, method: "DELETE" });
}

export function logoutAll(options: RequestOptions & { token: string }) {
	return request("/logout-all", z.void(), { ...options, method: "POST" });
}
