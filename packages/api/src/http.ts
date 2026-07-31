import { z } from "zod";

/**
 * Go API bilan gaplashuvchi yagona joy.
 *
 * Bu fayldan tashqarida `fetch` chaqirilmaydi. Sabab: token, bazaviy
 * manzil, timeout, xato o'girish va sxema tekshiruvi — beshtasi ham
 * har chaqiruvda takrorlanishi kerak bo'lgan qarorlar. Ular bir joyda
 * bo'lmasa, oxir-oqibat biri esdan chiqadi va aynan o'sha joyda xato
 * `undefined` bo'lib komponent ichiga o'tib ketadi.
 */

const errorBodySchema = z.object({ error: z.string() });

/** Backend biladigan va tushuntira oladigan xato: 4xx/5xx + xabar. */
export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
		this.name = "ApiError";
	}

	/** Foydalanuvchiga ko'rsatiladigan xatolar 5xx dan farq qiladi. */
	get isClientFault(): boolean {
		return this.status >= 400 && this.status < 500;
	}
}

/**
 * Javob 2xx keldi, lekin shakli kutilganidan boshqa.
 *
 * `ApiError` dan ATAYLAB ajratilgan: bu foydalanuvchining xatosi emas va
 * unga ko'rsatiladigan xabar ham emas — bu backend shartnomasi
 * o'zgarganini bildiradi va tuzatilishi kerak. Alohida tur bo'lmasa, bu
 * holat "nimadir xato ketdi" ostida ko'milib qolardi.
 */
export class ApiContractError extends Error {
	constructor(
		readonly path: string,
		readonly issues: z.ZodIssue[],
	) {
		super(`API javobi kutilgan sxemaga mos kelmadi: ${path}`);
		this.name = "ApiContractError";
	}
}

/** Tarmoq uzildi, DNS ishlamadi, timeout — javob umuman kelmadi. */
export class ApiTransportError extends Error {
	constructor(
		readonly path: string,
		cause: unknown,
	) {
		super(`API ga ulanib bo'lmadi: ${path}`);
		this.name = "ApiTransportError";
		this.cause = cause;
	}
}

export interface RequestOptions {
	method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
	body?: unknown;
	/**
	 * Bearer token. Ataylab argument — modul darajasidagi global holat
	 * emas: server komponentida va brauzerda tokenning manbasi boshqa,
	 * va global o'zgaruvchi serverda so'rovlar orasida "sizib" ketardi.
	 */
	token?: string | undefined;
	/** Next'ning kesh boshqaruvi. Faqat server tomonda ta'sir qiladi. */
	revalidate?: number | false;
	/**
	 * Brauzerning HTTP keshi.
	 *
	 * Bu kerak, chunki ba'zi ochiq endpointlar (`/topics`, `/subjects`,
	 * `/languages`) `Cache-Control: public, max-age=3600` yuboradi — bu
	 * ommaviy sayt uchun to'g'ri, lekin admin panel uchun halokatli:
	 * yangi mavzu qo'shilgandan keyin ro'yxatni qayta so'rasak, brauzer
	 * bir soat davomida ESKI javobni qaytaradi va panel "saqlanmadi"
	 * bo'lib ko'rinadi. Yozgandan keyin o'qiydigan joyda `"no-store"`.
	 *
	 * `revalidate` bilan birga berilmasligi kerak — Next ikkalasini
	 * ziddiyat deb hisoblaydi.
	 */
	cache?: RequestCache;
	signal?: AbortSignal;
}

const DEFAULT_TIMEOUT_MS = 10_000;

function baseUrl(): string {
	// Server tomonda compose tarmog'i ichidagi nom ishlatiladi: TLS ham,
	// CORS ham, tashqi tarmoqqa chiqish ham kerak emas. Brauzer esa
	// faqat ommaviy manzilni biladi.
	const url =
		typeof window === "undefined"
			? (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL)
			: process.env.NEXT_PUBLIC_API_URL;

	if (!url) {
		throw new Error(
			"NEXT_PUBLIC_API_URL o'rnatilmagan. Buni jimgina localhost bilan " +
				"almashtirmaymiz: prodda noto'g'ri manzilga so'rov ketishi, " +
				"ishga tushmaslikdan ko'ra battar.",
		);
	}
	return url.replace(/\/$/, "");
}

export async function request<T>(
	path: string,
	schema: z.ZodType<T>,
	options: RequestOptions = {},
): Promise<T> {
	const { method = "GET", body, token, revalidate, cache, signal } = options;

	const headers: Record<string, string> = { Accept: "application/json" };
	if (body !== undefined) headers["Content-Type"] = "application/json";
	if (token) headers["Authorization"] = `Bearer ${token}`;

	// Chaqiruvchining signali bilan timeout'ni birlashtiramiz, aks holda
	// timeout qo'yish bekor qilish imkoniyatini yo'q qilardi.
	const timeout = AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
	const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

	let response: Response;
	try {
		response = await fetch(`${baseUrl()}${path}`, {
			method,
			headers,
			signal: combined,
			...(body !== undefined ? { body: JSON.stringify(body) } : {}),
			...(revalidate === undefined ? {} : { next: { revalidate } }),
			...(cache === undefined ? {} : { cache }),
		});
	} catch (cause) {
		throw new ApiTransportError(path, cause);
	}

	if (!response.ok) {
		// Backend har xatoni `{"error": "..."}` shaklida qaytaradi, lekin
		// nginx yoki proxy 502/504 da HTML qaytarishi mumkin — shuning
		// uchun tahlil qilishga urinamiz, majburlamaymiz.
		const parsed = errorBodySchema.safeParse(await safeJson(response));
		throw new ApiError(
			response.status,
			parsed.success ? parsed.data.error : `HTTP ${response.status}`,
		);
	}

	// 204 va bo'sh tanali javoblar uchun: sxema `z.void()` bo'lsa
	// tanani o'qishga urinmaymiz.
	if (response.status === 204) {
		return schema.parse(undefined);
	}

	const result = schema.safeParse(await safeJson(response));
	if (!result.success) {
		throw new ApiContractError(path, result.error.issues);
	}
	return result.data;
}

async function safeJson(response: Response): Promise<unknown> {
	try {
		return await response.json();
	} catch {
		return undefined;
	}
}

/** Query string yasash: `undefined` qiymatlar tushib qoladi. */
export function query(params: Record<string, string | number | undefined>): string {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== "") search.set(key, String(value));
	}
	const encoded = search.toString();
	return encoded ? `?${encoded}` : "";
}
