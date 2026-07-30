"use client";

import { authApi, type AuthDto } from "@binary/api";

/**
 * Token saqlash — faqat brauzerda.
 *
 * `"use client"` va pastdagi `assertBrowser` ikkisi ham shu fayl serverda
 * ishlamasligi uchun. Bu muhim: modul darajasidagi o'zgaruvchi Node
 * protsessida SO'ROVLAR ORASIDA bo'lishiladi, ya'ni bir foydalanuvchining
 * tokeni boshqasiga ko'rinib qolishi mumkin. Brauzerda esa har tab o'z
 * moduliga ega va bu xavf yo'q.
 *
 * Access token XOTIRADA: `localStorage` da bo'lsa XSS uni o'qib olardi va
 * qurbon sahifani yopgandan keyin ham ishlatardi. Refresh token esa
 * `localStorage` da — u yerda bo'lmasa har yangilanishda qaytadan login
 * qilishga to'g'ri kelardi.
 *
 * Qolgan xavf halol nomlanadi: XSS refresh tokenni o'qiy oladi. Buning
 * qarshi vositasi backendda — token rotatsiyasi va qayta ishlatishni
 * aniqlash: o'g'irlangan token bir marta ishlatilsa sessiya butunlay
 * bekor qilinadi. Bu o'g'irlikni to'sib qolmaydi, lekin uning muddatini
 * qisqartiradi.
 */

const REFRESH_KEY = "binary:refresh";

/** Access token muddati tugashidan qancha oldin yangilanadi. */
const REFRESH_MARGIN_MS = 60_000;

interface Tokens {
	accessToken: string;
	/** Unix sekund. */
	expiresAt: number;
}

let tokens: Tokens | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Bir vaqtda ketayotgan yangilash so'rovi. Dedup SHART: sahifada uchta
 * komponent bir paytda 401 olsa, uchta `refresh` ketardi — ikkinchisi
 * birinchisi rotatsiya qilib bo'lgan tokenni yuborardi, va backend buni
 * o'g'irlik deb hisoblab sessiyani o'chirardi. Ya'ni o'z-o'zini
 * tizimdan chiqarish.
 */
let inFlight: Promise<AuthDto | null> | null = null;

function assertBrowser(): void {
	if (typeof window === "undefined") {
		throw new Error(
			"token-store faqat brauzerda ishlatiladi. Serverda modul holati " +
				"so'rovlar orasida bo'lishiladi va tokenlar aralashib ketadi.",
		);
	}
}

export function getAccessToken(): string | null {
	return tokens?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
	assertBrowser();
	try {
		return window.localStorage.getItem(REFRESH_KEY);
	} catch {
		// Safari maxfiy rejimida `localStorage` istisno tashlaydi. Bunday
		// holatda sessiya faqat shu sahifa umriga qoladi — bu login
		// qilishga to'sqinlik qilmaydi.
		return null;
	}
}

function writeRefreshToken(value: string | null): void {
	try {
		if (value === null) window.localStorage.removeItem(REFRESH_KEY);
		else window.localStorage.setItem(REFRESH_KEY, value);
	} catch {
		/* yuqoridagi sabab */
	}
}

type Listener = (auth: AuthDto | null) => void;
const listeners = new Set<Listener>();

/** Sessiya o'zgarganda xabar beradi (provider shunga ulanadi). */
export function subscribe(listener: Listener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function emit(auth: AuthDto | null): void {
	for (const listener of listeners) listener(auth);
}

export function setSession(auth: AuthDto): void {
	assertBrowser();
	tokens = { accessToken: auth.access_token, expiresAt: auth.expires_at };
	writeRefreshToken(auth.refresh_token);
	scheduleRefresh(auth.expires_at);
	emit(auth);
}

export function clearSession(): void {
	tokens = null;
	writeRefreshToken(null);
	if (refreshTimer) clearTimeout(refreshTimer);
	refreshTimer = null;
	emit(null);
}

function scheduleRefresh(expiresAt: number): void {
	if (refreshTimer) clearTimeout(refreshTimer);

	// Jitter — ko'p tabli holat uchun. Ikkita tab bir xil `expires_at`
	// oladi, ya'ni taymer ham bir xil vaqtda ishlaydi va ikkisi bir
	// paytda rotatsiya qilishga urinadi. Tasodifiy 0–5 s tarqatish bu
	// to'qnashuvni amalda yo'q qiladi; g'olib tab yangi tokenni
	// `localStorage` ga yozadi va ikkinchisi `storage` hodisasi orqali
	// uni qabul qiladi.
	const jitter = Math.random() * 5_000;
	const delay = Math.max(expiresAt * 1000 - Date.now() - REFRESH_MARGIN_MS + jitter, 1_000);

	refreshTimer = setTimeout(() => {
		void refreshSession();
	}, delay);
}

/**
 * Sessiyani yangilaydi. Muvaffaqiyatsiz bo'lsa sessiyani tozalaydi va
 * `null` qaytaradi — chaqiruvchi login sahifasiga yuborishi kerak.
 */
export function refreshSession(): Promise<AuthDto | null> {
	assertBrowser();

	if (inFlight) return inFlight;

	const refreshToken = getRefreshToken();
	if (!refreshToken) return Promise.resolve(null);

	inFlight = authApi
		.refresh(refreshToken)
		.then((auth) => {
			setSession(auth);
			return auth;
		})
		.catch(() => {
			// Muddati o'tgan, bekor qilingan, yoki qayta ishlatish
			// aniqlangan — uchtasida ham javob bir xil: sessiya tugadi.
			clearSession();
			return null;
		})
		.finally(() => {
			inFlight = null;
		});

	return inFlight;
}

/**
 * Boshqa tab sessiyani o'zgartirganini kuzatadi.
 *
 * `storage` hodisasi FAQAT boshqa tablarda ishlaydi — o'zi yozgan tabda
 * ishlamaydi, ya'ni cheksiz sikl bo'lmaydi.
 */
export function watchOtherTabs(): () => void {
	assertBrowser();

	const onStorage = (event: StorageEvent) => {
		if (event.key !== REFRESH_KEY) return;

		if (event.newValue === null) {
			// Boshqa tabda logout qilindi.
			tokens = null;
			if (refreshTimer) clearTimeout(refreshTimer);
			refreshTimer = null;
			emit(null);
			return;
		}

		// Boshqa tab rotatsiya qildi. Bizdagi access token hali amal
		// qilishi mumkin, lekin taymerni qayta hisoblash uchun eng ishonchli
		// yo'l — yangi refresh token bilan bir marta yangilash.
		void refreshSession();
	};

	window.addEventListener("storage", onStorage);
	return () => window.removeEventListener("storage", onStorage);
}
